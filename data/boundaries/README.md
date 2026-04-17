# Agri Boundary Files

## Files

- `agri-fields-template.geojson`: draft GeoJSON template for the Agri demo fields

## Intended Workflow

1. Open `agri-fields-template.geojson` in QGIS.
2. Duplicate it into a working file such as `agri-fields-working.geojson` or a GeoPackage layer.
3. Draw a polygon for each feature using the Agri field boundary notes in the Agri docs set.
4. Replace each `geometry: null` entry with the final polygon geometry.
5. Fill in `north_edge`, `south_edge`, `east_edge`, and `west_edge` with the actual edge references used.
6. Change `status` from `draft` to `reviewed` after manual verification.

## Required Properties

Keep these fields for each feature:

- `area_id`
- `area_name`
- `phase`
- `boundary_method`
- `region_scope`
- `theme`
- `status`
- `north_edge`
- `south_edge`
- `east_edge`
- `west_edge`
- `center_point_reason`
- `boundary_notes`

## Notes

- The template intentionally uses `geometry: null` because the actual polygons still need to be drawn in QGIS.
- For metric calculations, reproject the final layer to an appropriate projected CRS before measuring area and distance.
- If the team prefers, the final production boundary layer can be stored as GeoPackage instead of GeoJSON.
