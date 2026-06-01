import urllib.parse
import httpx
import logging
import time
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from db import fetch_all_roads
from graph import RouteGraph
from astar import find_path_astar

# --- TSK-020: CẤU HÌNH LOGGING ---
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="HCM Route Finder API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

route_graph = RouteGraph()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    if "api/v1" in request.url.path:
        logger.info(f"{request.method} {request.url.path} - Thời gian: {process_time:.2f}ms - Status: {response.status_code}")
    return response

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "message": "Dữ liệu đầu vào không hợp lệ hoặc thiếu tọa độ",
            "data": None,
            "errorCode": "INVALID_INPUT"
        }
    )

@app.on_event("startup")
async def startup_event():
    roads_data = fetch_all_roads()
    route_graph.build_graph(roads_data)
    logger.info("🚀 Server FastAPI đã sẵn sàng nhận Request!")

@app.get("/api/v1/ping")
async def ping():
    return {
        "success": True,
        "message": "Backend FastAPI đã hoạt động!",
        "data": None,
        "errorCode": None
    }

@app.get("/api/v1/routes")
async def get_route(startLat: float, startLng: float, endLat: float, endLng: float):
    start_node_id = route_graph.find_nearest_node(startLat, startLng)
    end_node_id = route_graph.find_nearest_node(endLat, endLng)
    
    path_ids, distance = find_path_astar(route_graph, start_node_id, end_node_id)
    
    if not path_ids:
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "message": "Không thể tìm thấy đường đi giữa 2 điểm này",
                "data": None,
                "errorCode": "ROUTE_NOT_FOUND"
            }
        )
        
    coords = [[route_graph.nodes[nid].lat, route_graph.nodes[nid].lng] for nid in path_ids]
    duration_seconds = distance / (30.0 / 3.6)
    
    return {
        "success": True,
        "message": "Tìm đường thành công",
        "data": {
            "distance": distance,
            "duration": duration_seconds,
            "path": coords
        },
        "errorCode": None
    }

@app.get("/api/v1/search")
async def search_location(q: str):
    if not q or len(q.strip()) < 2:
        return JSONResponse(status_code=400, content={
            "success": False, "message": "Thiếu từ khóa tìm kiếm", "data": [], "errorCode": "MISSING_QUERY"
        })

    search_query = f"{q}, Hồ Chí Minh"
    encoded_query = urllib.parse.quote(search_query)
    nominatim_url = f"https://nominatim.openstreetmap.org/search?q={encoded_query}&format=json&limit=5"

    headers = {"User-Agent": "HCM-Route-Finder-MVP/1.0"}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(nominatim_url, headers=headers)
            
        if response.status_code != 200:
            return JSONResponse(status_code=503, content={
                "success": False, "message": "Lỗi kết nối máy chủ OSM", "data": [], "errorCode": "NOMINATIM_ERROR"
            })
            
        results = [
            {"name": item.get("display_name", ""), "lat": float(item.get("lat", 0)), "lng": float(item.get("lon", 0))}
            for item in response.json()
        ]
            
        return {"success": True, "message": "Tìm kiếm thành công", "data": results, "errorCode": None}
    except Exception as e:
        logger.error(f"Search API Error: {e}")
        return JSONResponse(status_code=500, content={
            "success": False, "message": "Lỗi xử lý tìm kiếm", "data": [], "errorCode": "EXCEPTION_ERROR"
        })