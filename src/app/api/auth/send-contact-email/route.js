import pool from "@/db.js";
import nodemailer from "nodemailer";

/**
 * API gửi email liên hệ hỗ trợ
 * POST /api/auth/send-contact-email
 */
export const POST = async (req) => {
  try {
    const { hoVaTen, email, sdt, tieuDe, noiDung } = await req.json();

    // ✅ Validate dữ liệu
    if (!hoVaTen || !email || !sdt || !tieuDe || !noiDung) {
      return new Response(
        JSON.stringify({
          message: "Vui lòng điền đầy đủ thông tin!",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ✅ Gửi email đến admin
    await sendEmailToAdmin({
      hoVaTen,
      email,
      sdt,
      tieuDe,
      noiDung,
      timestamp: new Date().toLocaleString("vi-VN"),
    });

    // ✅ Gửi email xác nhận tới user
    await sendConfirmationEmailToUser({
      toEmail: email,
      hoVaTen,
      tieuDe,
    });

    return new Response(
      JSON.stringify({
        message:
          "Liên hệ của bạn đã được gửi thành công! Chúng tôi sẽ phản hồi trong 24 giờ.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Lỗi gửi email liên hệ:", error.message);
    return new Response(
      JSON.stringify({
        message: "Lỗi khi gửi liên hệ. Vui lòng thử lại!",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * Gửi email tới admin
 */
async function sendEmailToAdmin({
  hoVaTen,
  email,
  sdt,
  tieuDe,
  noiDung,
  timestamp,
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
    from: '"BikeRental Contact" <lebinh5112004@gmail.com>',
    to: "lebinh5112004@gmail.com",
    subject: `📧 Liên hệ mới từ ${hoVaTen}: ${tieuDe}`,
    html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; background-color: #f9fafb; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; font-size: 24px; margin: 0;">📬 Có Liên Hệ Mới Từ Khách Hàng</h1>
            </div>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="font-size: 14px; color: #b45309; margin: 0;"><strong>⏰ Thời gian:</strong> ${timestamp}</p>
            </div>

            <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 16px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">👤 THÔNG TIN KHÁCH HÀNG</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 12px; font-weight: bold; color: #1f2937; border: 1px solid #e5e7eb; width: 30%;"><strong>Họ và Tên:</strong></td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">${hoVaTen}</td>
              </tr>
              <tr style="background-color: #f9fafb;">
                <td style="padding: 12px; font-weight: bold; color: #1f2937; border: 1px solid #e5e7eb;"><strong>Email:</strong></td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">
                  <a href="mailto:${email}" style="color: #1d4ed8; text-decoration: none;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px; font-weight: bold; color: #1f2937; border: 1px solid #e5e7eb;"><strong>Số Điện Thoại:</strong></td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">
                  <a href="tel:${sdt}" style="color: #1d4ed8; text-decoration: none;">${sdt}</a>
                </td>
              </tr>
            </table>

            <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 16px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">📝 NỘI DUNG LIÊN HỆ</h3>
            
            <div style="background-color: #f3f4f6; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="font-size: 16px; font-weight: bold; color: #1d4ed8; margin-top: 0;">Tiêu đề: ${tieuDe}</p>
              <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${noiDung}</p>
            </div>

            <div style="background-color: #dbeafe; border-left: 4px solid #1d4ed8; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="font-size: 14px; color: #1d4ed8; margin: 0;">
                <strong>💡 Gợi ý:</strong> Vui lòng phản hồi lại khách hàng trong thời gian sớm nhất.
              </p>
            </div>

            <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <div style="text-align: center; font-size: 12px; color: #9ca3af;">
              <p style="margin: 0;">© 2024 BikeRental Services - Hệ thống quản lý liên hệ</p>
            </div>
          </div>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email liên hệ gửi tới admin thành công");
  } catch (emailError) {
    console.error("⚠️ Lỗi gửi email tới admin:", emailError.message);
    throw emailError;
  }
}

/**
 * Gửi email xác nhận tới khách hàng
 */
async function sendConfirmationEmailToUser({ toEmail, hoVaTen, tieuDe }) {
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
    from: '"BikeRental Support" <lebinh5112004@gmail.com>',
    to: toEmail,
    subject: "✅ Chúng tôi đã nhận được liên hệ của bạn",
    html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; background-color: #f9fafb; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1d4ed8; font-size: 28px; margin: 0;">✅ Cảm Ơn Bạn Đã Liên Hệ</h1>
              <p style="color: #6b7280; font-size: 16px; margin-top: 8px;">BikeRental hỗ trợ khách hàng 24/7</p>
            </div>

            <div style="background-color: #dbeafe; border-left: 4px solid #1d4ed8; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="font-size: 18px; color: #1d4ed8; margin: 0;"><strong>Xin chào ${hoVaTen},</strong></p>
            </div>

            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 16px;">
              Cảm ơn bạn đã liên hệ với BikeRental. Chúng tôi đã nhận được tin nhắn của bạn với tiêu đề:
            </p>

            <div style="background-color: #f3f4f6; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="font-size: 16px; font-weight: bold; color: #1d4ed8; margin: 0;">📌 ${tieuDe}</p>
            </div>

            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 16px;">
              Đội ngũ hỗ trợ của chúng tôi sẽ xem xét yêu cầu của bạn và sẽ phản hồi trong <strong>vòng 24 giờ làm việc</strong>.
            </p>

            <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 12px;">📞 LIÊN HỆ NHANH</h3>
            <ul style="color: #6b7280; font-size: 14px; list-style: none; padding: 0; margin: 0;">
              <li>📧 Email: lebinh5112004@gmail.com</li>
              <li>📱 Điện thoại: 0377590393</li>
            </ul>

            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin-top: 24px; border-radius: 4px;">
              <p style="font-size: 14px; color: #16a34a; margin: 0;">
                <strong>💚 Lưu ý:</strong> Vui lòng giữ lại email này để theo dõi yêu cầu của bạn.
              </p>
            </div>

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
    console.log("✅ Email xác nhận gửi tới khách hàng thành công");
  } catch (emailError) {
    console.error("⚠️ Lỗi gửi email xác nhận:", emailError.message);
    // Không throw error vì email admin đã gửi thành công
  }
}
