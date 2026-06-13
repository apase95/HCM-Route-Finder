# Ho Chi Minh Route Finder

Dự án Web Application tìm kiếm đường đi ngắn nhất trong khu vực nội thành Thành phố Hồ Chí Minh. Hệ thống được thiết kế theo kiến trúc chuẩn GIS, sử dụng dữ liệu thực tế từ OpenStreetMap và thuật toán A* kết hợp với công nghệ In-Memory Graph để tính toán lộ trình siêu tốc, thích ứng linh hoạt theo tình trạng giao thông thực tế.

Đường dẫn dự án: `https://github.com/apase95/HCM-Route-Finder`

<img width="1919" height="960" alt="image" src="https://github.com/user-attachments/assets/ffd83990-4b61-4ccf-a1ba-3e61683d6932" />
<img width="1919" height="960" alt="image" src="https://github.com/user-attachments/assets/42957f6f-21eb-48ba-8ee2-6752dd3ba51f" />


## Tính năng chính (Features)

- **Định tuyến Đa điểm (Multi-stop Routing):** Hỗ trợ tìm đường qua nhiều trạm dừng liên tiếp (Tối đa 5 điểm), tự động nối chuỗi các chặng đường mượt mà. Rất phù hợp cho các bài toán giao hàng (Logistics).
- **Tùy chọn Phương tiện:** Hỗ trợ định tuyến riêng biệt cho **Ô tô, Xe máy và Đi bộ**. Thuật toán tự động nhận diện đường cấm ô tô, đường 1 chiều (người đi bộ được phép đi ngược chiều) và các con hẻm nhỏ.
- **Mô phỏng Giao thông & Thời gian (Dynamic Routing):** 
  - Bản đồ tự động render đường đi theo màu sắc cảnh báo dựa trên giờ thực tế hoặc giờ do người dùng tự kéo thanh mô phỏng (🔴 Đỏ: Kẹt cứng/Ngập, 🟠 Cam: Ùn ứ, 🟡 Vàng: Đông đúc, 🟢 Xanh: Thông thoáng).
  - Trọng số giao thông sẽ thay đổi theo từng khung giờ (Ví dụ: Giờ cao điểm 7-8h sáng và 17-18h chiều sẽ kẹt xe nặng nề hơn).
- **Tránh điểm đen giao thông:** Khi bật tính năng "Tránh kẹt xe / Ngập", thuật toán A* sẽ tự động đánh giá lại chi phí đường đi, tìm cách bẻ lái, chui vào hẻm hoặc đi đường vòng để "né" các đoạn đường đang kẹt xe.
- **Định vị & Tìm kiếm thông minh:** Tự động lấy vị trí hiện tại (Geolocation) qua GPS nếu người dùng không chọn điểm xuất phát. Tích hợp Autocomplete tìm kiếm địa danh siêu tốc qua Geocoding API.
- **Trải nghiệm UX/UI hiện đại:** Click để chọn điểm trên bản đồ. Panel thông số nổi bật, trực quan.


## Thuật toán và Kiến trúc (Architecture Notes)

- **Thuật toán A* (A-Star) linh hoạt:** Nâng cấp từ thuật toán UCS, sử dụng hàm Heuristic (Haversine Distance - khoảng cách đường chim bay) kết hợp với **Trọng số Giao thông (Traffic Penalties)**. 
- **In-Memory Graph:** Để loại bỏ hoàn toàn độ trễ I/O của Database, toàn bộ Node và Edge được Backend truy vấn từ PostGIS và lưu sẵn vào cấu trúc dữ liệu Adjacency List (Dictionary) trên RAM ngay lúc Server khởi động.
- **Xử lý Không gian tốc độ cao (Spatial Processing):** Thuật toán tìm `Nearest Node` tự viết trên Python giúp duyệt qua hơn 230,000 tọa độ trên RAM trong thời gian `~2ms` để khớp vị trí click của người dùng với mạng lưới giao thông. Tốc độ tính toán một lộ trình phức tạp chỉ mất từ `20ms - 50ms`.


## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Leaflet (React-Leaflet).
- **Backend:** Python, FastAPI.
- **Database:** PostgreSQL tích hợp extension PostGIS.
- **Thuật toán:** A* (A-Star) Routing Algorithm, Haversine Formula.
- **Dữ liệu:** OpenStreetMap (OSM) - Định dạng `.osm.pbf`.
- **Hạ tầng:** Docker, Docker Compose (Multi-stage build).

---

## Cấu trúc thư mục (Project Structure)

```txt
HCM-Route-Finder/
├── frontend/             # Next.js application
├── backend/              # Python FastAPI
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
