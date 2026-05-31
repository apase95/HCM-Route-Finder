from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

roads_data = []
@app.on_event("startup")
async def startup_event():
    global roads_data
    # Tải dữ liệu vào RAM
    roads_data = fetch_all_roads()
    
    # In ra đoạn đường đầu tiên để kiểm tra
    if roads_data:
        sample = roads_data[0]
        print(f"👉 Đoạn đường mẫu: ID={sample['osm_id']}, Oneway={sample['oneway']}, Dài={sample['total_distance']:.2f}m")


# Endpoint Test (TSK-006)
@app.get("/api/v1/ping")
async def ping():
    return {
        "success": True,
        "message": "Backend FastAPI (Python) đã hoạt động thành công!",
        "data": None,
        "errorCode": None
    }