# Agri Exports

This directory stores structured outputs generated from the QGIS project.

Recommended exports for the Agri-GIS PoC:

- `agri_fields_summary.csv`
- `agri_fields_evidence.csv`
- optional per-field JSON payloads for Dify input

Minimum expected columns for `agri_fields_summary.csv`:

- `field_id`
- `field_name`
- `field_type`
- `area_ha`
- `crop_type`
- `soil_ph`
- `last_pesticide_date`
- `management_note`
- `rotation_status`
- `pest_pressure_note`

Keep the CSV UTF-8 encoded and preserve stable `field_id` values so downstream prompts can reference the rows reliably.
