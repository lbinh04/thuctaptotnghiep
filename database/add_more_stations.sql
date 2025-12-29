-- Thêm các trạm mới cho mỗi tỉnh thành
-- Mỗi tỉnh thêm 10 trạm mới

-- ========== TP HỒ CHÍ MINH - Thêm 10 trạm mới ==========
INSERT INTO `tram` (`id_tram`, `thanh_pho`, `ten_tram`, `dia_chi`, `vi_do`, `kinh_do`) VALUES
(101, 'Hồ Chí Minh', 'Trung tâm Quảng Trường Cách Mạng', '135 Nguyễn Huệ - Phường Bến Nghé - Quận 1 - TP Hồ Chí Minh', 10.7721, 106.7038),
(102, 'Hồ Chí Minh', 'Bệnh Viện Chợ Rẫy', '201C Nguyễn Trãi - Phường Bến Thành - Quận 1 - TP Hồ Chí Minh', 10.7686, 106.6983),
(103, 'Hồ Chí Minh', 'Trường Đại Học Bách Khoa', '268 Lý Thường Kiệt - Phường 14 - Quận 10 - TP Hồ Chí Minh', 10.7599, 106.6559),
(104, 'Hồ Chí Minh', 'Tòa Nhà Saigon Center', '65 Lê Lợi - Phường Bến Nghé - Quận 1 - TP Hồ Chí Minh', 10.7776, 106.7027),
(105, 'Hồ Chí Minh', 'Trung Tâm Thương Mại Parkson', '25 Quang Trung - Phường Nguyễn Thái Bình - Quận 1 - TP Hồ Chí Minh', 10.770, 106.699),
(106, 'Hồ Chí Minh', 'Công Viên Tao Đàn', '2 Phạm Ngọc Thạch - Phường Bến Nghé - Quận 1 - TP Hồ Chí Minh', 10.7812, 106.7001),
(107, 'Hồ Chí Minh', 'Ga Metro Bến Thành', '119 Lý Tự Trọng - Phường Bến Thành - Quận 1 - TP Hồ Chí Minh', 10.7754, 106.7000),
(108, 'Hồ Chí Minh', 'Thư Viện Tỉnh Hồ Chí Minh', '1 Tôn Đức Thắng - Phường Bến Nghé - Quận 1 - TP Hồ Chí Minh', 10.7807, 106.7051),
(109, 'Hồ Chí Minh', 'Bảo Tàng Chứng Tích', '65 Lý Tự Trọng - Phường Bến Nghé - Quận 1 - TP Hồ Chí Minh', 10.7782, 106.7032),
(110, 'Hồ Chí Minh', 'Khu Đô Thị Phú Mỹ Hưng', '250 Đường Nguyễn Hữu Thọ - Phường Tân Phú - Quận 7 - TP Hồ Chí Minh', 10.7283, 106.7199),

-- ========== VŨNG TÀU - Thêm 10 trạm mới ==========
(201, 'Vũng Tàu', 'Cầu Sông Rài', '100 Nguyễn Công Trứ - Phường Thắng Tam - TP Vũng Tàu', 10.3415, 107.0833),
(202, 'Vũng Tàu', 'Bến Cảng Tàu du lịch', '50 Tôn Đức Thắng - Phường 1 - TP Vũng Tàu', 10.3523, 107.0730),
(203, 'Vũng Tàu', 'Nhà Hát Nước Vũng Tàu', '160 Hạ Long - Phường 1 - TP Vũng Tàu', 10.3545, 107.0755),
(204, 'Vũng Tàu', 'Trung Tâm Y Tế Vũng Tàu', '1 Trương Công Định - Phường Thắng Tam - TP Vũng Tàu', 10.3421, 107.0870),
(205, 'Vũng Tàu', 'Siêu Thị Co.opmart Vũng Tàu', '120 Lê Lợi - Phường 1 - TP Vũng Tàu', 10.3574, 107.0770),
(206, 'Vũng Tàu', 'Bãi Sau Vũng Tàu', '180 Thùy Vân - Phường 2 - TP Vũng Tàu', 10.3298, 107.0872),
(207, 'Vũng Tàu', 'Tượng Chúa Giesu', '1 Tôn Đức Thắng - Phường 2 - TP Vũng Tàu', 10.3254, 107.0817),
(208, 'Vũng Tàu', 'Trường Đại Học Nha Trang tại Vũng Tàu', '60 Nguyễn Thị Minh Khai - Phường 1 - TP Vũng Tàu', 10.3602, 107.0819),
(209, 'Vũng Tàu', 'Công Viên Biển Vũng Tàu', '1 Phan Bội Châu - Phường Thắng Tam - TP Vũng Tàu', 10.3366, 107.0789),
(210, 'Vũng Tàu', 'Khách Sạn Seagull Vũng Tàu', '30 Trần Phú - Phường 1 - TP Vũng Tàu', 10.3543, 107.0792),

