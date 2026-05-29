package api

import (
	"hcm-route-finder/internal/graph"
	"hcm-route-finder/internal/routing"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)


func GetRoute(g *graph.RouteGraph) gin.HandlerFunc {
	return func(c *gin.Context) {
		startLatStr := c.Query("startLat")
		startLngStr := c.Query("startLng")
		endLatStr := c.Query("endLat")
		endLngStr := c.Query("endLng")

		startLat, err1 := strconv.ParseFloat(startLatStr, 64)
		startLng, err2 := strconv.ParseFloat(startLngStr, 64)
		endLat, err3 := strconv.ParseFloat(endLatStr, 64)
		endLng, err4 := strconv.ParseFloat(endLngStr, 64)

		if err1 != nil || err2 != nil || err3 != nil || err4 != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Tọa độ không hợp lệ hoặc bị thiếu",
				"data": nil,
				"errorCode": "INVALID_COORDINATES",
			})
			return
		}

		startNodeID := g.FindNearestNode(startLat, startLng)
		endNodeID := g.FindNearestNode(endLat, endLng)
		pathIDs, distance, err := routing.AStar(g, startNodeID, endNodeID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"success":   false,
				"message":   "Không thể tìm thấy đường đi giữa 2 điểm này",
				"data":      nil,
				"errorCode": "ROUTE_NOT_FOUND",
			})
			return
		}

		var coords [][]float64
		for _, id := range pathIDs {
			node := g.Nodes[id]
			coords = append(coords, []float64{ node.Lat, node.Lng })
		}
		durationSeconds := distance / (30.0 / 3.6)
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Tìm đường thành công",
			"data": gin.H{
				"distance": distance,
				"duration": durationSeconds,
				"path":     coords,
			},
			"errorCode": nil,
		})
	}
}