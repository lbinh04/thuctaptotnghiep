import pool from "@/db.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import https from "https";

const SECRET_KEY = process.env.JWT_SECRET || "mysecretkey";

// MoMo API Configuration
const MOMO_API_URL = "https://test-payment.momo.vn/v1/direct-payment/qr-code";
const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || "MOMOMN092023";
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
const MOMO_SECRET_KEY =
  process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVQp";

/**
 * API thanh toán bằng MoMo
 * POST /api/auth/payment-momo
 * Query params: ve_id (ID vé)
 * Body: { soLuong: number }
 */
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

    // ✅ Lấy thông tin user
    const [userRows] = await connection.execute(
      "SELECT id, username, email FROM users WHERE id = ?",
      [Id]
    );

    if (userRows.length === 0) {
      connection.release();
      return new Response(
        JSON.stringify({ message: "Người dùng không tồn tại!" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { username } = userRows[0];

    // ✅ Lấy thông tin vé
    const [veRows] = await connection.execute(
      "SELECT ten_ve, loai_xe, diem_tngo, thoi_han FROM ve WHERE ve_id = ?",
      [ve_id]
    );

    if (veRows.length === 0) {
      connection.release();
      return new Response(JSON.stringify({ message: "Vé không tồn tại!" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { ten_ve, loai_xe, diem_tngo, thoi_han } = veRows[0];
    const tongDiemThanhToan = diem_tngo * soLuong;

    // ✅ Tạo đơn hàng MoMo
    const orderId = `BIKE_${Date.now()}_${Id}`;
    const amount = tongDiemThanhToan * 1000; // Giả sử 1 điểm = 1000 VNĐ (điều chỉnh theo nhu cầu)
    const orderInfo = `Thanh toan ve ${ten_ve} - so luong ${soLuong}`;
    const returnUrl = "http://localhost:3000/payment-success";
    const notifyUrl = "http://localhost:3000/api/auth/momo-callback";

    // ✅ Tạo chữ ký MoMo
    const signature = generateSignature(orderId, amount, MOMO_SECRET_KEY);

    const momoRequest = {
      partnerCode: MOMO_PARTNER_CODE,
      accessKey: MOMO_ACCESS_KEY,
      requestId: orderId,
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo,
      returnUrl: returnUrl,
      notifyUrl: notifyUrl,
      requestType: "captureMoMoWallet",
      signature: signature,
    };

    // ✅ Gọi MoMo API
    const momoResponse = await callMoMoAPI(momoRequest);

    if (momoResponse.resultCode !== 0) {
      connection.release();
      return new Response(
        JSON.stringify({
          message: "Lỗi khi tạo mã QR MoMo",
          error: momoResponse.message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ✅ Lưu giao dịch vào database (trạng thái: pending)
    const transactionId = `TXN_${Date.now()}`;
    const ngayMua = new Date().toISOString().split("T")[0];

    await connection.execute(
      `INSERT INTO transactions (transaction_id, users_id, ve_id, soLuong, amount, payment_method, status, ngay_tao, return_url) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transactionId,
        Id,
        ve_id,
        soLuong,
        amount,
        "momo",
        "pending",
        ngayMua,
        momoResponse.qrCodeUrl,
      ]
    );

    // ✅ Gửi email thông báo
    try {
      await sendPaymentInitiatedEmail({
        toEmail: email,
        username: username,
        ten_ve: ten_ve,
        soLuong: soLuong,
        tongDiemThanhToan: tongDiemThanhToan,
        amount: amount,
        momoUrl: momoResponse.qrCodeUrl,
      });
    } catch (emailError) {
      console.error("⚠️ Lỗi gửi email:", emailError.message);
    }

    connection.release();

    return new Response(
      JSON.stringify({
        message: "Tạo mã QR MoMo thành công!",
        qrCode: momoResponse.qrCodeUrl,
        amount: amount,
        orderId: orderId,
        transactionId: transactionId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    if (connection) connection.release();
    console.error("Lỗi thanh toán MoMo:", error.message);
    return new Response(
      JSON.stringify({
        message: "Lỗi khi xử lý thanh toán MoMo",
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
 * Tạo chữ ký MoMo
 */
function generateSignature(requestId, amount, secretKey) {
  const crypto = require("crypto");
  const data = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&orderId=${requestId}&partnerCode=${MOMO_PARTNER_CODE}&requestId=${requestId}`;
  const hash = crypto
    .createHmac("sha256", secretKey)
    .update(data)
    .digest("hex");
  return hash;
}

/**
 * Gọi MoMo API
 */
function callMoMoAPI(request) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "test-payment.momo.vn",
      port: 443,
      path: "/v1/direct-payment/qr-code",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(JSON.stringify(request)),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve(JSON.parse(data));
      });
    });

    req.on("error", (e) => {
      reject(e);
    });

    req.write(JSON.stringify(request));
    req.end();
  });
}

/**
 * Gửi email thông báo
 */
async function sendPaymentInitiatedEmail({
  toEmail,
  username,
  ten_ve,
  soLuong,
  tongDiemThanhToan,
  amount,
  momoUrl,
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
    subject: "🔐 Thực hiện thanh toán vé bằng MoMo",
    html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; background-color: #f9fafb; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #a4073a; font-size: 28px; margin: 0;">🔐 Thanh Toán Bằng MoMo</h1>
              <p style="color: #6b7280; font-size: 16px; margin-top: 8px;">Quét mã QR để hoàn thành thanh toán</p>
            </div>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="font-size: 14px; color: #b45309; margin: 0;"><strong>⏰ Thời hạn:</strong> Vui lòng hoàn thành thanh toán trong vòng 15 phút</p>
            </div>

            <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 16px; border-bottom: 2px solid #a4073a; padding-bottom: 8px;">📋 CHI TIẾT ĐẶT HÀNG</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr style="background-color: #f3f4f6;">
                <td style="padding: 12px; font-weight: bold; color: #1f2937; border: 1px solid #e5e7eb;">Tên Vé</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong>${ten_ve}</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px; font-weight: bold; color: #1f2937; border: 1px solid #e5e7eb;">Số Lượng</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong>${soLuong}</strong></td>
              </tr>
              <tr style="background-color: #f3f4f6;">
                <td style="padding: 12px; font-weight: bold; color: #1f2937; border: 1px solid #e5e7eb;">Tổng Điểm</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong>${tongDiemThanhToan} điểm</strong></td>
              </tr>
              <tr>
                <td style="padding: 12px; font-weight: bold; color: #1f2937; border: 1px solid #e5e7eb;">Số Tiền</td>
                <td style="padding: 12px; color: #1f2937; border: 1px solid #e5e7eb;"><strong style="color: #dc2626; font-size: 18px;">${(
                  amount / 1000
                ).toLocaleString()} VNĐ</strong></td>
              </tr>
            </table>

            <div style="background-color: #f3f4f6; border: 2px solid #a4073a; padding: 20px; text-align: center; margin-bottom: 24px; border-radius: 8px;">
              <p style="color: #1f2937; font-weight: bold; margin-top: 0;">📲 Quét mã QR MoMo dưới đây:</p>
              <p style="font-size: 14px; color: #6b7280; margin: 12px 0;">
                <a href="${momoUrl}" style="color: #1d4ed8; text-decoration: none; word-break: break-all;">${momoUrl}</a>
              </p>
              <p style="color: #6b7280; font-size: 12px; margin-bottom: 0;">Hoặc nhấn vào link trên để thanh toán</p>
            </div>

            <div style="background-color: #dbeafe; border-left: 4px solid #1d4ed8; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="font-size: 14px; color: #1d4ed8; margin: 0;">
                <strong>💡 Gợi ý:</strong> Sau khi thanh toán thành công, vé của bạn sẽ được kích hoạt ngay tức thì.
              </p>
            </div>

            <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 12px;">📞 LIÊN HỆ HỖ TRỢ</h3>
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">
              Nếu có vấn đề với thanh toán, vui lòng liên hệ:
            </p>
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
    console.log("✅ Email thanh toán MoMo gửi thành công");
  } catch (emailError) {
    console.error("⚠️ Lỗi gửi email MoMo:", emailError.message);
  }
}
