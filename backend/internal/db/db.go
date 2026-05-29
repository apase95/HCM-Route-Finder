package db

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	dsn := "host=localhost user=hcm-route-finder password=hodangthaiduy123456 dbname=hcm-route-finder-databasedatabase port=5432 sslmode=disable TimeZone=Asia/Ho_Chi_Minh"
	
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}

	log.Println("✅ Database PostGIS connected successfully!")
}