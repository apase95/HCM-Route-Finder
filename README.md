# Ho Chi Minh Route Finder

Dự án Web Application tìm kiếm đường đi ngắn nhất trong khu vực nội thành Thành phố Hồ Chí Minh. Hệ thống được thiết kế theo kiến trúc chuẩn GIS, sử dụng dữ liệu thực tế từ OpenStreetMap và thuật toán A* để tính toán lộ trình tối ưu.

Đường dẫn dự án: `https://github.com/apase95/HCM-Route-Finder`

## Tính năng chính (Features)

- Hiển thị bản đồ nội thành TP.HCM với độ phản hồi cao.
- Cho phép người dùng tương tác click chọn điểm Đi và điểm Đến trực tiếp trên bản đồ.
- Hỗ trợ tìm kiếm địa điểm qua văn bản (Geocoding API).
- Tính toán đường đi ngắn nhất tuân thủ theo mạng lưới giao thông thực tế (đường một chiều, loại đường cho phép).
- Hiển thị thông tin tổng quãng đường và thời gian dự kiến.

## Thuật toán và Kiến trúc (Architecture Notes)

- **Thuật toán A* (A-Star):** Nâng cấp từ Dijkstra, sử dụng hàm Heuristic (Haversine Distance - khoảng cách đường chim bay) để định hướng tìm kiếm thẳng về đích, giúp tăng tốc độ tìm đường lên gấp 3-5 lần.
- **Xử lý không gian (Spatial Processing):** Thuật toán tự viết trên Golang giúp duyệt nhanh qua hơn 230,000 Nodes trên RAM chỉ trong ~2ms để tìm điểm giao thông gần nhất với vị trí người dùng.
- **In-Memory Graph:** Toàn bộ Node và Edge được Backend query từ Database (PostGIS) và lưu sẵn vào cấu trúc dữ liệu Adjacency List (Map) trên RAM ngay lúc khởi động server, loại bỏ độ trễ do I/O Database.


## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Leaflet (React-Leaflet).
- **Backend:** Golang, Gin Framework.
- **Database:** PostgreSQL tích hợp extension PostGIS.
- **Thuật toán:** A* (A-Star) Routing Algorithm, Haversine Formula.
- **Dữ liệu:** OpenStreetMap (OSM) - Định dạng `.osm.pbf`.
- **Hạ tầng:** Docker, Docker Compose (Multi-stage build).

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

## Hướng dẫn cài đặt (Local Setup qua Docker)

Để chạy dự án ở môi trường local, máy tính của bạn cần cài đặt sẵn: `Docker`, `Docker Compose`, `Go` (>= 1.20) và `Node.js` (khuyên dùng `pnpm`).

### Bước 1: Clone dự án
```bash
git clone https://github.com/apase95/HCM-Route-Finder.git
cd HCM-Route-Finder
```

### Bước 2: Khởi chạy toàn bộ hệ thống
Lệnh này sẽ tự động Build Backend, Frontend và khởi tạo Database.
```bash
docker compose up -d --build
```

### Bước 3: Tải và Import dữ liệu bản đồ (OSM)
1. Tải dữ liệu bản đồ khu vực TP.HCM định dạng `.osm.pbf` và lưu vào thư mục `data/hcm.osm.pbf`.
2. Chạy lệnh sau để tự động import dữ liệu không gian vào PostGIS:
```bash
docker run --rm \
  -v $(pwd)/data:/osm \
  -e PGPASSWORD=hodangthaiduy123456 \
  --network hcm-route-finder_default \
  debian:bookworm-slim \
  sh -c "apt-get update && apt-get install -y osm2pgsql && osm2pgsql -d hcm-route-finder-databasedatabase -U hcm-route-finder -H hcm_postgis /osm/hcm.osm.pbf"
```

### Bước 4: Trải nghiệm
- Mở trình duyệt và truy cập: `http://localhost:3000`
- API Backend chạy ngầm tại: `http://localhost:8080/api/v1/ping`

---

## Dành cho Collaborators

Nếu bạn là thành viên tham gia phát triển dự án này, vui lòng đọc kỹ các tài liệu sau trước khi bắt đầu viết code:

1. **[Quy chuẩn làm việc & Code Style](docs/RULES.md)**: Chứa thông tin về Git Workflow, cách đặt tên nhánh, viết commit message và tiêu chuẩn API.
2. **[Hướng dẫn cho người mới](docs/first-step.md)**: Hướng dẫn chi tiết cách tạo Branch, Commit và mở Pull Request (PR) hợp lệ.


---