SELECT
    osm_id,
    oneway,
    ST_AsGeoJSON(ST_Transform(way, 4326)) AS geojson,
    ST_Length(ST_Transform(way, 4326)::geography) AS total_distance
FROM planet_osm_line
WHERE
    highway IN (
        'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 
        'unclassified', 'residential', 'living_street',
        'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link'
    )
    AND (access IS NULL OR access NOT IN ('no', 'private'));