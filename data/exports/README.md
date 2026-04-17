# Exports

This directory stores structured outputs generated from the QGIS project.

Recommended exports for the Phase 1 tourism PoC:

- `phase1_areas_summary_counts.csv`
- `phase1_areas_evidence.csv`
- optional per-area JSON payloads for Dify input

Minimum expected columns for `phase1_areas_summary_counts.csv`:

- `area_id`
- `area_name`
- `theme`
- `status`
- `area_km2`
- `cafe_count`
- `restaurant_count`
- `museum_count`
- `hotel_count`
- `station_count`
- `cafe_density`
- `restaurant_density`
- `museum_density`
- `hotel_density`
- `station_density`

Keep the CSV UTF-8 encoded and preserve stable `area_id` values so downstream prompts can reference the rows reliably.
