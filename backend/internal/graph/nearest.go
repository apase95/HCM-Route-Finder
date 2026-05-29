package graph

import "math"

func (g *RouteGraph) FindNearestNode(lat, lng float64) int64 {
	var nearestID int64
	minDist := math.MaxFloat64

	for id, node := range g.Nodes {
		dist := Haversine(lat, lng, node.Lat, node.Lng)
		if dist < minDist {
			minDist = dist
			nearestID = id
		}
	}

	return nearestID
}