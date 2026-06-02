import os
import psycopg
from psycopg.rows import dict_row

def fetch_all_roads():
    db_host = os.getenv("DB_HOST", "localhost")
    
    dsn = f"host={db_host} dbname=hcm-route-finder-databasedatabase user=hcm-route-finder password=hodangthaiduy123456 port=5432"
    
    query = """
        SELECT 
            osm_id,
            oneway,
            highway,
            ST_AsGeoJSON(ST_Transform(way, 4326)) AS geojson,
            ST_Length(ST_Transform(way, 4326)::geography) AS total_distance
        FROM planet_osm_line
        WHERE highway IN (
            'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 
            'unclassified', 'residential', 'living_street',
            'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link'
            'footway', 'pedestrian', 'steps', 'path', 'cycleway'
        )
        AND (access IS NULL OR access NOT IN ('no', 'private'));
    """
    
    print(f"🔄 Đang kết nối Database tại {db_host}...")
    
    try:
        with psycopg.connect(dsn, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                print("⏳ Đang truy vấn dữ liệu mạng lưới giao thông (có thể mất vài giây)...")
                cur.execute(query)
                roads = cur.fetchall()
                print(f"✅ 🗺️ Đã tải thành công {len(roads)} đoạn đường từ Database vào RAM!")
                return roads
                
    except Exception as e:
        print(f"❌ Lỗi kết nối hoặc truy vấn Database: {e}")
        raise e