import pool from "@/db.js"; // Đảm bảo đường dẫn đúng
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "mysecretkey";

export async function POST(req) {
  try {
    const { email, password, username, phone } = await req.json();

    // Kiểm tra nếu email là adminTNGO@gmail.com thì role là 'Admin', ngược lại là 'User'
    const role = email === "adminTNGO@gmail.com" ? "admin" : "user";

    // Kiểm tra xem email hoặc số điện thoại đã tồn tại chưa
    const [existingUsers] = await pool.execute(
      "SELECT * FROM users WHERE email = ? OR phone = ?",
      [email, phone]
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.email === email) {
        return new Response(JSON.stringify({ message: "Email đã tồn tại!" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Lưu vào database
    const [result] = await pool.execute(
      "INSERT INTO users (email, password, username, phone, role) VALUES (?, ?, ?, ?, ?)",
      [email, hashedPassword, username, phone, role] // Thêm `role` vào cột cuối cùng
    );

    const userId = result.insertId;

    // NOTE: Removed automatic issuance of promotional cards/points on register.
    // If you want to grant a card/points later, call the dedicated purchase API.

    // ✅ Tạo JWT token
    const token = jwt.sign(
      {
        id: userId,
        email: email,
        username: username,
        role: role,
      },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    return new Response(
      JSON.stringify({
        message: "Đăng ký thành công! Vui lòng mua thẻ khi cần.",
        token: token,
        user: {
          id: userId,
          email: email,
          username: username,
          role: role,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: "Tài khoản đã tồn tại!",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
