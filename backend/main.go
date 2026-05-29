package main

import (
	"hcm-route-finder/internal/db"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	db.ConnectDB()

	r := gin.Default()
	r.SetTrustedProxies(nil)
	r.GET("/favicon.ico", func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})

	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/api/v1/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H {
			"success": true,
			"message": "Backend Golang đã hoạt động thành công!",
			"data": nil,
			"errorCode": nil,
		})
	})

	log.Printf("🚀 Server is running on http://localhost:8080 ...")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to start server: ", err)
	}
}