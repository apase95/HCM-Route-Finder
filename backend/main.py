import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import fetch_all_roads
from graph import RouteGraph
from astar import find_path_astar

# Khởi tạo FastAPI
app = FastAPI(title="HCM Route Finder API", version="1.0")

# Cấu hình CORS để cho phép NextJS gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong thực tế nên để ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

route_graph = RouteGraph()

@app.on_event("startup")
async def startup_event():
    roads_data = fetch_all_roads()
    route_graph.build_graph(roads_data)

    # ==========================================
    # 🚀 TEST TÌM ĐƯỜNG NGAY KHI SERVER KHỞI ĐỘNG
    # ==========================================
    # Tọa độ giả định: Dinh Độc Lập
    start_lat, start_lng = 10.7769, 106.6953
    # Tọa độ giả định: Chợ Bến Thành
    end_lat, end_lng = 10.7725, 106.6981

    print("\n📍 Đang test thuật toán A*...")
    start_time = time.time()
    
    start_node_id = route_graph.find_nearest_node(start_lat, start_lng)
    end_node_id = route_graph.find_nearest_node(end_lat, end_lng)
    
    path_ids, distance = find_path_astar(route_graph, start_node_id, end_node_id)
    
    elapsed_ms = (time.time() - start_time) * 1000

    if path_ids:
        print(f"✅ TÌM ĐƯỜNG THÀNH CÔNG!")
        print(f"   - Từ Node {start_node_id} -> Node {end_node_id}")
        print(f"   - Khoảng cách: {distance:.2f} mét")
        print(f"   - Đi qua: {len(path_ids)} giao lộ (nodes)")
        print(f"   - Thời gian tính toán: {elapsed_ms:.2f} ms\n")
    else:
        print("❌ Lỗi: Không tìm thấy đường đi.\n")


# Endpoint Test (TSK-006)
@app.get("/api/v1/ping")
async def ping():
    return {
        "success": True,
        "message": "Backend FastAPI (Python) đã hoạt động thành công!",
        "data": None,
        "errorCode": None
    }