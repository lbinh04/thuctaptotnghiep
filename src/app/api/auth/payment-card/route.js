// Các import ở đầu file
import pool from "@/db.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer"; // Cần thiết để gửi email
const SECRET_KEY = process.env.JWT_SECRET || "mysecretkey"; // Dùng biến môi trường thực tế

export const POST = async (req) => {
  let connection;
  try {
    const { searchParams } = new URL(req.url);
    const theId = searchParams.get("theId");

    // ✅ Kiểm tra theId
    if (!theId) {
      return new Response(
        JSON.stringify({ message: "Thiếu thông tin theId!" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ✅ Kiểm tra token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ message: "Thiếu hoặc sai định dạng token!" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return new Response(JSON.stringify({ message: "Token không hợp lệ!" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const email = decoded.email;
    connection = await pool.getConnection();

    // ✅ Kiểm tra user tồn tại
    const [userRows] = await connection.execute(
      "SELECT id, username FROM users WHERE email = ?",
      [email]
    );

    if (userRows.length === 0) {
      connection.release();
      return new Response(
        JSON.stringify({ message: "Không tìm thấy người dùng!" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const user = userRows[0];
    const nguoiDungId = user.id;
    const tenNguoiDung = user.username;

    // ✅ Kiểm tra user đã có thẻ này chưa (duplicate)
    const [existingCard] = await connection.execute(
      "SELECT the_id FROM the_nguoi_dung WHERE id = ? AND the_id = ?",
      [nguoiDungId, theId]
    );

    if (existingCard.length > 0) {
      connection.release();
      return new Response(
        JSON.stringify({
          message: "Bạn đã sở hữu thẻ này rồi! Không thể mua lại.",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ✅ Kiểm tra thẻ tồn tại
    const [theRows] = await connection.execute(
      "SELECT * FROM the WHERE the_id = ?",
      [theId]
    );

    if (theRows.length === 0) {
      connection.release();
      return new Response(JSON.stringify({ message: "Thẻ không tồn tại!" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { loai_the, phi_kich_hoat, diem_thuong } = theRows[0];
    const so_du_diem = diem_thuong || 0;

    // Tính phí cần thanh toán theo quy tắc:
    // - Nếu user chưa có thẻ nào: RideUp được miễn phí (0), các thẻ khác tính phí mở thẻ đầy đủ
    // - Nếu user đã có thẻ hiện tại: phí nâng hạng = phi_kich_hoat(target) - phi_kich_hoat(current) (>=0)
    const [userCards] = await connection.execute(
      `SELECT tn.the_id, t.loai_the AS loai_the_hien_tai, t.phi_kich_hoat AS phi_hien_tai
       FROM the_nguoi_dung tn
       JOIN the t ON tn.the_id = t.the_id
       WHERE tn.id = ?
       ORDER BY tn.ngay_mua DESC`,
      [nguoiDungId]
    );

    let feeToPay = phi_kich_hoat;
    if (userCards.length > 0) {
      const current = userCards[0];
      const phiCurrent = current.phi_hien_tai || 0;
      feeToPay = phi_kich_hoat - phiCurrent;
      if (feeToPay < 0) feeToPay = 0;
    } else {
      // no existing card
      if (loai_the === "RideUp") feeToPay = 0;
      else feeToPay = phi_kich_hoat;
    }

    // Nếu có phí > 0 và client chưa confirm, trả về thông tin phí để client xử lý thanh toán trước
    const confirm = searchParams.get("confirm");
    if (feeToPay > 0 && confirm !== "true") {
      connection.release();
      return new Response(
        JSON.stringify({
          message: "Cần thanh toán phí mở/đổi thẻ.",
          fee: feeToPay,
          requireConfirmation: true,
        }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }

    const ngayMua = new Date().toISOString().split("T")[0];
    const ngayHetHan = new Date();
    ngayHetHan.setFullYear(ngayHetHan.getFullYear() + 1);
    const formattedNgayHetHan = ngayHetHan.toISOString().split("T")[0];

    // ✅ Thêm thẻ cho user (đã được confirm nếu có phí)
    try {
      await connection.execute(
        "INSERT INTO the_nguoi_dung (id, ten_nguoi_dung, the_id, loai_the, so_du_diem, diem_da_su_dung, ngay_mua, ngay_het_han) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          nguoiDungId,
          tenNguoiDung,
          theId,
          loai_the,
          so_du_diem,
          0,
          ngayMua,
          formattedNgayHetHan,
        ]
      );
    } catch (dbError) {
      connection.release();
      console.error("Lỗi DB:", dbError.message);
      return new Response(
        JSON.stringify({
          message: "Lỗi khi thêm thẻ. Thẻ này có thể đã được sở hữu trước đó.",
          error: dbError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ✅ Gửi email xác nhận (không ảnh hưởng đến kết quả nếu lỗi)
    try {
      await sendEmail({
        toEmail: email,
        username: tenNguoiDung,
        theId,
        loai_the,
        phi_kich_hoat,
        so_du_diem,
        ngayMua,
        ngayHetHan: formattedNgayHetHan,
      });
    } catch (emailError) {
      console.error(
        "Cảnh báo: Lỗi gửi email nhưng giao dịch thẻ đã thành công:",
        emailError.message
      );
    }

    connection.release();

    const resultPayload = {
      message: "Mua thẻ thành công!",
      card: {
        theId,
        loai_the,
        so_du_diem,
        ngayMua,
        ngayHetHan: formattedNgayHetHan,
      },
    };

    // Nếu trước đó có phí cần thanh toán, báo lại trong payload
    if (feeToPay > 0) {
      resultPayload.paidFee = feeToPay;
    }

    return new Response(JSON.stringify(resultPayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (connection) connection.release();
    console.error("Lỗi mua thẻ:", error.message);
    return new Response(
      JSON.stringify({
        message: "Lỗi khi mua thẻ. Vui lòng thử lại!",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// =============================
// ======= sendEmail() ========
// =============================
async function sendEmail({
  toEmail,
  username,
  theId,
  loai_the,
  phi_kich_hoat,
  so_du_diem,
  ngayMua,
  ngayHetHan,
}) {
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
    subject: "✅ Bạn đã mua thẻ thành công!",
    html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; background-color: #f9fafb; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1d4ed8; font-size: 28px; margin: 0;">✅ Mua Thẻ Thành Công</h1>
              <p style="color: #6b7280; font-size: 16px; margin-top: 8px;">Cảm ơn bạn đã sử dụng dịch vụ BikeRental</p>
            </div>

            <div style="background-color: #dbeafe; border-left: 4px solid #1d4ed8; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="font-size: 18px; color: #1d4ed8; margin: 0;"><strong>Xin chào ${username},</strong></p>
            </div>

            <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 16px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">💳 CHI TIẾT THẺ</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr style="background-color: #f3f4f6;">
                <td style="padding: 12px; font-weight: bold; color: #1f2937; border: 1px solid #e5e7eb;">Thông Tin</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Chi Tiết</td>
              </tr>
              <tr>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Mã Thẻ:</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong style="font-family: monospace; font-size: 14px;">${theId}</strong></td>
              </tr>
              <tr style="background-color: #f9fafb;">
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Loại Thẻ:</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong>${loai_the}</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Phí Kích Hoạt:</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong>${phi_kich_hoat}</strong></td>
              </tr>
              <tr style="background-color: #f9fafb;">
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Điểm Khởi Tạo:</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong style="color: #16a34a;">${so_du_diem} điểm TNGo</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Ngày Mua:</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong>${ngayMua}</strong></td>
              </tr>
              <tr style="background-color: #f9fafb;">
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Hạn Sử Dụng:</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong>${ngayHetHan}</strong></td>
              </tr>
            </table>

            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="font-size: 14px; color: #16a34a; margin: 0;">✅ Thẻ của bạn đã được kích hoạt. Bạn có thể bắt đầu mua vé ngay bây giờ.</p>
            </div>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="font-size: 14px; color: #b45309; margin: 0;"><strong>💡 Gợi ý:</strong> Hãy tham khảo bảng giá vé để chọn vé phù hợp với nhu cầu của bạn.</p>
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
    console.log("✅ Email mua thẻ gửi thành công tới:", toEmail);
  } catch (emailError) {
    console.error("⚠️ Lỗi gửi email mua thẻ:", emailError.message);
  }
}