-- ========== HÀ NỘI - Thêm 10 trạm mới ==========
(301, 'Hà Nội', 'Trạm Số 01 Cầu Vĩnh Tuy', 'Cầu Vĩnh Tuy - Phường Tứ Liên - Quận Tây Hồ - TP Hà Nội', 21.0501, 105.8314),
(302, 'Hà Nội', 'Trạm Công Viên Lênin', '1 Tôn Đức Thắng - Phường Điện Biên - Quận Ba Đình - TP Hà Nội', 21.0313, 105.8452),
(303, 'Hà Nội', 'Trạm Nhà Khách Bảo Vệ', '1 Phạm Hùng - Phường Kim Mã - Quận Ba Đình - TP Hà Nội', 21.0272, 105.8266),
(304, 'Hà Nội', 'Trạm Bộ Quốc Phòng', '87 Trần Phú - Phường Bà Triệu - Quận Hoàn Kiếm - TP Hà Nội', 21.0254, 105.8559),
(305, 'Hà Nội', 'Trạm Hồ Tây', '1 Nguyễn Chích - Phường Tứ Liên - Quận Tây Hồ - TP Hà Nội', 21.0563, 105.8408),
(306, 'Hà Nội', 'Trạm Nhà Thờ Lớn Hà Nội', '2 Nhà Chung - Phường Hàng Trong - Quận Hoàn Kiếm - TP Hà Nội', 21.0286, 105.8516),
(307, 'Hà Nội', 'Trạm Chợ Tây Hồ', '1 Thụy Khuê - Phường Quảng An - Quận Tây Hồ - TP Hà Nội', 21.0627, 105.8297),
(308, 'Hà Nội', 'Trạm Sở Thượng Tá Lê Hồng Phong', '120 Lê Hồng Phong - Phường Cầu Dền - Quận Hai Bà Trưng - TP Hà Nội', 21.0085, 105.8651),
(309, 'Hà Nội', 'Trạm Khu Đô Thị Tây Hồ Tây', '1 Hạ Đằng - Phường Quảng An - Quận Tây Hồ - TP Hà Nội', 21.0579, 105.8349),
(310, 'Hà Nội', 'Trạm Bệnh Viện Bạch Mai', '78 Giải Phóng - Phường Quang Trung - Quận Đống Đa - TP Hà Nội', 20.9985, 105.8438),

