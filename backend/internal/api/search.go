package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type NominatimResponse struct {
	DisplayName string `json:"display_name"`
	Lat         string `json:"lat"`
	Lon         string `json:"lon"`
}

func SearchLocation() gin.HandlerFunc {
	return func(c *gin.Context) {
		q := c.Query("q")
		if q == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success":   false,
				"message":   "Thiếu từ khóa tìm kiếm",
				"data":      nil,
				"errorCode": "MISSING_QUERY",
			})
			return
		}

		searchQuery := q + ", Hồ Chí Minh"
		encodedQuery := url.QueryEscape(searchQuery)

		nominatimURL := fmt.Sprintf("https://nominatim.openstreetmap.org/search?q=%s&format=json&limit=5", encodedQuery)
		client := &http.Client{Timeout: 10 * time.Second}
		req, _ := http.NewRequest("GET", nominatimURL, nil)		
		req.Header.Set("User-Agent", "HCM-Route-Finder-MVP/1.0")

		resp, err := client.Do(req)
		if err != nil || resp.StatusCode != 200 {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"success":   false,
				"message":   "Lỗi kết nối đến máy chủ tìm kiếm địa lý",
				"data":      nil,
				"errorCode": "NOMINATIM_ERROR",
			})
			return
		}
		defer resp.Body.Close()

		var nomRes []NominatimResponse
		if err := json.NewDecoder(resp.Body).Decode(&nomRes); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success":   false,
				"message":   "Lỗi xử lý dữ liệu tìm kiếm",
				"data":      nil,
				"errorCode": "PARSE_ERROR",
			})
			return
		}

		var results []map[string]interface{}
		for _, item := range nomRes {
			latFloat, _ := strconv.ParseFloat(item.Lat, 64)
			lngFloat, _ := strconv.ParseFloat(item.Lon, 64)

			results = append(results, map[string]interface{}{
				"name": item.DisplayName,
				"lat":  latFloat,
				"lng":  lngFloat,
			})
		}

		c.JSON(http.StatusOK, gin.H{
			"success":   true,
			"message":   "Tìm kiếm thành công",
			"data":      results,
			"errorCode": nil,
		})
	}
}