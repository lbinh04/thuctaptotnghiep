import pool from "@/db.js";
import { NextResponse } from "next/server";

/**
 * API setup database - Tạo bảng transactions nếu chưa có
 * GET /api/setup-db
 */
export async function GET(req) {
  let connection;
  try {
    connection = await pool.getConnection();

    // ✅ Tạo bảng transactions
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS transactions (
        id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        transaction_id varchar(50) NOT NULL UNIQUE COMMENT 'ID giao dịch từ MoMo',
        users_id int(11) NOT NULL COMMENT 'ID người dùng',
        ve_id int(11) NOT NULL COMMENT 'ID vé',
        soLuong int(11) NOT NULL DEFAULT 1 COMMENT 'Số lượng vé',
        amount int(11) NOT NULL COMMENT 'Số tiền thanh toán (VND)',
        status enum('pending','completed','failed','cancelled') DEFAULT 'pending' COMMENT 'Trạng thái thanh toán',
        momo_transaction_id varchar(50) NULL COMMENT 'Transaction ID từ MoMo',
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        ngay_hoan_thanh timestamp NULL COMMENT 'Ngày hoàn thành thanh toán',
        FOREIGN KEY (users_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (ve_id) REFERENCES ve (ve_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `;

    await connection.execute(createTableSQL);

    // ✅ Tạo các index
    const createIndexes = [
      "CREATE INDEX IF NOT EXISTS idx_transaction_id ON transactions(transaction_id)",
      "CREATE INDEX IF NOT EXISTS idx_users_id ON transactions(users_id)",
      "CREATE INDEX IF NOT EXISTS idx_status ON transactions(status)",
      "CREATE INDEX IF NOT EXISTS idx_created_at ON transactions(created_at)",
    ];

    for (const indexSQL of createIndexes) {
      try {
        await connection.execute(indexSQL);
      } catch (e) {
        // Index có thể đã tồn tại, không báo lỗi
        console.log("Index warning:", e.message);
      }
    }

    connection.release();

    return NextResponse.json({
      success: true,
      message: "✅ Database setup thành công! Bảng transactions đã được tạo."
    });

  } catch (error) {
    console.error("❌ Lỗi setup database:", error);
    
    if (connection) {
      connection.release();
    }

    return NextResponse.json(
      { 
        success: false,
        message: "Lỗi setup database: " + error.message
      },
      { status: 500 }
    );
  }
}
