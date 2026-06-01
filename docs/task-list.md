# HCM Route Finder MVP — Task List

## Project Structure

```txt
HCM-Route-Finder/
├── frontend/             # NextJS, Tailwind, Leaflet
├── backend/              # Python, FastAPI, A* Algorithm
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

- [ ] **TSK-006** `[BE_Core]` Khởi tạo Golang Backend với FastAPI. *(Estimate: 1h · Priority: Urgent)*

  **Description:**
  - Setup môi trường ảo (`venv`): `python -m venv venv`
  - Tạo `requirement.txt` và cài đặt thư viện: `fastapi`, `uvicorn`, `psycopg2-binary`.
  - Tạo file `main.py`, khởi tạo `app = FastAPI()` và cấu hình `CORS`.
  - Tạo API test `GET /api/v1/ping`.
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

- [ ] **TSK-011** `[BE_Data]` Query Data bằng Python. *(Estimate: 1h · Priority: Urgent)*

  **Description:**
  - Viết module `db.py` dùng `psycopg2` để kết nối tới PostgreSQL.
  - Sử dụng hàm `cursor.fetchall()` để nạp toàn bộ kết quả SQLvào RAM dưới dạng list các Dictionary hoặc Tuples.

- [x] **TSK-012** `[BE_Graph]` Thiết kế Node + Edge model. *(Estimate: 1h · Priority: Urgent)*

  **Description:**
  - Dùng `dataclass` để định nghĩa:
    ```py
    class Node:
        id: int
        lat: float
        lng: float

    class Edge:
        to_node: int
        weight: float
    ```

- [x] **TSK-013** `[BE_Graph]` Build adjacency list graph vào Memory. *(Estimate: 2h · Priority: Urgent)*

  **Description:**
  - Viết hàm `build_graph()` đọc JSON tọa độ.
  - Khởi tạo `nodes: dict[int, Node]` và `edges: dict[int, list[Edge]]`.
  - Xử lý `oneway=yes`: chỉ nối 1 chiều (A -> B). Nếu rỗng nối cả 2 chiều.
  - Chạy hàm này 1 lần duy nhất bằng Event `@app.on_event("startup")` của FastAPI.

---

# DAY 4 — A* IMPLEMENTATION

- [x] **TSK-014** `[Algorithm]` Implement Min Heap / Priority Queue. *(Estimate: 0.5h · Priority: Urgent)*

  **Description:**
  - Import module `heapq` có sẵn của Python.
  - Cơ chế: dùng mảng `pq = []` và đẩy các tuple (`f_score, node_id`) vào thông qua `heapq.heappush(pq, (...))`.

- [x] **TSK-015** `[Algorithm]` Implement thuật toán A* (A-Star). *(Estimate: 3h · Priority: Urgent)*

  **Description:**
  - Khởi tạo từ điển `g_score`, `f_score`, và `came_from`.
  - Viết hàm tính Haversine Distance bằng `math` của Python để làm Heuristic.
  - Vòng lặp lấy `node_id` bằng `heapq.heappop`.
  - Dừng sớm nếu `current == end_id`.
  - Trả về danh sách thứ tự `node_id` và tổng khoảng cách.

- [x] **TSK-016** `[Algorithm]` Tìm Nearest Node bằng RAM (Spatial Query). *(Estimate: 1.5h · Priority: High)*

  **Description:**
  - Viết hàm `find_nearest_node(lat, lng)` trong Python.
  - Duyệt qua toàn bộ `values()` của dictionary `nodes`.
  - Trả về `node_id` có khoảng cách Haversine ngắn nhất so với tọa độ click.

---

# DAY 5 — ROUTING API & SEARCH

- [x] **TSK-017** `[BE_API]` Tạo endpoint `GET /api/v1/route`. *(Estimate: 2h · Priority: Urgent)*

  **Description:**
  - Dùng FastAPI khai báo: `@app.get("/api/v1/routes")`.
  - Nhận query params: `startLat`, `startLng`, `endLat`, `endLng`.
  - Flow: `find_nearest_node()` → `a_star()` → format lại toạ độ list.

- [x] **TSK-018** `[BE_API]` Return GeoJSON / JSON route response. *(Estimate: 1h · Priority: High)*

  **Description:**
  - Response format:
    ```json
    {
        "success": true,
        "message": "Tìm đường thành công",
        "data": {
            "distance": 1200.5,
            "duration": 240,
            "path": [[10.776, 106.700], ...]
        },
        "errorCode": null
    }
    ```

- [x] **TSK-019** `[BE_API]` API Tìm kiếm địa điểm (Proxy Nominatim). *(Estimate: 2h · Priority: Medium)*

  **Description:**
  - Tạo `@app.get("/api/v1/search")`.
  - Dùng thư viện `httpx` hoặc `requests` để gọi API Nominatim OSM.
  - Bắt buộc gắn header `User-Agent`.
  - Lọc response và trả về 5 kết quả đầu tiên.

- [ ] **TSK-020** `[BE_API]` Error handling + logging cơ bản. *(Estimate: 1h · Priority: Medium)*

  **Description:**
  - Validate tham số đầu vào.
  - Trả lỗi 404 (Không tìm thấy đường) hoặc 400 (Thiếu tọa độ) thông qua `HTTPException` .

---

# DAY 6 — FRONTEND ROUTING UI

- [x] **TSK-021** `[FE_Search]` Làm UI ô tìm kiếm (Autocomplete). *(Estimate: 2h · Priority: High)*

  **Description:**
  - Tạo 2 input: Điểm đi, Điểm đến.
  - Gõ text -> debounce -> fetch `GET /api/v1/search` -> hiện list dropdown.
  - Click vào kết quả -> Update map marker và lưu State.

- [x] **TSK-022** `[FE_Routing]` Call backend routing API từ NextJS. *(Estimate: 2h · Priority: Urgent)*

  **Description:**
  - Trigger API khi ấn nút "Tìm đường" (đã có đủ `startPoint` + `endPoint`).
  - Loading state: spinner overlay trên màn hình.
  - Error state: dùng `sonner` hoặc `react-toastify` để hiện thông báo lỗi.

- [x] **TSK-023** `[FE_Routing]` Draw route polyline trên Leaflet. *(Estimate: 1.5h · Priority: Urgent)*

  **Description:**
  - Trích xuất mảng `path` từ API.
  - Render:
    ```tsx
    <Polyline positions={path} color="#2563EB" weight={5} />
    ```
  - Auto `fitBounds` để zoom map vừa khít với đường đi.
  - Clear polyline cũ khi tìm đường mới.

- [x] **TSK-024** `[FE_UI]` Hiển thị route information. *(Estimate: 1h · Priority: Medium)*

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

- [x] **TSK-028** `[Deploy]` Dockerize frontend + backend. *(Estimate: 2h · Priority: Medium)*

  **Description:**
  - `Dockerfile` cho NextJS (multi-stage build)
  - `Dockerfile` cho Python (alpine build nhỏ gọn)
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

- [x] Thuật toán A* (nhanh hơn Dijkstra ~2-5x nhờ kết hợp heuristic).
- [ ] Redis cache những tuyến đường phổ biến.
- [ ] Dark mode cho bản đồ (Dùng CartoDB Dark Matter tile).
- [ ] Route animation (Hiệu ứng xe chạy theo đường nét đứt).
- [ ] Multiple route suggestions (Gợi ý đường đi thứ 2, thứ 3).
- [ ] Xử lý cấm rẽ (Turn restrictions - Đòi hỏi query Relation từ OSM).

---