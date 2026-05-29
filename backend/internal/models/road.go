package models

type RoadWay struct {
	OsmID 			int64
	Oneway 			string
	GeoJSON 		string 	`gorm:"column:geojson"`
	TotalDistance 	float64 `gorm:"column:total_distance"`
}

type GeoJSONLineString struct {
	Type 		string 		`json:"type"`
	Coordinates [][]float64 `json:"coordinates"`
}