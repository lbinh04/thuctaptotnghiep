import nodemailer from "nodemailer";

/**
 * API kiểm tra chức năng gửi email
 * GET /api/test-email
 * POST /api/test-email
 */

// Test configuration
const ZOHO_CONFIG = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "lebinh5112004@gmail.com",
    pass: "guyestsszkrhvwse",
  },
};

export const GET = async (req) => {
  return new Response(
    JSON.stringify({
      message: "📧 Email Test API",
      instructions: "POST để gửi email test",
      endpoints: {
        contactEmail: "POST /api/test-email?type=contact",
        paymentTicket: "POST /api/test-email?type=ticket",
        paymentCard: "POST /api/test-email?type=card",
        paymentMomo: "POST /api/test-email?type=momo",
      },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};

export const POST = async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const testType = searchParams.get("type") || "contact";

    let testResult;

    if (testType === "contact") {
      testResult = await testContactEmail();
    } else if (testType === "ticket") {
      testResult = await testPaymentTicketEmail();
    } else if (testType === "card") {
      testResult = await testPaymentCardEmail();
    } else if (testType === "momo") {
      testResult = await testMomoEmail();
    } else {
      return new Response(
        JSON.stringify({ message: "Loại test không hợp lệ" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(testResult), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Lỗi test email:", error.message);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Lỗi khi test email",
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * Test gửi email liên hệ
 */
async function testContactEmail() {
  const transporter = nodemailer.createTransport(ZOHO_CONFIG);

  const mailOptions = {
    from: '"BikeRental Test" <lebinh5112004@gmail.com>',
    to: "lebinh5112004@gmail.com",
    subject: "🧪 TEST: Email Liên Hệ - Kiểm Tra Chức Năng",
    html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #f9fafb;">
            <h2 style="color: #2563eb;">🧪 Kiểm Tra Email Liên Hệ</h2>
            <p>Đây là email test để kiểm tra chức năng gửi email liên hệ.</p>
            <div style="background-color: #dbeafe; padding: 12px; border-radius: 4px; margin-top: 16px;">
                <p><strong>✅ Nếu bạn nhận được email này, tức là:</strong></p>
                <ul>
                    <li>✓ Zoho SMTP đang hoạt động</li>
                    <li>✓ Thông tin xác thực Zoho đúng</li>
                    <li>✓ Email liên hệ có thể gửi thành công</li>
                </ul>
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">Thời gian: ${new Date().toLocaleString(
              "vi-VN"
            )}</p>
        </div>
        `,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    return {
      status: "success",
      type: "contact",
      message: "✅ Email liên hệ test gửi thành công!",
      details: {
        to: mailOptions.to,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      status: "error",
      type: "contact",
      message: "❌ Lỗi gửi email liên hệ",
      error: error.message,
    };
  }
}

/**
 * Test gửi email thanh toán vé
 */
async function testPaymentTicketEmail() {
  const transporter = nodemailer.createTransport(ZOHO_CONFIG);

  const mailOptions = {
    from: '"BikeRental Payment" <lebinh5112004@gmail.com>',
    to: "lebinh5112004@gmail.com",
    subject: "🧪 TEST: Xác Nhận Thanh Toán Vé",
    html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #f9fafb;">
            <h2 style="color: #16a34a;">✅ Xác Nhận Thanh Toán Vé</h2>
            <p>Test email xác nhận thanh toán vé.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                <tr style="background-color: #f3f4f6;">
                    <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Thông Tin</strong></td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Chi Tiết</strong></td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">Tên Vé</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">Vé Tester Demo</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">Số Lượng</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">2</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">Điểm Thanh Toán</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong style="color: #16a34a;">500 points</strong></td>
                </tr>
            </table>
            <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">Thời gian: ${new Date().toLocaleString(
              "vi-VN"
            )}</p>
        </div>
        `,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    return {
      status: "success",
      type: "ticket",
      message: "✅ Email thanh toán vé test gửi thành công!",
      details: {
        to: mailOptions.to,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      status: "error",
      type: "ticket",
      message: "❌ Lỗi gửi email thanh toán vé",
      error: error.message,
    };
  }
}

/**
 * Test gửi email thanh toán thẻ
 */
async function testPaymentCardEmail() {
  const transporter = nodemailer.createTransport(ZOHO_CONFIG);

  const mailOptions = {
    from: '"BikeRental Payment" <lebinh5112004@gmail.com>',
    to: "lebinh5112004@gmail.com",
    subject: "🧪 TEST: Xác Nhận Thanh Toán Thẻ",
    html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #f9fafb;">
            <h2 style="color: #2563eb;">✅ Xác Nhận Thanh Toán Thẻ</h2>
            <p>Test email xác nhận thanh toán thẻ.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                <tr style="background-color: #f3f4f6;">
                    <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Thông Tin</strong></td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Chi Tiết</strong></td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">Loại Thẻ</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">Thẻ Demo Test</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">Số Dư Khởi Tạo</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong style="color: #2563eb;">1000 điểm</strong></td>
                </tr>
            </table>
            <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">Thời gian: ${new Date().toLocaleString(
              "vi-VN"
            )}</p>
        </div>
        `,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    return {
      status: "success",
      type: "card",
      message: "✅ Email thanh toán thẻ test gửi thành công!",
      details: {
        to: mailOptions.to,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      status: "error",
      type: "card",
      message: "❌ Lỗi gửi email thanh toán thẻ",
      error: error.message,
    };
  }
}

/**
 * Test gửi email thanh toán MoMo
 */
async function testMomoEmail() {
  const transporter = nodemailer.createTransport(ZOHO_CONFIG);

  const mailOptions = {
    from: '"BikeRental Payment" <lebinh5112004@gmail.com>',
    to: "lebinh5112004@gmail.com",
    subject: "🧪 TEST: Xác Nhận Thanh Toán MoMo",
    html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #f9fafb;">
            <h2 style="color: #e91e63;">✅ Xác Nhận Thanh Toán MoMo</h2>
            <p>Test email xác nhận thanh toán MoMo.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                <tr style="background-color: #f3f4f6;">
                    <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Thông Tin</strong></td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Chi Tiết</strong></td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">Số Tiền</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong style="color: #e91e63;">500.000 VNĐ</strong></td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">Mã Giao Dịch</td>
                    <td style="padding: 10px; border: 1px solid #e5e7eb;">BIKE_TEST_123456</td>
                </tr>
            </table>
            <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">Thời gian: ${new Date().toLocaleString(
              "vi-VN"
            )}</p>
        </div>
        `,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    return {
      status: "success",
      type: "momo",
      message: "✅ Email thanh toán MoMo test gửi thành công!",
      details: {
        to: mailOptions.to,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      status: "error",
      type: "momo",
      message: "❌ Lỗi gửi email thanh toán MoMo",
      error: error.message,
    };
  }
}
