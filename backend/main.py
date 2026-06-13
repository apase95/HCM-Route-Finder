import urllib.parse
import httpx
import logging
import time
import datetime
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from db import fetch_all_roads
from astar import find_path_astar
from graph import RouteGraph, get_dynamic_traffic_level

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
    return {"success": True, "message": "Backend FastAPI đã hoạt động!", "data": None, "errorCode": None}

@app.get("/api/v1/routes")
async def get_route(
    waypoints: str,
    vehicle: str = "car",
    avoidTraffic: str = "false",
    hour: int = -1
):
    try:
        is_avoid_traffic = avoidTraffic.lower() == "true"
        
        if hour < 0 or hour > 23:
            hour = datetime.datetime.now().hour
        
        points_str = waypoints.split("|")
        if len(points_str) < 2:
            return JSONResponse(status_code=400, content={
                "success": False, "message": "Cần ít nhất 2 điểm để tìm đường", "data": None, "errorCode": "INVALID_INPUT"
            })
        
        total_distance = 0.0
        all_segments = []
        
        for idx in range(len(points_str) - 1):
            lat1, lng1 = map(float, points_str[idx].split(","))
            lat2, lng2 = map(float, points_str[idx+1].split(","))
            
            start_node_id = route_graph.find_nearest_node(lat1, lng1)
            end_node_id = route_graph.find_nearest_node(lat2, lng2)
            
            # Chạy A* cho chặng này
            path_ids, _ = find_path_astar(route_graph, start_node_id, end_node_id, vehicle, is_avoid_traffic, hour)
            
            if not path_ids:
                return JSONResponse(status_code=404, content={
                        "success": False, "message": f"Không tìm thấy đường đi ở chặng {idx+1}", "data": None, "errorCode": "ROUTE_NOT_FOUND"
                })
            
            # Xử lý màu sắc và gộp segment cho chặng này
            current_segment = []
            current_color = "green"

            for i in range(len(path_ids) - 1):
                u = path_ids[i]
                v = path_ids[i + 1]
                
                node_u = route_graph.nodes[u]
                node_v = route_graph.nodes[v]
                
                edge_color = "green"
                dist = 0
                for edge in route_graph.edges[u]:
                    if edge.to_node == v:
                        dist = edge.weight
                        t_level = get_dynamic_traffic_level(edge.traffic_zone, hour)
                        if t_level >= 5: edge_color = "red"
                        elif t_level >= 2: edge_color = "yellow"
                        break
                        
                total_distance += dist

                if edge_color != current_color:
                    if current_segment:
                        all_segments.append({"color": current_color, "path": current_segment})
                    current_segment = [[node_u.lat, node_u.lng], [node_v.lat, node_v.lng]]
                    current_color = edge_color
                else:
                    if not current_segment:
                        current_segment.append([node_u.lat, node_u.lng])
                    current_segment.append([node_v.lat, node_v.lng])

            if current_segment:
                all_segments.append({"color": current_color, "path": current_segment})
        
        # Tính tổng thời gian
        if vehicle == "foot":
            duration_seconds = total_distance / (5.0 / 3.6)
        elif vehicle == "bike":
            duration_seconds = total_distance / (40.0 / 3.6)
        else:
            duration_seconds = total_distance / (30.0 / 3.6)
        
        return {
            "success": True,
            "message": "Tìm đường đa điểm thành công",
            "data": { 
                "distance": total_distance, 
                "duration": duration_seconds, 
                "segments": all_segments
            },
            "errorCode": None
        }
    except Exception as e:
        logger.error(f"Route API Error: {str(e)}")
        return JSONResponse(status_code=500, content={
            "success": False, "message": f"Lỗi thuật toán: {str(e)}", "data": None, "errorCode": "INTERNAL_SERVER_ERROR"
        })

@app.get("/api/v1/search")
async def search_location(q: str):
    if not q or len(q.strip()) < 2:
        return JSONResponse(status_code=400, content={
            "success": False, "message": "Thiếu từ khóa tìm kiếm", "data": [], "errorCode": "MISSING_QUERY"
        })

    encoded_query = urllib.parse.quote(q)
    nominatim_url = f"https://nominatim.openstreetmap.org/search?q={encoded_query}&format=json&limit=5&countrycodes=vn&accept-language=vi"

    headers = {"User-Agent": "HCM-Route-Finder-Project/1.0 (student-project)"}

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