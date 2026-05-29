package routing

import (
	"container/heap"
	"errors"
	"math"

	"hcm-route-finder/internal/graph"
)

func AStar(g *graph.RouteGraph, startID, endID int64) ([]int64, float64, error) {
	dist := make(map[int64]float64)
	prev := make(map[int64]int64)

	pq := make(PriorityQueue, 0)
	heap.Init(&pq)

	endNode := g.Nodes[endID]

	dist[startID] = 0

	startNode := g.Nodes[startID]
	hStart := graph.Haversine(startNode.Lat, startNode.Lng, endNode.Lat, endNode.Lng)
	
	heap.Push(&pq, &Item{NodeID: startID, Distance: hStart})

	for pq.Len() > 0 {
		current := heap.Pop(&pq).(*Item)
		u := current.NodeID

		if u == endID {
			break
		}

		nodeU := g.Nodes[u]
		hU := graph.Haversine(nodeU.Lat, nodeU.Lng, endNode.Lat, endNode.Lng)
		
		if current.Distance > dist[u] + hU {
			continue
		}

		for _, edge := range g.Edges[u] {
			v := edge.To
			tentativeGScore := dist[u] + edge.Weight

			distV, exists := dist[v]
			if !exists {
				distV = math.MaxFloat64
			}

			if tentativeGScore < distV {
				dist[v] = tentativeGScore
				prev[v] = u

				nodeV := g.Nodes[v]
				hV := graph.Haversine(nodeV.Lat, nodeV.Lng, endNode.Lat, endNode.Lng)
				fScore := tentativeGScore + hV

				// Đẩy vào Heap
				heap.Push(&pq, &Item{NodeID: v, Distance: fScore})
			}
		}
	}

	if _, exists := dist[endID]; !exists {
		return nil, 0, errors.New("không tìm thấy đường đi")
	}

	var path []int64
	curr := endID
	for curr != startID {
		path = append(path, curr)
		curr = prev[curr]
	}
	path = append(path, startID)

	for i, j := 0, len(path)-1; i < j; i, j = i+1, j-1 {
		path[i], path[j] = path[j], path[i]
	}

	return path, dist[endID], nil
}