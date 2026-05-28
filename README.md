# Ho Chi Minh Route Finder

Dự án Web Application tìm kiếm đường đi ngắn nhất trong khu vực nội thành Thành phố Hồ Chí Minh. Hệ thống được thiết kế theo kiến trúc chuẩn GIS, sử dụng dữ liệu thực tế từ OpenStreetMap và thuật toán Dijkstra để tính toán lộ trình tối ưu.

Đường dẫn dự án: `https://github.com/apase95/HCM-Route-Finder`

## Tính năng chính (Features)

- Hiển thị bản đồ nội thành TP.HCM với độ phản hồi cao.
- Cho phép người dùng tương tác click chọn điểm Đi và điểm Đến trực tiếp trên bản đồ.
- Hỗ trợ tìm kiếm địa điểm qua văn bản (Geocoding API).
- Tính toán đường đi ngắn nhất tuân thủ theo mạng lưới giao thông thực tế (đường một chiều, loại đường cho phép).
- Hiển thị thông tin tổng quãng đường và thời gian dự kiến.

## Thuật toán và Kiến trúc (Architecture Notes)

- **Xử lý không gian (Spatial Processing):** Sử dụng PostGIS `ST_Distance` và toán tử `<->` để tìm Nearest Node (điểm giao thông gần nhất với vị trí người dùng click). Việc này giúp tận dụng R-Tree Index của Database thay vì tính toán Brute-force trên Backend.
- **In-Memory Graph:** Để đảm bảo thuật toán Dijkstra chạy với tốc độ < 100ms, toàn bộ Node và Edge được Backend query từ Database và lưu sẵn vào cấu trúc dữ liệu Adjacency List (Map) trên RAM ngay lúc khởi động server.
- **Routing Data:** Dữ liệu đã được lọc, loại bỏ các đường đi bộ (`footway`, `steps`) và tuân thủ chặt chẽ thuộc tính đường một chiều (`oneway=yes`) của OSM.


## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Leaflet (React-Leaflet). Package manager: `pnpm`.
- **Backend:** Golang, Gin Framework.
- **Database:** PostgreSQL tích hợp extension PostGIS.
- **Thuật toán:** Dijkstra, Haversine.
- **Dữ liệu:** OpenStreetMap (OSM) - Định dạng `.osm.pbf`.
- **Hạ tầng:** Docker, Docker Compose.

---

## Cấu trúc thư mục (Project Structure)

```txt
HCM-Route-Finder/
├── frontend/             # Next.js application
├── backend/              # Golang REST API
├── data/                 # Thư mục chứa dữ liệu OSM và script import DB
├── docs/                 # Tài liệu dự án, quy chuẩn làm việc
├── docker-compose.yml    # File cấu hình khởi chạy Database/Services
└── README.md
```

---

## Hướng dẫn cài đặt (Local Setup)

Để chạy dự án ở môi trường local, máy tính của bạn cần cài đặt sẵn: `Docker`, `Docker Compose`, `Go` (>= 1.20) và `Node.js` (khuyên dùng `pnpm`).

### Bước 1: Clone dự án
```bash
git clone https://github.com/apase95/HCM-Route-Finder.git
cd Ho-Chi-Minh-Route-Finder
```

### Bước 2: Khởi chạy Database
Dự án sử dụng PostgreSQL + PostGIS chạy qua Docker.
```bash
docker-compose up -d postgres
```
*Lưu ý: Đợi khoảng 15-30 giây để database khởi tạo hoàn toàn trong lần chạy đầu tiên.*

### Bước 3: Tải và Import dữ liệu bản đồ (OSM)
1. Tải dữ liệu bản đồ khu vực TP.HCM định dạng `.osm.pbf` và lưu vào thư mục `data/hcm.osm.pbf`.
2. Sử dụng công cụ `osm2pgsql` để nạp dữ liệu vào PostGIS.
```bash
# Chạy lệnh này tại thư mục gốc của dự án
docker run --rm -v $(pwd)/data:/osm -e PGPASSWORD=secret --network host pdok/osm2pgsql -d route_db -U user -H localhost -W -S default.style /osm/hcm.osm.pbf
```

### Bước 4: Khởi chạy Backend (Golang)
Backend sẽ kết nối với Database, lấy dữ liệu mạng lưới giao thông và xây dựng Đồ thị (Graph) vào RAM.
```bash
cd backend
go mod tidy
go run main.go
```
*API sẽ chạy tại: `http://localhost:8080`*

### Bước 5: Khởi chạy Frontend (Next.js)
Mở một tab Terminal mới.
```bash
cd frontend
pnpm install
pnpm dev
```
*Truy cập ứng dụng tại: `http://localhost:3000`*

---

## Dành cho Collaborators

Nếu bạn là thành viên tham gia phát triển dự án này, vui lòng đọc kỹ các tài liệu sau trước khi bắt đầu viết code:

1. **[Quy chuẩn làm việc & Code Style](docs/RULES.md)**: Chứa thông tin về Git Workflow, cách đặt tên nhánh, viết commit message và tiêu chuẩn API.
2. **[Hướng dẫn cho người mới](docs/first-step.md)**: Hướng dẫn chi tiết cách tạo Branch, Commit và mở Pull Request (PR) hợp lệ.

*Vui lòng không push code trực tiếp vào nhánh `main` và `dev`.*

---