# Hướng dẫn Triển khai: Hiển thị Thông tin Xe Tồn và Đang Thuê

## 📋 Tóm tắt thay đổi

Tôi đã giúp bạn cải thiện phần station-list danh sách trạm để hiển thị:

- **Số lượng xe tồn** (có sẵn) ở mỗi trạm
- **Số lượng xe đang được thuê** ở mỗi trạm

## 🔧 Các file được tạo/cập nhật

### 1. **Database** (`database/add_bikes_and_rentals.sql`)

- Tạo bảng `xe` lưu thông tin xe đạp
- Tạo bảng `giao_dich` lưu thông tin giao dịch thuê xe
- Thêm dữ liệu mẫu cho 50 xe ở các trạm
- Thêm dữ liệu mẫu cho giao dịch

### 2. **API Endpoint** (`src/app/api/auth/station-bikes/route.js`)

- GET `/api/auth/station-bikes?stationId={id}`
- Trả về:
  ```json
  {
    "stationId": 1,
    "bikes": {
      "Xe đạp cơ": { "con_lai": 4, "dang_thue": 1, "bao_tri": 0, "tong_so": 5 },
      "Xe đạp điện": {
        "con_lai": 1,
        "dang_thue": 1,
        "bao_tri": 0,
        "tong_so": 2
      }
    },
    "total": { "con_lai": 5, "dang_thue": 2, "bao_tri": 0, "tong_so": 7 }
  }
  ```

### 3. **Station ID Mapping** (`src/utils/stationIdMapping.js`)

- Mapping giữa tên trạm và ID từ database
- Hàm `findNearestStationId()` để tìm ID trạm

### 4. **LeafletMap Component** (`src/components/LeafletMap.js`)

- Thêm hàm `fetchStationBikes()` để lấy thông tin xe
- Cập nhật popup marker để hiển thị thông tin xe
- Gọi API khi user click vào marker

### 5. **Station List Page** (`src/app/(user)/station-list/page.js`)

- Thêm state `bikeInfo` để lưu thông tin xe
- Thêm state `selectedStationId` để tracking trạm đã chọn
- Hiển thị thông tin xe dưới tên trạm trong danh sách
- Gọi API khi user click vào location button
- Hiển thị chi tiết: tổng số xe, xe tồn, xe đang thuê, phân chia theo loại

## 📝 Các bước triển khai

### Bước 1: Thêm Database

```bash
# Đăng nhập MySQL
mysql -u root -p bikerental

# Chạy file SQL
source database/add_bikes_and_rentals.sql
```

Hoặc import qua phpMyAdmin/MySQL Workbench

### Bước 2: Kiểm tra API

```bash
curl "http://localhost:3000/api/auth/station-bikes?stationId=1"
```

### Bước 3: Test trên giao diện

- Mở trang Station List
- Click vào icon location (📍) của một trạm
- Kiểm tra xem thông tin xe có hiển thị không
- Click vào marker trên bản đồ để xem chi tiết

## 🎨 Giao diện hiển thị

### Trong danh sách trạm:

```
Trạm Hàm Nghi
10 Hàm Nghi - Phường Bến Nghé - Quận 1 - TP Hồ Chí Minh
📊 Xe disponible: 5 | Đang thuê: 2
  • Xe đạp cơ: ✅4 | 🔄1
  • Xe đạp điện: ✅1 | 🔄1
```

### Trong popup bản đồ:

```
Trạm Hàm Nghi
──────────────
📊 Tổng cộng: 7 xe

🚲 Xe đạp cơ
✅ Tồn: 4 | 🔄 Đang thuê: 1

⚡ Xe đạp điện
✅ Tồn: 1 | 🔄 Đang thuê: 1
```

## 🔄 Dòng chảy dữ liệu

```
User Click Location Button
         ↓
handleLocationClick(lat, lng, stationId)
         ↓
fetchBikeInfo(stationId)
         ↓
GET /api/auth/station-bikes?stationId=1
         ↓
API Query xe table & giao_dich table
         ↓
Return bike statistics
         ↓
Update bikeInfo state
         ↓
UI Update - Display bike info in list & map
```

## 📊 Dữ liệu mẫu

File SQL đã thêm:

- **50 xe đạp** phân bố ở 10 trạm

  - Xe đạp cơ: 30 chiếc
  - Xe đạp điện: 20 chiếc
  - Trạng thái: Có sẵn, Đang thuê, Bảo trì

- **5 giao dịch** mẫu
  - 3 giao dịch đang thuê (không có thời gian kết thúc)
  - 2 giao dịch đã hoàn thành

## ⚠️ Lưu ý quan trọng

1. **Cập nhật Station ID Mapping**: Nếu bạn thêm hoặc xóa trạm, cần cập nhật `stationIdMapping.js`

2. **Dữ liệu mẫu**: Bạn có thể tùy chỉnh dữ liệu trong file SQL để phù hợp với nhu cầu

3. **Performance**: Nếu có hàng ngàn xe, có thể cache kết quả API để tối ưu hiệu năng

4. **Real-time**: Hiện tại thông tin chỉ cập nhật khi user click. Để real-time, có thể dùng WebSocket hoặc polling

## 🎯 Tính năng có thể mở rộng

1. **Real-time updates**: Sử dụng WebSocket để cập nhật xe in real-time
2. **Lọc theo loại xe**: Cho phép user lọc trạm theo số lượng xe cơ/điện
3. **Sắp xếp**: Sắp xếp trạm theo số xe có sẵn
4. **Đặt trước**: Cho phép user đặt trước xe từ trang này
5. **Lịch sử giao dịch**: Hiển thị các giao dịch gần đây

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:

- Console browser (F12) xem có lỗi JavaScript không
- Network tab xem API có trả về đúng dữ liệu không
- Database xem dữ liệu xe có đúng không
- Timezone của MySQL có khớp không
