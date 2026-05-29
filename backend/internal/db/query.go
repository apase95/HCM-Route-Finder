package db

import (
	"hcm-route-finder/internal/models"
	"log"
)


func FetchAllRoads() []models.RoadWay {
	var roads []models.RoadWay

	query := `
		SELECT 
			osm_id,
			oneway,
			ST_AsGeoJSON(ST_Transform(way, 4326)) AS geojson,
			ST_Length(ST_Transform(way, 4326)::geography) AS total_distance
		FROM planet_osm_line
		WHERE highway IN (
			'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 
			'unclassified', 'residential', 'living_street',
			'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link'
		)
		AND (access IS NULL OR access NOT IN ('no', 'private'));
	`

	err := DB.Raw(query).Scan(&roads).Error
	if err != nil {
		log.Fatal("Lỗi khi truy vấn dữ liệu: ", err)
	}

	log.Printf("🗺️ Đã tải thành công %d đoạn đường từ Database vào RAM!", len(roads))
	return roads
}