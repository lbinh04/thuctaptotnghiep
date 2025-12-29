// Mapping giữa tên trạm và ID từ database
// Dựa trên dữ liệu trong bikerental.sql

export const stationMapping = {
  // Hồ Chí Minh
  "001 - Hàm Nghi": 1,
  "002 - Trường Cao đẳng Kỹ thuật Cao Thắng": 2,
  "003 - Công ty Cổ phần Vận tải Đường sắt Sài Gòn": 3,
  "004 - Thương xá Tax": 4,
  "005 - Nguyễn Huệ": 5,
  "006 - Sở Giao dịch Chứng khoán": 6,
  "007 - Phạm Hồng Thái": 6, // Lỗi dữ liệu trong DB, sử dụng tạm thời
  "008 - Công viên 23/9 (đường Phạm Ngũ Lão)": 7,
  "009 - Công viên 23/9 (đường Phạm Ngũ Lão)": 7,
  "010 - Tòa nhà Kumho": 8,
  "011 - Công viên 30/4": 8,
  "012 - Thảo Cầm Viên": 9,
  "013 - Công viên Tao Đàn": 10,
  "014 - Tổng công ty xây dựng Số 6": 11,
  "015 - Nhà hát Thành Niên": 12,
  "016 - Mạc Đĩnh Chi": 13,
  "017 - Trung tâm TDTT Hoa Lư": 14,
  "018 - Công viên Paris": 15,
  "019 - Khách sạn Le Meridien Saigon": 16,
  "020 - Trung tâm thương mại Sài Gòn": 17,

  // Vũng Tàu
  "001 - Sân vận động Lam Sơn": 23,
  "002 - Công viên Tam Giác": 23,
  "003 - Nhà văn hóa Thanh Niên": 23,
  "004 - Thái Văn Lung": 24,
  "005 - Tượng Chúa Dang Tay": 24,
  "006 - Công viên Tao Phùng": 28,
  "007 - Công viên Bãi Sau": 28,
  "008 - Petro Tower": 28,
  "009 - Cột cờ Thùy Vân": 26,
  "010 - Cô Bắc": 25,

  // Hà Nội
  "001 - Trạm Số 289 Kim Mã": 50,
  "002 - Trạm Công Viên Bách Thảo": 51,
  "003 - Trạm Số 30 Phan Đình Phùng": 54,
  "004 - Trạm Số 34 Trần Phú": 55,
  "005 - Trạm Nhà Hát Chèo Việt Nam": 56,

  // Đà Nẵng
  "001 - Trạm Công Viên Đường Hùng Vương": 60,
  "002 - Trạm Đại Học Đông Á": 61,
  "003 - Trạm THPT Nguyễn Hiền": 62,
  "004 - Trạm Siêu Thị Lotte Mart": 63,

  // Hải Phòng
  "001 - Trạm Bưu Điện TP Hải Phòng": 59,
};

/**
 * Lấy ID trạm từ tên trạm
 */
export function getStationId(stationName) {
  return stationMapping[stationName] || null;
}

/**
 * Tìm ID trạm gần giống nhất nếu không tìm thấy chính xác
 */
export function findNearestStationId(stationName) {
  // Trước tiên cố gắng tìm chính xác
  const exactMatch = stationMapping[stationName];
  if (exactMatch) return exactMatch;

  // Nếu không, tìm trạm có tên bắt đầu giống
  const stationNumber = stationName.split(" - ")[0];
  const similarStations = Object.entries(stationMapping).filter(([name]) =>
    name.startsWith(stationNumber)
  );

  return similarStations.length > 0 ? similarStations[0][1] : null;
}
