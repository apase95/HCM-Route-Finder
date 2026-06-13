import heapq
from typing import List, Tuple
from graph import RouteGraph, haversine, get_dynamic_traffic_level

def find_path_astar(graph: RouteGraph, start_id: int, end_id: int, vehicle_type: str = "car", avoid_traffic: bool = False, current_hour: int = 7) -> Tuple[List[int], float]:
    pq = []
    heapq.heappush(pq, (0.0, start_id))
    g_score = {start_id: 0.0}
    came_from = {}
    
    end_node = graph.nodes.get(end_id)
    if not end_node:
        return [], 0.0
        
    while pq:
        current_f, current_id = heapq.heappop(pq)
        
        if current_id == end_id:
            break
            
        current_g = g_score.get(current_id, float('inf'))
        
        for edge in graph.edges.get(current_id, []):
            if vehicle_type == "car" and not edge.allow_car: continue
            if vehicle_type == "bike" and not edge.allow_bike: continue
            if vehicle_type == "foot" and not edge.allow_foot: continue

            # Tính Cost (Trọng số)
            cost = edge.weight
            if avoid_traffic:
                t_level = get_dynamic_traffic_level(edge.traffic_zone, current_hour)
                cost = edge.weight * t_level
            tentative_g = current_g + cost
            
            if tentative_g < g_score.get(edge.to_node, float('inf')):
                came_from[edge.to_node] = current_id
                g_score[edge.to_node] = tentative_g
                
                neighbor_node = graph.nodes[edge.to_node]
                h_score = haversine(neighbor_node.lat, neighbor_node.lng, end_node.lat, end_node.lng)
                
                f_score = tentative_g + h_score
                heapq.heappush(pq, (f_score, edge.to_node))
                
    if end_id not in came_from and start_id != end_id:
        return [], 0.0
        
    path = []
    curr = end_id
    while curr in came_from:
        path.append(curr)
        curr = came_from[curr]
    path.append(start_id)
    
    path.reverse()
    
    return path, g_score[end_id]