-- ========== ĐÀ NẴNG - Thêm 10 trạm mới ==========
(401, 'Đà Nẵng', 'Trạm Cầu Rồng', '1 Phạm Văn Đồng - Phường Hòa Thuận Đông - Quận Hải Châu - TP Đà Nẵng', 16.0637, 108.2391),
(402, 'Đà Nẵng', 'Trạm Nút Giao Hùng Vương - Tôn Đức Thắng', '1 Hùng Vương - Phường Hải Châu 1 - Quận Hải Châu - TP Đà Nẵng', 16.0692, 108.2225),
(403, 'Đà Nẵng', 'Trạm Công Viên Rồng', '1 Bạch Đằng - Phường Hòa Thuận Đông - Quận Hải Châu - TP Đà Nẵng', 16.0700, 108.2265),
(404, 'Đà Nẵng', 'Trạm Sở Giao Dịch Chứng Khoán', '1 Lý Thường Kiệt - Phường Hòa Cường Bắc - Quận Hải Châu - TP Đà Nẵng', 16.0379, 108.2208),
(405, 'Đà Nẵng', 'Trạm Bến Cảng Đà Nẵng', '1 Tôn Đức Thắng - Phường Hòa Thuận Đông - Quận Hải Châu - TP Đà Nẵng', 16.0628, 108.2404),
(406, 'Đà Nẵng', 'Trạm Nhà Thờ Đả Nẵng', '1 Trần Phú - Phường Hải Châu 1 - Quận Hải Châu - TP Đà Nẵng', 16.0710, 108.2170),
(407, 'Đà Nẵng', 'Trạm Bải Biển Non Nước', '1 Võ Nguyên Giáp - Phường Thọ Quang - Quận Sơn Trà - TP Đà Nẵng', 16.0121, 108.2621),
(408, 'Đà Nẵng', 'Trạm Siêu Thị Lotte Mart', '1 Vũ Duy Thanh - Phường Hòa Cường Bắc - Quận Hải Châu - TP Đà Nẵng', 16.0367, 108.2294),
(409, 'Đà Nẵng', 'Trạm Đại Học Đông Á', '1 Xô Viết Nghệ Tĩnh - Phường Hòa Cường Bắc - Quận Hải Châu - TP Đà Nẵng', 16.0337, 108.2273),
(410, 'Đà Nẵng', 'Trạm Công Viên 29-3', '1 Ngô Quyền - Phường Hải Châu 1 - Quận Hải Châu - TP Đà Nẵng', 16.0720, 108.2155),

-- ========== HẢI PHÒNG - Thêm 10 trạm mới ==========
(501, 'Hải Phòng', 'Trạm Giao Lộ Công Phố', '1 Công Phố - Phường Cái Dằng - Quận Hồng Bàng - TP Hải Phòng', 20.8556, 106.6818),
(502, 'Hải Phòng', 'Trạm Trương Tùng', '1 Trương Tùng - Phường Hoàng Văn Thụ - Quận Ngô Quyền - TP Hải Phòng', 20.8491, 106.6798),
(503, 'Hải Phòng', 'Trạm Trần Hưng Đạo', '1 Trần Hưng Đạo - Phường Hoàng Văn Thụ - Quận Ngô Quyền - TP Hải Phòng', 20.8498, 106.6751),
(504, 'Hải Phòng', 'Trạm Trương Công Định', '1 Trương Công Định - Phường Quán Thánh - Quận Ngô Quyền - TP Hải Phòng', 20.8574, 106.6656),
(505, 'Hải Phòng', 'Trạm Công Viên Trần Phú', '1 Trần Phú - Phường Lương Khánh Thiện - Quận Ngô Quyền - TP Hải Phòng', 20.8473, 106.6780),
(506, 'Hải Phòng', 'Trạm Nhà Hát Lớn', '1 Trần Phú - Phường Cầu Đất - Quận Ngô Quyền - TP Hải Phòng', 20.8493, 106.6769),
(507, 'Hải Phòng', 'Trạm Cầu Bạch Đằng', '1 Hạ Lý - Phường Hạ Lý - Quận Hồng Bàng - TP Hải Phòng', 20.8618, 106.6947),
(508, 'Hải Phòng', 'Trạm Trường Đại Học Kinh Tế Quốc Dân', '1 Trần Phú - Phường Minh Khai - Quận Hồng Bàng - TP Hải Phòng', 20.8540, 106.6938),
(509, 'Hải Phòng', 'Trạm Bệnh Viện Trung Ương Quân Đội', '1 Văn Cao - Phường An Biên - Quận Lê Chân - TP Hải Phòng', 20.8379, 106.6980),
(510, 'Hải Phòng', 'Trạm Công Viên Chính Trị', '1 Hoàng Diệu - Phường Minh Khai - Quận Hồng Bàng - TP Hải Phòng', 20.8628, 106.6893);
