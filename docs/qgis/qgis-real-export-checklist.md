# QGIS Real Export Checklist

## Goal

Create the real summary CSV for the Agri-GIS screen and future Dify input:

- `data/exports/agri_fields_summary.csv`

This checklist assumes the QGIS project already contains:

- `phase1_areas_polygon`
- the latest summary layer with `area_ha`

## Target Columns

The exported CSV should contain these columns in this order:

1. `field_id`
2. `field_name`
3. `field_type`
4. `area_ha`
5. `crop_type`
6. `soil_ph`
7. `last_pesticide_date`
8. `management_note`
9. `rotation_status`
10. `pest_pressure_note`

## Step 1. Open The Existing Project

1. Open [qgis/agri-fields-poc-agri.qgz](C:/github/agri-gis/qgis/agri-fields-poc-agri.qgz).
2. Confirm the current Agri field layer is present.
3. Open its attribute table before editing anything.

## Step 2. Confirm The Existing Rows

In the current layer, confirm:

- `field_id`
  - `field_001`
  - `field_002`
  - `field_003`
  - `field_005`
  - `field_004`
- `field_name`
  - `与田浦`
  - `与田浦北`
  - `与田浦東`
  - `与田浦南`
  - `与田浦西`
- `field_type`
  - `managed_field`
- `owner_name`
  - `田中`

If any values are wrong, use the attribute table to fix them first.

## Step 3. Confirm Area Calculation

Before export, confirm:

- `area_ha` exists
- `area_ha` is numeric
- `area_ha` is rounded consistently
- `area_ha` is positive for all rows

If needed, recalculate `area_ha` from geometry and round it to 2 decimals for display.

## Step 4. Verify The Final Attribute Table

Before exporting CSV, confirm:

- exactly 5 rows exist
- each row matches one polygon
- no key field is unexpectedly null
- `area_ha` is filled for all rows

If something looks off, check:

1. layer CRS
2. polygon geometry
3. attribute values

## Step 5. Export The Real CSV

Once the layer looks correct:

1. Right-click `phase1_areas_polygon`
2. Choose `Export` -> `Save Features As...`
3. Format: `Comma Separated Value [CSV]`
4. File name:
   - `data/exports/agri_fields_summary.csv`
5. Encoding:
   - `UTF-8`
6. Export attributes only, without geometry columns, if the dialog allows it

## Step 6. Replace The Web Copy

After the real export exists, copy or export the same CSV content to:

- `web/dist/exports/agri_fields_summary.csv`

This is the copy the current built React screen reads.

## Quick Expected Result

When the export is successful:

- the CSV in `data/exports/` becomes the source-of-truth project export
- the CSV in `web/dist/exports/` becomes the UI input
- the React page updates without touching the map or field IDs

## If You Want A Safe First Pass

If you want the smallest reliable first export, stop here:

1. confirm the 5 rows
2. confirm `area_ha`
3. export the CSV

That is enough to unblock the frontend and the next Dify integration step.
