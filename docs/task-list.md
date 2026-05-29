# HCM Route Finder MVP — Task List

## Project Structure

```txt
HCM-Route-Finder/
├── frontend/             # NextJS, Tailwind, Leaflet
├── backend/              # Golang, Gin, Dijkstra
├── data/                 # File OSM, Scripts SQL, Docker configs
├── docs/                 # Tài liệu, Screenshots
├── docker-compose.yml    # Chạy DB, Backend, Frontend
└── README.md
```

---

# DAY 1 — PROJECT SETUP + MAP RENDERING

- [x] **TSK-001** `[PM/Setup]` Khởi tạo Monorepo Git + Base Structure. *(Estimate: 1h · Priority: Urgent)*

  **Description:**
  - Tạo repo Github `hcm-route-finder`
  - Tạo branch: `main`, `dev`
  - Tạo folder: `frontend/`, `backend/`, `data/`, `docs/`
  - Tạo README mô tả: Stack, Feature, Roadmap

- [x] **TSK-002** `[FE_Core]` Khởi tạo NextJS App Router bằng PNPM. *(Estimate: 1h · Priority: Urgent)*

  **Description:**
  - Chạy:
    ```bash
    pnpm create next-app@latest frontend --typescript --tailwind --eslint --app
    ```
  - Chọn: TypeScript · ESLint · App Router · TailwindCSS
  - Setup path alias `@/*`
  - Cài thêm: `clsx`, `tailwind-merge`, `lucide-react`
  - Dọn dẹp `page.tsx`, `global.css` mặc định của NextJS

- [x] **TSK-003** `[FE_Map]` Cài đặt Leaflet + React Leaflet. *(Estimate: 30m · Priority: Urgent)*

  **Description:**
  - Install:
    ```bash
    pnpm add leaflet react-leaflet
    pnpm add -D @types/leaflet
    ```
  - Sửa lỗi thiếu CSS của Leaflet (import `leaflet/dist/leaflet.css` vào `layout.tsx` hoặc `globals.css`)
  - Fix default icon issue (override icon mặc định của Leaflet khi dùng với NextJS)

- [x] **TSK-004** `[FE_Map]` Render bản đồ nội thành TP.HCM. *(Estimate: 2h · Priority: Urgent)*

  **Description:**
  - Tạo component `MapView.tsx` với `"use client"`
  - Dùng Tile Layer của OpenStreetMap (https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png).
  - Center: `[10.7769, 106.7009]` · Zoom: `14`
  - Verify: zoom, drag, tile loading mượt mà

- [x] **TSK-005** `[FE_Map]` Thêm marker interaction (click chọn điểm). *(Estimate: 2h · Priority: High)*

  **Description:**
  - Lắng nghe sự kiện `useMapEvents` của React-Leaflet.
  - Click lần 1 -> Đặt marker màu xanh (Điểm xuất phát).
  - Click lần 2 -> Đặt marker màu đỏ (Điểm kết thúc).
  - Lưu state: `startPoint`, `endPoint` (lat/lng)

---

# DAY 2 — BACKEND + DATABASE + OSM DATA

- [x] **TSK-006** `[BE_Core]` Khởi tạo Golang Backend với Gin. *(Estimate: 1.5h · Priority: Urgent)*

  **Description:**
  - Initialize:
    ```bash
    go mod init hcm-route-finder
    go get github.com/gin-gonic/gin
    ```
  - Tạo structure:
    ```txt
    internal/
    ├── api/
    ├── graph/
    ├── db/
    └── models/
    ```

- [x] **TSK-007** `[Infra]` Setup PostgreSQL + PostGIS bằng Docker Compose. *(Estimate: 1.5h · Priority: Urgent)*

  **Description:**
  - Viết `docker-compose.yml` ở root
  - Image: `postgis/postgis:15-3.4`
  - Setup môi trường: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
  - Map port `5432:5432`  
  - Tạo database connection từ Go (dùng `pgx` hoặc `GORM`).

