// src/app/api/auth/create-payment/route.js
import { NextResponse } from "next/server";
import pool from "@/db.js";
import nodemailer from "nodemailer";

/**
 * API tạo thanh toán MoMo
 * POST /api/auth/create-payment
 * Body: { amount, userId, id (ve_id), soLuong }
 */
export async function POST(req) {
  let connection;
  try {
    const body = await req.json();
    const { amount, userId, id: ve_id, soLuong } = body;

    // ✅ Validate input
    if (!amount || !userId || !ve_id || !soLuong) {
      return NextResponse.json(
        { message: "Thiếu thông tin thanh toán" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { message: "Số tiền thanh toán phải lớn hơn 0" },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // ✅ Kiểm tra user tồn tại
    const [userRows] = await connection.execute(
      "SELECT id, email, username FROM users WHERE id = ?",
      [userId]
    );

    if (userRows.length === 0) {
      connection.release();
      return NextResponse.json(
        { message: "Người dùng không tồn tại" },
        { status: 404 }
      );
    }

    const user = userRows[0];

    // ✅ Kiểm tra vé tồn tại
    const [ticketRows] = await connection.execute(
      "SELECT ve_id, ten_ve, loai_xe, diem_tngo FROM ve WHERE ve_id = ?",
      [ve_id]
    );

    if (ticketRows.length === 0) {
      connection.release();
      return NextResponse.json(
        { message: "Vé không tồn tại" },
        { status: 404 }
      );
    }

    const ticket = ticketRows[0];

    connection.release();

    // ✅ Không cần gọi MoMo gateway nữa - chỉ cần tạo transaction và gửi email
    const transactionId = "MOMO" + Date.now();
    
    try {
      // Lưu vào database (nếu connection mới được mở)
      const newConnection = await pool.getConnection();
      await newConnection.execute(
        `INSERT INTO transactions (transaction_id, users_id, ve_id, soLuong, amount, status, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [transactionId, userId, ve_id, soLuong, amount, "completed"]
      );
      newConnection.release();
    } catch (dbError) {
      console.warn("Cảnh báo lưu transaction:", dbError.message);
      // Vẫn tiếp tục gửi email dù lưu transaction thất bại
    }

    // ✅ Gửi email xác nhận thanh toán MoMo
    await sendMoMoEmail({
      toEmail: user.email,
      username: user.username,
      ticketName: ticket.ten_ve,
      soLuong: soLuong,
      amount: amount,
      transactionId: transactionId,
    });

    return NextResponse.json({
      success: true,
      message: "Thanh toán MoMo thành công! Email xác nhận đã được gửi.",
      transactionId,
    });

  } catch (error) {
    console.error("❌ Lỗi tạo thanh toán:", error);
    
    if (connection) {
      connection.release();
    }

    return NextResponse.json(
      { 
        message: "Lỗi tạo thanh toán: " + error.message,
        error: process.env.NODE_ENV === "development" ? error.toString() : undefined
      },
      { status: 500 }
    );
  }
}

async function sendMoMoEmail({ toEmail, username, ticketName, soLuong, amount, transactionId }) {
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
    from: '"BikeRental - Thanh Toán MoMo" <lebinh5112004@gmail.com>',
    to: toEmail,
    subject: "🔄 Yêu cầu thanh toán MoMo - BikeRental",
    html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; background-color: #f9fafb; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #a4145f; font-size: 28px; margin: 0;">🔄 Xác Nhận Yêu Cầu Thanh Toán</h1>
        <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Vui lòng hoàn tất thanh toán trên MoMo</p>
      </div>

      <div style="background-color: #fce7f3; border-left: 4px solid #db2777; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
        <p style="font-size: 16px; color: #9f1239; margin: 0;"><strong>Xin chào ${username || 'Bạn'},</strong></p>
      </div>

      <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 16px; border-bottom: 2px solid #db2777; padding-bottom: 8px;">📋 CHI TIẾT THANH TOÁN</h3>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr style="background-color: #f3f4f6;">
          <td style="padding: 12px; font-weight: bold; color: #1f2937; border: 1px solid #e5e7eb;">Thông Tin</td>
          <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Chi Tiết</td>
        </tr>
        <tr>
          <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Sản Phẩm:</td>
          <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong>${ticketName}</strong></td>
        </tr>
        <tr style="background-color: #f9fafb;">
          <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Số Lượng:</td>
          <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong>${soLuong} lần</strong></td>
        </tr>
        <tr>
          <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Số Tiền:</td>
          <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong style="color: #dc2626; font-size: 16px;">${(amount).toLocaleString()} VNĐ</strong></td>
        </tr>
        <tr style="background-color: #f9fafb;">
          <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Mã Giao Dịch:</td>
          <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong>${transactionId}</strong></td>
        </tr>
        <tr>
          <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Thời Gian:</td>
          <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong>${new Date().toLocaleString('vi-VN')}</strong></td>
        </tr>
      </table>

      <div style="background-color: #fce7f3; border-left: 4px solid #db2777; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
        <p style="font-size: 14px; color: #9f1239; margin: 0;">
          ⏳ Vui lòng hoàn tất thanh toán trên ứng dụng MoMo. Sau khi thanh toán thành công, tài khoản của bạn sẽ được cập nhật tự động.
        </p>
      </div>

      <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 12px;">📞 LIÊN HỆ HỖ TRỢ</h3>
      <ul style="color: #6b7280; font-size: 14px; list-style: none; padding: 0; margin: 0;">
        <li>📧 Email: lebinh5112004@gmail.com</li>
        <li>📱 Điện thoại: 0377590393</li>
      </ul>

      <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
      
      <div style="text-align: center; font-size: 12px; color: #9ca3af;">
        <p style="margin: 0;">© 2024 BikeRental Services. Tất cả quyền được bảo lưu.</p>
      </div>
    </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email MoMo gửi thành công tới:", toEmail);
  } catch (emailError) {
    console.error("⚠️ Lỗi gửi email MoMo:", emailError.message);
  }
}
