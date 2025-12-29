import pool from "@/db.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer"; // Cần thiết để gửi email

const SECRET_KEY = process.env.JWT_SECRET || "mysecretkey"; // Nên đặt vào biến môi trường trong thực tế

export const POST = async (req) => {
  let connection;
  try {
    const { searchParams } = new URL(req.url);
    const ve_id = searchParams.get("ve_id");

    if (!ve_id) {
      return new Response(JSON.stringify({ message: "Thiếu thông tin vé!" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ message: "Thiếu token!" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Xử lý cả "Bearer token" và "token"
    let token = authHeader;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7); // Remove "Bearer " prefix
    }

    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return new Response(JSON.stringify({ message: "Token không hợp lệ!" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const Id = decoded.id;
    const email = decoded.email;

    const { soLuong } = await req.json();

    // ✅ Kiểm tra số lượng hợp lệ
    if (!soLuong || parseInt(soLuong) <= 0) {
      return new Response(
        JSON.stringify({ message: "Số lượng vé phải lớn hơn 0!" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // ✅ Kiểm tra user có thẻ không
    const [userRows] = await connection.execute(
      "SELECT id, ten_nguoi_dung, so_du_diem, diem_da_su_dung, loai_the, the_id FROM the_nguoi_dung WHERE id = ?",
      [Id]
    );

    if (userRows.length === 0) {
      await connection.rollback();
      return new Response(
        JSON.stringify({
          message: `Bạn chưa có thẻ để thanh toán! Vui lòng mua thẻ trước.`,
        }),
        {
          status: 402,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { ten_nguoi_dung, so_du_diem, diem_da_su_dung, loai_the, the_id } =
      userRows[0];

    // ✅ Lấy thông tin thẻ để kiểm tra số xe tối đa
    const [cardInfoRows] = await connection.execute(
      "SELECT so_xe_toi_da FROM the WHERE the_id = ?",
      [the_id]
    );

    if (cardInfoRows.length === 0) {
      await connection.rollback();
      return new Response(
        JSON.stringify({ message: "Không tìm thấy thông tin thẻ!" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { so_xe_toi_da } = cardInfoRows[0];

    // ✅ Kiểm tra số lượng vé không vượt quá số xe tối đa
    if (parseInt(soLuong) > so_xe_toi_da) {
      await connection.rollback();
      return new Response(
        JSON.stringify({
          message: `Thẻ ${loai_the} của bạn chỉ cho phép mua tối đa ${so_xe_toi_da} vé cùng lúc! Bạn đang cố mua ${soLuong} vé.`,
          maxAllowed: so_xe_toi_da,
          requested: parseInt(soLuong),
          cardType: loai_the,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ✅ Kiểm tra vé tồn tại
    const [veRows] = await connection.execute(
      "SELECT ten_ve, loai_xe, diem_tngo, thoi_han FROM ve WHERE ve_id = ?",
      [ve_id]
    );

    if (veRows.length === 0) {
      await connection.rollback();
      return new Response(JSON.stringify({ message: "Vé không tồn tại!" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { ten_ve, loai_xe, diem_tngo, thoi_han } = veRows[0];
    const tongDiemThanhToan = diem_tngo * soLuong;

    // ✅ Lấy thông tin yêu cầu số dư tối thiểu cho loại thẻ
    const [balanceRows] = await connection.execute(
      "SELECT loai_the, so_du_toi_thieu FROM the"
    );

    if (balanceRows.length === 0) {
      await connection.rollback();
      return new Response(
        JSON.stringify({ message: "Không tìm thấy thông tin loại thẻ!" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const minBalance = balanceRows.reduce((acc, row) => {
      acc[row.loai_the] = row.so_du_toi_thieu;
      return acc;
    }, {});

    const minRequiredBalance = minBalance[loai_the] || 0;

    // ✅ Kiểm tra số dư hiện tại
    if (so_du_diem < tongDiemThanhToan) {
      await connection.rollback();
      return new Response(
        JSON.stringify({
          message: `Số dư không đủ! Bạn cần ${tongDiemThanhToan} điểm nhưng chỉ có ${so_du_diem} điểm.`,
          currentBalance: so_du_diem,
          requiredBalance: tongDiemThanhToan,
        }),
        {
          status: 402,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ✅ Kiểm tra số dư tối thiểu sau khi trừ
    const diemConLai = so_du_diem - tongDiemThanhToan;
    if (diemConLai < minRequiredBalance) {
      await connection.rollback();
      return new Response(
        JSON.stringify({
          message: `Thẻ của bạn sẽ không đủ số dư tối thiểu (${minRequiredBalance} điểm) sau giao dịch!`,
          currentBalance: so_du_diem,
          minRequiredBalance: minRequiredBalance,
        }),
        {
          status: 402,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ✅ Thực hiện trừ điểm
    const diemDaSuDungMoi = diem_da_su_dung + tongDiemThanhToan;

    await connection.execute(
      "UPDATE the_nguoi_dung SET so_du_diem = ?, diem_da_su_dung = ? WHERE id = ?",
      [diemConLai, diemDaSuDungMoi, Id]
    );

    const ngayMua = new Date().toISOString().split("T")[0];

    // ✅ Thêm vé vào hóa đơn
    await connection.execute(
      "INSERT INTO ve_nguoi_dung (users_id, ten_nguoi_dung, ve_id, loai_xe, ten_ve, ngay_mua, thoi_han, so_luong) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [Id, ten_nguoi_dung, ve_id, loai_xe, ten_ve, ngayMua, thoi_han, soLuong]
    );

    // ✅ Gửi email xác nhận TRƯỚC commit (transaction not commited yet)
    let emailSent = false;
    try {
      await sendEmail({
        toEmail: email,
        username: ten_nguoi_dung,
        theId: ve_id,
        loai_the: loai_the,
        ten_ve: ten_ve,
        soLuong: soLuong,
        tongDiemThanhToan: tongDiemThanhToan,
        diemConLai: diemConLai,
        ngayMua: ngayMua,
        ngayHetHan: thoi_han,
      });
      emailSent = true;
      console.log("✅ Email thanh toán vé gửi thành công");
    } catch (emailError) {
      console.error(
        "⚠️ Lỗi gửi email nhưng giao dịch sẽ thành công:",
        emailError.message
      );
    }

    await connection.commit();

    return new Response(
      JSON.stringify({
        success: true,
        message: emailSent
          ? "✅ Thanh toán vé thành công! Email xác nhận đã gửi."
          : "✅ Thanh toán vé thành công!",
        newBalance: diemConLai,
        pointsUsed: tongDiemThanhToan,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Lỗi thanh toán vé:", error.message);
    return new Response(
      JSON.stringify({
        message: "Lỗi khi thanh toán vé. Vui lòng thử lại!",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } finally {
    if (connection) connection.release();
  }
};

async function sendEmail({
  toEmail,
  username,
  theId,
  loai_the,
  ten_ve,
  soLuong,
  tongDiemThanhToan,
  diemConLai,
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
    subject: "✅ Bạn đã thanh toán vé thành công!",
    html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; background-color: #f9fafb; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1d4ed8; font-size: 28px; margin: 0;">✅ Thanh Toán Thành Công</h1>
              <p style="color: #6b7280; font-size: 16px; margin-top: 8px;">Cảm ơn bạn đã sử dụng dịch vụ BikeRental</p>
            </div>

            <div style="background-color: #dbeafe; border-left: 4px solid #1d4ed8; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="font-size: 18px; color: #1d4ed8; margin: 0;"><strong>Xin chào ${username},</strong></p>
            </div>

            <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 16px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">📋 CHI TIẾT ĐƠN HÀNG</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr style="background-color: #f3f4f6;">
                <td style="padding: 12px; font-weight: bold; color: #1f2937; border: 1px solid #e5e7eb;">Thông Tin</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Chi Tiết</td>
              </tr>
              <tr>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Tên Vé:</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong>${ten_ve}</strong></td>
              </tr>
              <tr style="background-color: #f9fafb;">
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Loại Thẻ:</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong>${loai_the}</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Số Lượng Vé:</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong>${soLuong}</strong></td>
              </tr>
              <tr style="background-color: #f9fafb;">
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Tổng Điểm TNGo:</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong style="color: #dc2626;">${tongDiemThanhToan} điểm</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Số Dư Còn Lại:</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong style="color: #16a34a;">${diemConLai} điểm</strong></td>
              </tr>
              <tr style="background-color: #f9fafb;">
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Ngày Mua:</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong>${ngayMua}</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Hạn Sử Dụng:</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong>${ngayHetHan}</strong></td>
              </tr>
            </table>

            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="font-size: 14px; color: #16a34a; margin: 0;">✅ Vé của bạn đã được kích hoạt. Bạn có thể bắt đầu sử dụng ngay bây giờ.</p>
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
    console.log("✅ Email thanh toán vé gửi thành công tới:", toEmail);
  } catch (emailError) {
    console.error("⚠️ Lỗi gửi email thanh toán vé:", emailError.message);
    // Không throw error vì thanh toán đã thành công
  }
}
