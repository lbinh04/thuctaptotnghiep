import pool from "@/db.js";
import nodemailer from "nodemailer";

/**
 * MoMo Callback API
 * POST /api/auth/momo-callback
 * Nhận thông báo từ MoMo khi thanh toán hoàn thành
 */
export const POST = async (req) => {
  let connection;
  try {
    const momoData = await req.json();
    console.log("📨 Nhận callback từ MoMo:", momoData);

    // ✅ Kiểm tra kết quả thanh toán
    if (momoData.resultCode === 0) {
      // Thanh toán thành công
      const orderId = momoData.orderId;
      const momoTransactionId = momoData.transId;

      connection = await pool.getConnection();

      // ✅ Cập nhật trạng thái giao dịch
      const [existingTransaction] = await connection.execute(
        "SELECT * FROM transactions WHERE transaction_id = ?",
        [orderId]
      );

      if (existingTransaction.length === 0) {
        connection.release();
        return new Response(
          JSON.stringify({ message: "Giao dịch không tồn tại" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      const transaction = existingTransaction[0];
      const { users_id, ve_id, soLuong, amount } = transaction;

      // ✅ Cập nhật trạng thái thành 'completed'
      await connection.execute(
        `UPDATE transactions SET status = ?, momo_transaction_id = ?, ngay_hoan_thanh = NOW() 
                 WHERE transaction_id = ?`,
        ["completed", momoTransactionId, orderId]
      );

      // ✅ Cập nhật vé cho user
      const ngayMua = new Date().toISOString().split("T")[0];

      // Lấy thông tin user và vé
      const [userRows] = await connection.execute(
        "SELECT username, email FROM users WHERE id = ?",
        [users_id]
      );

      const [veRows] = await connection.execute(
        "SELECT ten_ve, loai_xe, thoi_han FROM ve WHERE ve_id = ?",
        [ve_id]
      );

      if (userRows.length > 0 && veRows.length > 0) {
        const { username, email } = userRows[0];
        const { ten_ve, loai_xe, thoi_han } = veRows[0];

        // Thêm vé vào hóa đơn của user
        await connection.execute(
          `INSERT INTO ve_nguoi_dung (users_id, ten_nguoi_dung, ve_id, loai_xe, ten_ve, ngay_mua, thoi_han, so_luong) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            users_id,
            username,
            ve_id,
            loai_xe,
            ten_ve,
            ngayMua,
            thoi_han,
            soLuong,
          ]
        );

        // ✅ Gửi email xác nhận thanh toán thành công
        try {
          await sendSuccessEmail({
            toEmail: email,
            username: username,
            ten_ve: ten_ve,
            soLuong: soLuong,
            amount: amount,
            momoTransactionId: momoTransactionId,
            ngayMua: ngayMua,
            ngayHetHan: thoi_han,
          });
        } catch (emailError) {
          console.error("⚠️ Lỗi gửi email thành công:", emailError.message);
        }
      }

      connection.release();

      return new Response(
        JSON.stringify({
          message: "Thanh toán MoMo thành công!",
          transactionId: orderId,
          momoTransactionId: momoTransactionId,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      // Thanh toán thất bại
      const orderId = momoData.orderId;
      connection = await pool.getConnection();

      // ✅ Cập nhật trạng thái thành 'failed'
      await connection.execute(
        `UPDATE transactions SET status = ?, ngay_that_bai = NOW() WHERE transaction_id = ?`,
        ["failed", orderId]
      );

      connection.release();

      return new Response(
        JSON.stringify({
          message: "Thanh toán MoMo thất bại",
          resultCode: momoData.resultCode,
          errorMessage: momoData.message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    if (connection) connection.release();
    console.error("Lỗi xử lý callback MoMo:", error.message);
    return new Response(
      JSON.stringify({
        message: "Lỗi xử lý callback",
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
 * Gửi email xác nhận thanh toán thành công
 */
async function sendSuccessEmail({
  toEmail,
  username,
  ten_ve,
  soLuong,
  amount,
  momoTransactionId,
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
    from: '"BikeRental Payment" <lebinh5112004@gmail.com>',
    to: toEmail,
    subject: "✅ Thanh toán MoMo thành công!",
    html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; background-color: #f9fafb; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #16a34a; font-size: 28px; margin: 0;">✅ Thanh Toán Thành Công!</h1>
              <p style="color: #6b7280; font-size: 16px; margin-top: 8px;">Vé của bạn đã được kích hoạt</p>
            </div>

            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="font-size: 18px; color: #16a34a; margin: 0;"><strong>Xin chào ${username},</strong></p>
            </div>

            <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 16px; border-bottom: 2px solid #22c55e; padding-bottom: 8px;">📋 CHI TIẾT THANH TOÁN</h3>
            
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
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Số Lượng:</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong>${soLuong}</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Số Tiền:</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong style="color: #16a34a; font-size: 16px;">${(
                  amount / 1000
                ).toLocaleString()} VNĐ</strong></td>
              </tr>
              <tr style="background-color: #f9fafb;">
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;">Mã Giao Dịch MoMo:</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong style="font-family: monospace;">${momoTransactionId}</strong></td>
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
              <p style="font-size: 14px; color: #16a34a; margin: 0;">
                ✅ Vé của bạn đã được kích hoạt. Bạn có thể bắt đầu sử dụng dịch vụ ngay bây giờ!
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
    console.log("✅ Email xác nhận MoMo thành công gửi tới:", toEmail);
  } catch (emailError) {
    console.error("⚠️ Lỗi gửi email xác nhận:", emailError.message);
  }
}