- [x] **TSK-008** `[Data]` Download OpenStreetMap Data TP.HCM. *(Estimate: 1h · Priority: Urgent)*

  **Description:**
  - Download file `.osm.pbf` từ [BBBike](https://extract.bbbike.org/) (chọn custom bounding box để cắt đúng khung nội thành HCM).
  - Lưu vào `/data/hcm.osm.pbf`

- [x] **TSK-009** `[Data]` Import OSM vào PostGIS bằng `osm2pgsql`. *(Estimate: 2h - Priority: Urgent)*

  **Description:**
  - Chạy tool `osm2pgsql` (khuyên dùng qua Docker image để không cần cài tool).
  - Lệnh tham khảo: 
    ```bash
    osm2pgsql -d my_db -U user -H localhost -W -S default.style hcm.osm.pbf
    ```
  - Check database, đảm bảo các bảng `planet_osm_point` và `planet_osm_line` đã có dữ liệu.

---

# DAY 3 — QUERY DATABASE + BUILD GRAPH

- [x] **TSK-010** `[DB_Query]` Viết câu SQL lọc đường đi (Routing Data). *(Estimate: 2h · Priority: Urgent)*

  **Description:**
  - Viết script SQL trích xuất danh sách đoạn đường (Edges) từ bảng `planet_osm_line`.
  - Tags giữ lại: `highway IN ('primary', 'secondary', 'tertiary', 'residential', 'trunk')`.
  - Loại bỏ: `footway`, `pedestrian`, `steps`.
  - Trích xuất thông tin `oneway`.
  - Dùng PostGIS tính chiều dài đường: `ST_Length(way::geography) AS distance`.

- [x] **TSK-011** `[BE_Data]` Query Data vào Golang. *(Estimate: 1h · Priority: Urgent)*

  **Description:**
  - Viết hàm Golang kết nối DB và chạy câu Query TSK-010.
  - Parse kết quả SQL trả về dạng array các `Edge` để chuẩn bị build Graph.

- [x] **TSK-012** `[BE_Graph]` Thiết kế Node + Edge model. *(Estimate: 1h · Priority: Urgent)*

  **Description:**
  - Define structs:
    ```go
    type Node struct {
        ID       int64
        Lat, Lng float64
    }

    type Edge struct {
        To       int64
        Distance float64
    }
    ```

- [x] **TSK-013** `[BE_Graph]` Build adjacency list graph vào Memory. *(Estimate: 2h · Priority: Urgent)*

  **Description:**
  - Build: `map[int64][]Edge`
  - Xử lý `oneway=yes`: chỉ thêm 1 chiều (A -> B).
  - Nếu đường 2 chiều (default): Thêm cả 2 chiều (A -> B và B -> A).
  - Viết function load graph 1 lần duy nhất khi Golang server start.

---

# DAY 4 — DIJKSTRA IMPLEMENTATION

- [ ] **TSK-014** `[Algorithm]` Implement Min Heap / Priority Queue. *(Estimate: 1.5h · Priority: Urgent)*

  **Description:**
  - Implement `heap.Interface` từ package `container/heap` của Go.
  - Push, Pop với priority = distance.
  - Struct `Item { NodeID, Distance, Index }`.

- [ ] **TSK-015** `[Algorithm]` Implement thuật toán Dijkstra. *(Estimate: 3h · Priority: Urgent)*

  **Description:**
  - `dist map[int64]float64` → khởi tạo `+Inf`.
  - `prev map[int64]int64` → reconstruct path (truy vết mảng Node ID).
  - `visited` set để skip node đã xử lý.
  - Return: `[]int64` (danh sách Node ID tạo thành đường đi ngắn nhất).

- [ ] **TSK-016** `[Algorithm]` Tìm Nearest Node bằng PostGIS (Spatial Query). *(Estimate: 1.5h · Priority: High)*

  **Description:**
  - Input: `lat, lng` từ click của user.
  - Thay vì tính brute-force, bắn câu Query xuống DB:
    ```sql
    ORDER BY way <-> ST_SetSRID(ST_MakePoint(lng, lat), 4326) LIMIT 1;
    ```
  - Return: NodeID gần với điểm click nhất.

---

# DAY 5 — ROUTING API & SEARCH

- [ ] **TSK-017** `[BE_API]` Tạo endpoint `GET /api/v1/route`. *(Estimate: 2h · Priority: Urgent)*

  **Description:**
  - Query params: `startLat`, `startLng`, `endLat`, `endLng`
  - Flow: coordinate → gọi PostGIS `nearestNode()` → `Dijkstra(start, end)` → trả mảng coordinates.
  - Thêm CORS header cho NextJS frontend gọi được.

- [ ] **TSK-018** `[BE_API]` Return GeoJSON / JSON route response. *(Estimate: 1h · Priority: High)*

  **Description:**
  - Response format:
    ```json
    {
      "distance": 1200.5,
      "duration": 240,
      "path": [[10.776, 106.700], ...]
    }
    ```
  - `duration` ước tính: `distance / 30 * 3.6` (giây, giả sử tốc độ 30 km/h).

- [ ] **TSK-019** `[BE_API]` API Tìm kiếm địa điểm (Proxy Nominatim). *(Estimate: 2h · Priority: Medium)*

  **Description:**
  - Cực kỳ hữu ích cho MVP. Tạo `GET /api/v1/search?q=Ben Thanh`
  - Gọi HTTP GET tới `https://nominatim.openstreetmap.org/search` (Giới hạn `viewbox` ở HCM).
  - Map response trả về format thống nhất cho FE.

- [ ] **TSK-020** `[BE_API]` Error handling + logging cơ bản. *(Estimate: 1h · Priority: Medium)*

  **Description:**
  - `404`: no path found / điểm quá xa ngoại thành.
  - `400`: invalid coordinate.
  - Log: request + execution response time.

---

# DAY 6 — FRONTEND ROUTING UI

- [ ] **TSK-021** `[FE_Search]` Làm UI ô tìm kiếm (Autocomplete). *(Estimate: 2h · Priority: High)*

  **Description:**
  - Tạo 2 input: Điểm đi, Điểm đến.
  - Gõ text -> debounce -> fetch `GET /api/v1/search` -> hiện list dropdown.
  - Click vào kết quả -> Update map marker và lưu State.

- [ ] **TSK-022** `[FE_Routing]` Call backend routing API từ NextJS. *(Estimate: 2h · Priority: Urgent)*

  **Description:**
  - Trigger API khi ấn nút "Tìm đường" (đã có đủ `startPoint` + `endPoint`).
  - Loading state: spinner overlay trên màn hình.
  - Error state: dùng `sonner` hoặc `react-toastify` để hiện thông báo lỗi.

- [ ] **TSK-023** `[FE_Routing]` Draw route polyline trên Leaflet. *(Estimate: 1.5h · Priority: Urgent)*

  **Description:**
  - Trích xuất mảng `path` từ API.
  - Render:
    ```tsx
    <Polyline positions={path} color="#2563EB" weight={5} />
    ```
  - Auto `fitBounds` để zoom map vừa khít với đường đi.
  - Clear polyline cũ khi tìm đường mới.

- [ ] **TSK-024** `[FE_UI]` Hiển thị route information. *(Estimate: 1h · Priority: Medium)*

  **Description:**
  - Panel nổi (overlay UI) hiển thị: Quãng đường (x.x km) + Thời gian dự kiến (x phút).
  - Nút: Clear / Đặt lại bản đồ.

---

# DAY 7 — TESTING + POLISH + DEPLOY

- [ ] **TSK-025** `[Testing]` Test routing logic nhiều tuyến đường khác nhau. *(Estimate: 2h · Priority: High)*

  **Description:**
  - Test: Quận 1 → Quận 7, Quận 3 → Gò Vấp.
  - Verify đường 1 chiều: Đảm bảo thuật toán không vẽ ngược chiều các đường như Lê Thánh Tôn, Pasteur.
  - Test click vào những nơi không có đường bộ (Sông Sài Gòn) xem PostGIS xử lý Nearest Node thế nào.

- [ ] **TSK-026** `[Testing]` Performance test graph loading. *(Estimate: 1h · Priority: Medium)*

  **Description:**
  - Đo startup time khi load graph từ DB vào memory lúc chạy Go.
  - Đo average response time của routing API (Mục tiêu: < 300ms).

- [ ] **TSK-027** `[FE_UI]` UI cleanup + responsive cơ bản. *(Estimate: 1h · Priority: Medium)*

  **Description:**
  - Dọn dẹp spacing, layout TailwindCSS.
  - Đảm bảo trên Mobile, UI Panel input hiển thị gọn gàng (bottom sheet hoặc floating panel).

- [ ] **TSK-028** `[Deploy]` Dockerize frontend + backend. *(Estimate: 2h · Priority: Medium)*

  **Description:**
  - `Dockerfile` cho NextJS (multi-stage build)
  - `Dockerfile` cho Go (alpine build nhỏ gọn)
  - Hoàn thiện `docker-compose.yml`: Chạy 1 lệnh `docker compose up` lên cả Postgres + Backend + Frontend.

- [ ] **TSK-029** `[Docs]` Update README + demo screenshots. *(Estimate: 1h · Priority: Medium)*

  **Description:**
  - Vẽ System Architecture diagram đơn giản.
  - Setup guide step-by-step.
  - Chụp Screenshots xịn sò nhét vào README.

---

# MVP Done Checklist

- [ ] Khởi động server (DB + BE + FE) bằng Docker thành công.
- [ ] Load Map TP.HCM mượt mà.
- [ ] Tính năng Search chữ (Geocoding) trả kết quả đúng.
- [ ] Click chọn 2 điểm trên map đặt được marker.
- [ ] Chạy Dijkstra siêu tốc do Graph được cache trên RAM.
- [ ] Đường đi bám sát mạng lưới đường giao thông (không vẽ xuyên nhà/vượt sông bừa bãi).
- [ ] API trả về kết quả `< 500ms`.

---

# Post-MVP (Optional)

- [ ] Thuật toán A* (nhanh hơn Dijkstra ~2-5x nhờ kết hợp heuristic).
- [ ] Redis cache những tuyến đường phổ biến.
- [ ] Dark mode cho bản đồ (Dùng CartoDB Dark Matter tile).
- [ ] Route animation (Hiệu ứng xe chạy theo đường nét đứt).
- [ ] Multiple route suggestions (Gợi ý đường đi thứ 2, thứ 3).
- [ ] Xử lý cấm rẽ (Turn restrictions - Đòi hỏi query Relation từ OSM).

---