-- ✅ Tạo bảng transactions để lưu thông tin thanh toán
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `transaction_id` varchar(50) NOT NULL UNIQUE COMMENT 'ID giao dịch từ MoMo',
  `users_id` int(11) NOT NULL COMMENT 'ID người dùng',
  `ve_id` int(11) NOT NULL COMMENT 'ID vé',
  `soLuong` int(11) NOT NULL DEFAULT 1 COMMENT 'Số lượng vé',
  `amount` int(11) NOT NULL COMMENT 'Số tiền thanh toán (VND)',
  `status` enum('pending','completed','failed','cancelled') DEFAULT 'pending' COMMENT 'Trạng thái thanh toán',
  `momo_transaction_id` varchar(50) NULL COMMENT 'Transaction ID từ MoMo',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `ngay_hoan_thanh` timestamp NULL COMMENT 'Ngày hoàn thành thanh toán',
  FOREIGN KEY (`users_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`ve_id`) REFERENCES `ve` (`ve_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ✅ Tạo index để tìm kiếm nhanh
CREATE INDEX idx_transaction_id ON transactions(transaction_id);
CREATE INDEX idx_users_id ON transactions(users_id);
CREATE INDEX idx_status ON transactions(status);
CREATE INDEX idx_created_at ON transactions(created_at);
