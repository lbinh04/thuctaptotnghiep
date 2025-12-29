import pool from "@/db.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer"; // Cần thiết để gửi email

const SECRET_KEY = process.env.JWT_SECRET || "mysecretkey";

export const POST = async (req) => {
  let connection;
  try {
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const id = searchParams.get("id") || "1";

    if (!id) {
      return new Response(
        JSON.stringify({ message: "Thiếu thông tin điểm TNGO!" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { soLuong } = await req.json();

    if (!soLuong || parseInt(soLuong) <= 0) {
      return new Response(
        JSON.stringify({
          message: "Số lượng không hợp lệ! Vui lòng nhập số lượng > 0",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ✅ Hạn chế số lượng gói nạp tối đa (mỗi lần tối đa 10 gói)
    if (parseInt(soLuong) > 10) {
      return new Response(
        JSON.stringify({
          message: "Lỗi! Mỗi lần nạp tối đa 10 gói. Vui lòng giảm số lượng.",
          maxQuantity: 10,
          requestedQuantity: parseInt(soLuong),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Lấy dữ liệu nạp từ bảng bang_gia
    const [rows] = await pool.execute(
      "SELECT diem_tngo FROM bang_gia WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ message: "Không tìm thấy thông tin thẻ." }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { diem_tngo } = rows[0];

    const authHeader = req.headers.get("authorization");
    console.log(
      "🔍 Authorization header received:",
      authHeader ? authHeader.substring(0, 50) + "..." : "MISSING"
    );

    if (!authHeader) {
      return new Response(
        JSON.stringify({ message: "Thiếu token! Vui lòng đăng nhập lại." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Xử lý "Bearer token"
    let token = authHeader;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7); // Remove "Bearer " prefix
    }

    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      console.error("JWT verification error:", err.message);
      return new Response(
        JSON.stringify({
          message: "Token không hợp lệ! Vui lòng đăng nhập lại.",
          error: err.message,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = decoded.id;
    const email = decoded.email;

    // Lấy số dư người dùng
    const [userRows] = await pool.execute(
      "SELECT so_du_diem FROM the_nguoi_dung WHERE id = ?",
      [userId]
    );

    if (userRows.length === 0) {
      return new Response(
        JSON.stringify({ message: "Không tìm thấy người dùng." }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const so_du_diem =
      parseFloat(userRows[0].so_du_diem) +
      parseFloat(diem_tngo) * parseInt(soLuong);
    // Cập nhật số dư
    await pool.execute(
      "UPDATE the_nguoi_dung SET so_du_diem = ? WHERE id = ?",
      [so_du_diem, userId]
    );

    // ✅ Lấy tên người dùng để gửi email đầy đủ
    const [userInfoRows] = await pool.execute(
      "SELECT ten_nguoi_dung FROM the_nguoi_dung WHERE id = ?",
      [userId]
    );

    const tenNguoiDung =
      userInfoRows.length > 0 ? userInfoRows[0].ten_nguoi_dung : "Khách hàng";

    // ✅ Gửi email xác nhận trước khi commit
    try {
      await sendEmail({
        toEmail: email,
        username: tenNguoiDung,
        diemNap: diem_tngo * parseInt(soLuong),
        soLuong: soLuong,
        soDuMoi: so_du_diem,
      });
      console.log("✅ Email nạp điểm gửi thành công");
    } catch (emailError) {
      console.error("⚠️ Lỗi gửi email nạp điểm:", emailError.message);
      // Không throw - giao dịch vẫn thành công
    }

    await connection.commit();
    return new Response(
      JSON.stringify({
        success: true,
        message: "Nạp điểm thành công! Email xác nhận đã gửi.",
        soDuMoi: so_du_diem,
        diemNap: diem_tngo * parseInt(soLuong),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Lỗi:", error.message);
    return new Response(
      JSON.stringify({ message: "Lỗi xử lý!", error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } finally {
    if (connection) connection.release();
  }
};

async function sendEmail({ toEmail, username, diemNap, soLuong, soDuMoi }) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "lebinh5112004@gmail.com",
      pass: "guyestsszkrhvwse",
    },
  });

  const mailOptions = {
    from: '"BikeRental App" <lebinh5112004@gmail.com>',
    to: toEmail,
    subject: "✅ Bạn đã nạp điểm TNGo thành công!",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; background-color: #f9fafb; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1d4ed8; font-size: 28px; margin: 0;">✅ Nạp Điểm Thành Công</h1>
          <p style="color: #6b7280; font-size: 16px; margin-top: 8px;">Cảm ơn bạn đã sử dụng dịch vụ BikeRental</p>
        </div>

        <div style="background-color: #dbeafe; border-left: 4px solid #1d4ed8; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
          <p style="font-size: 18px; color: #1d4ed8; margin: 0;"><strong>Xin chào ${username},</strong></p>
        </div>

        <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 16px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">💰 CHI TIẾT NẠP ĐIỂM</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr style="background-color: #f3f4f6;">
            <td style="padding: 12px; font-weight: bold; color: #1f2937; border: 1px solid #e5e7eb;">Thông Tin</td>
            <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Chi Tiết</td>
          </tr>
          <tr>
            <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Số Lượng Gói Nạp:</td>
            <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong>${soLuong} gói</strong></td>
          </tr>
          <tr style="background-color: #f9fafb;">
            <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Tổng Điểm Được Nạp:</td>
            <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong style="color: #16a34a;">${diemNap} điểm TNGo</strong></td>
          </tr>
          <tr>
            <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Số Dư Hiện Tại:</td>
            <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong style="color: #1d4ed8;">${soDuMoi} điểm</strong></td>
          </tr>
          <tr style="background-color: #f9fafb;">
            <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Thời Gian Nạp:</td>
            <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong>${new Date().toLocaleString(
              "vi-VN"
            )}</strong></td>
          </tr>
        </table>

        <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
          <p style="font-size: 14px; color: #16a34a; margin: 0;">✅ Điểm của bạn đã được cộng thành công. Bạn có thể mua vé hoặc tiếp tục nạp điểm ngay bây giờ.</p>
        </div>

        <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 12px;">📞 LIÊN HỆ HỖ TRỢ</h3>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">
          Nếu có bất kỳ thắc mắc hoặc cần hỗ trợ, vui lòng liên hệ với chúng tôi:
        </p>
        <ul style="color: #6b7280; font-size: 14px; list-style: none; padding: 0; margin: 0;">
          <li>📧 Email: lebinh5112004@gmail.com</li>
          <li>📱 Điện thoại: 0377590393</li>
        </ul>

        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <div style="text-align: center; font-size: 12px; color: #9ca3af;">
          <p style="margin: 0;">© 2024 BikeRental Services. Tất cả quyền được bảo lưu.</p>
          <p style="margin: 8px 0 0 0;">Đây là email tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email nạp điểm gửi thành công tới:", toEmail);
  } catch (emailError) {
    console.error("⚠️ Lỗi gửi email nạp điểm:", emailError.message);
  }
}
