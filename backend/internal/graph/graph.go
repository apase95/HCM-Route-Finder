package graph

import (
	"encoding/json"
	"fmt"
	"hcm-route-finder/internal/models"
	"log"
	"math"
)

type Node struct {
	ID 	int64
	Lat float64
	Lng float64
}

type Edge struct {
	From 	int64
	To 		int64
	Weight 	float64
}

type RouteGraph struct {
	Nodes map[int64]Node
	Edges map[int64][]Edge
}

func NewRouteGraph() *RouteGraph {
	return &RouteGraph{
		Nodes: make(map[int64]Node),
		Edges: make(map[int64][]Edge),
	}
}

func Haversine(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371e3
	dLat := (lat2 - lat1) * (math.Pi / 180.0)
	dLon := (lon2 - lon1) * (math.Pi / 180.0)
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180.0)*math.Cos(lat2*math.Pi/180.0)*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

func BuildGraph(roads []models.RoadWay) *RouteGraph {
	graph := NewRouteGraph()
	coordToID := make(map[string]int64)
	var nextNodeID int64 = 1

	log.Println("⚙️ Đang xây dựng Đồ thị (Graph) vào RAM...")

	for _, road := range roads {
		var geojson models.GeoJSONLineString
		err := json.Unmarshal([]byte(road.GeoJSON), &geojson)
		if err != nil { continue }

		coords := geojson.Coordinates
		if len(coords) < 2 { continue }
	
		for i := 0; i < len(coords) - 1; i++ {
			lng1, lat1 := coords[i][0], coords[i][1]
			lng2, lat2 := coords[i+1][0], coords[i+1][1]

			key1 := fmt.Sprintf("%.6f,%.6f", lat1, lng1)
			key2 := fmt.Sprintf("%.6f,%.6f", lat2, lng2)

			id1, exists1 := coordToID[key1]
			if !exists1 {
				id1 = nextNodeID
				coordToID[key1] = id1
				graph.Nodes[id1] = Node{ID: id1, Lat: lat1, Lng: lng1}
				nextNodeID++
			}

			id2, exists2 := coordToID[key2]
			if !exists2 {
				id2 = nextNodeID
				coordToID[key2] = id2
				graph.Nodes[id2] = Node{ID: id2, Lat: lat2, Lng: lng2}
				nextNodeID++
			}

			dist := Haversine(lat1, lng1, lat2, lng2)
			graph.Edges[id1] = append(graph.Edges[id1], Edge{From: id1, To: id2, Weight: dist})
			if road.Oneway != "yes" {
				graph.Edges[id2] = append(graph.Edges[id2], Edge{From: id2, To: id1, Weight: dist})
			}
		}
	}
	log.Printf("✅ Xây dựng Graph hoàn tất: [%d Nodes] và [%d Edges]", len(graph.Nodes), len(graph.Edges))

	return graph
}