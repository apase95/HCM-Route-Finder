import json
import math
from dataclasses import dataclass
from typing import Dict, List

@dataclass
class Node:
    id: int
    lat: float
    lng: float

@dataclass
class Edge:
    to_node: int
    weight: float
    allow_car: bool
    allow_bike: bool
    allow_foot: bool
    traffic_zone: int

RED_STREETS = ["cộng hòa", "trường chinh", "cách mạng tháng 8", "nguyễn hữu cảnh", "xô viết nghệ tĩnh", "đinh bộ lĩnh", "nguyễn tất thành", "huỳnh tấn phát"]
YELLOW_STREETS = ["điện biên phủ", "ba tháng hai", "lý thường kiệt", "nguyễn thị minh khai", "nam kỳ khởi nghĩa", "nguyễn văn trỗi", "pasteur"]

def get_traffic_zone(street_name: str) -> int:
    if not street_name: return 1
    name_lower = street_name.lower()
    for red in RED_STREETS:
        if red in name_lower: return 1
    for yellow in YELLOW_STREETS:
        if yellow in name_lower: return 2
    return 0

def get_dynamic_traffic_level(zone: int, hour: int) -> int:
    if zone == 0: return 1
    is_rush_hour = hour in [7, 8, 17, 18]
    is_near_rush = hour in [6, 9, 16, 19]
    if zone == 1:
        if is_rush_hour: return 10
        if is_near_rush: return 4
    if zone == 2:
        if is_rush_hour: return 5
        if is_near_rush: return 2
    return 1

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class RouteGraph:
    def __init__(self):
        self.nodes: Dict[int, Node] = {}
        self.edges: Dict[int, List[Edge]] = {}

    def build_graph(self, roads_data: list):
        coord_to_id = {}
        next_node_id = 1

        print("⚙️ Đang xây dựng Đồ thị (Graph) vào RAM...")

        for road in roads_data:
            try:
                geom = json.loads(road["geojson"])
                coords = geom.get("coordinates", [])
            except Exception:
                continue

            if len(coords) < 2:
                continue

            highway = road.get("highway", "")
            is_oneway = road.get("oneway") == "yes"

            street_name = road.get("name", "")
            t_zone = get_traffic_zone(street_name)

            allow_car = highway not in ['footway', 'pedestrian', 'steps', 'path', 'cycleway']
            allow_bike = highway not in ['footway', 'pedestrian', 'steps']
            allow_foot = highway not in ['motorway', 'trunk', 'motorway_link', 'trunk_link']

            for i in range(len(coords) - 1):
                lng1, lat1 = coords[i]
                lng2, lat2 = coords[i + 1]

                key1 = f"{lat1:.6f},{lng1:.6f}"
                key2 = f"{lat2:.6f},{lng2:.6f}"

                if key1 not in coord_to_id:
                    coord_to_id[key1] = next_node_id
                    self.nodes[next_node_id] = Node(id=next_node_id, lat=lat1, lng=lng1)
                    self.edges[next_node_id] = []
                    next_node_id += 1
                id1 = coord_to_id[key1]

                if key2 not in coord_to_id:
                    coord_to_id[key2] = next_node_id
                    self.nodes[next_node_id] = Node(id=next_node_id, lat=lat2, lng=lng2)
                    self.edges[next_node_id] = []
                    next_node_id += 1
                id2 = coord_to_id[key2]

                dist = haversine(lat1, lng1, lat2, lng2)

                self.edges[id1].append(Edge(id2, dist, allow_car, allow_bike, allow_foot, t_zone))
                if is_oneway:
                    self.edges[id2].append(Edge(id1, dist, False, False, allow_foot, t_zone))
                else:
                    self.edges[id2].append(Edge(id1, dist, allow_car, allow_bike, allow_foot, t_zone))

        total_edges = sum(len(e) for e in self.edges.values())
        print(f"✅ Xây dựng Graph hoàn tất: [{len(self.nodes)} Nodes] và [{total_edges} Edges]")

    def find_nearest_node(self, lat: float, lng: float) -> int:
        nearest_id = -1
        min_dist = float('inf')

        for node_id, node in self.nodes.items():
            dist = haversine(lat, lng, node.lat, node.lng)
            if dist < min_dist:
                min_dist = dist
                nearest_id = node_id

        return nearest_id