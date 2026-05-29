package routing

import (
	"container/heap"
	"errors"
	"hcm-route-finder/internal/graph"
	"math"
)

func Dijkstra(g *graph.RouteGraph, startID, endID int64) ([]int64, float64, error) {
	dist := make(map[int64]float64)
	prev := make(map[int64]int64)
	
	pq := make(PriorityQueue, 0)
	heap.Init(&pq)

	dist[startID] = 0
	heap.Push(&pq, &Item{ NodeID: startID, Distance: 0 })
	for pq.Len() > 0 {
		current := heap.Pop(&pq).(*Item)
		u := current.NodeID
		
		if u == endID { break }
		if current.Distance > dist[u] { continue }

		for _, edge := range g.Edges[u] {
			v := edge.To
			alt := dist[u] + edge.Weight
			
			distV, exists := dist[v]
			if !exists { distV = math.MaxFloat64 }

			if alt < distV {
				dist[v] = alt
				prev[v] = u
				heap.Push(&pq, &Item{ NodeID: v, Distance: alt })
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

	for i, j := 0, len(path) - 1; i < j; i, j = i + 1, j - 1 {
		path[i], path[j] = path[j], path[i]
	}

	return path, dist[endID], nil
}