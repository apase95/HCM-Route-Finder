import heapq
from typing import List, Tuple
from graph import RouteGraph, haversine

def find_path_astar(graph: RouteGraph, start_id: int, end_id: int) -> Tuple[List[int], float]:
    """
    Tìm đường đi ngắn nhất sử dụng thuật toán A*.
    Trả về: (danh_sách_node_id, tổng_khoảng_cách)
    Nếu không tìm thấy đường, trả về ([], 0.0)
    """
    
    # pq (Priority Queue) lưu trữ các tuple: (f_score, node_id)
    pq = []
    heapq.heappush(pq, (0.0, start_id))
    
    # g_score: khoảng cách thực tế ngắn nhất từ start đến node hiện tại
    g_score = {start_id: 0.0}
    
    # came_from: lưu vết đường đi (Node trước đó là ai)
    came_from = {}
    
    end_node = graph.nodes.get(end_id)
    if not end_node:
        return [], 0.0
        
    while pq:
        current_f, current_id = heapq.heappop(pq)
        
        # Đã tới đích -> Dừng sớm (Early Exit)
        if current_id == end_id:
            break
            
        current_g = g_score.get(current_id, float('inf'))
        
        # Duyệt qua các con đường nối với Node hiện tại
        for edge in graph.edges.get(current_id, []):
            neighbor = edge.to_node
            tentative_g = current_g + edge.weight
            
            # Nếu tìm được đường đi thực tế ngắn hơn
            if tentative_g < g_score.get(neighbor, float('inf')):
                came_from[neighbor] = current_id
                g_score[neighbor] = tentative_g
                
                # Tính Heuristic (H-Score): Khoảng cách đường chim bay từ hàng xóm tới Đích
                neighbor_node = graph.nodes[neighbor]
                h_score = haversine(neighbor_node.lat, neighbor_node.lng, end_node.lat, end_node.lng)
                
                # F-Score = G-Score (thực tế) + H-Score (ước lượng)
                f_score = tentative_g + h_score
                heapq.heappush(pq, (f_score, neighbor))
                
    # Dò ngược lại đường đi từ Đích về Xuất phát
    if end_id not in came_from and start_id != end_id:
        return [], 0.0 # Không tìm thấy đường
        
    path = []
    curr = end_id
    while curr in came_from:
        path.append(curr)
        curr = came_from[curr]
    path.append(start_id)
    
    # Đảo ngược mảng để ra đúng thứ tự Start -> End
    path.reverse()
    
    return path, g_score[end_id]