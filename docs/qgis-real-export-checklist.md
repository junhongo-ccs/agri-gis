# QGIS Real Export Checklist

## Goal

Create the real summary CSV for the React screen and future Dify input:

- `data/exports/phase1_areas_summary_counts.csv`

This checklist assumes the QGIS project already contains:

- `phase1_areas_polygon`
- the latest summary layer with count fields

## Target Columns

The exported CSV should contain these columns in this order:

1. `area_id`
2. `area_name`
3. `theme`
4. `status`
5. `area_km2`
6. `cafe_count`
7. `restaurant_count`
8. `museum_count`
9. `hotel_count`
10. `station_count`
11. `cafe_density`
12. `restaurant_density`
13. `museum_density`
14. `hotel_density`
15. `station_density`

## Step 1. Open The Existing Project

1. Open [qgis/phase1-tourism-poc.qgz](C:/github/qgis-dify-tourism-poc/qgis/phase1-tourism-poc.qgz).
2. Confirm the current summary layer is present.
3. Open its attribute table before editing anything.

## Step 2. Clean The Existing Rows

In the current summary layer, confirm:

- `area_id`
  - `shinagawa`
  - `oimachi`
  - `shiba_park_tokyo_tower`
  - `odaiba`
- `area_name`
  - `Shinagawa`
  - `Oimachi`
  - `Shiba Park / Tokyo Tower`
  - `Odaiba`
- `status`
  - `draft`

If any values are wrong, use the attribute table to fix them first.

## Step 3. Save A Clean Working Copy

Before metric calculations:

1. Right-click the summary layer.
2. Choose `Export` -> `Save Features As...`
3. Format: `GeoPackage`
4. Save into:
   - `data/boundaries/phase1-areas-working.gpkg`
5. Layer name:
   - `phase1_areas_summary_counts_clean`

This gives you a stable layer for the next calculations.

## Step 4. Reproject To A Metric CRS

If the summary layer is still in geographic coordinates:

1. Right-click `phase1_areas_summary_counts_clean`
2. Choose `Export` -> `Save Features As...`
3. Format: `GeoPackage`
4. CRS:
   - `EPSG:6677`
   - or another Tokyo-friendly projected CRS already used in your project
5. Layer name:
   - `phase1_areas_summary_counts_metric`

Use the projected layer for area and density calculations.

Important:

- do not calculate `area_km2` in WGS84 longitude/latitude

## Step 5. Add `area_km2`

Open the Field Calculator on `phase1_areas_summary_counts_metric`.

Create a new field:

- Output field name: `area_km2`
- Output field type: `Decimal number (real)`
- Length: `10`
- Precision: `3`

Expression:

```qgis
round($area / 1000000, 3)
```

## Step 6. Add Density Fields

Create these new decimal fields one by one.

Common settings:

- Type: `Decimal number (real)`
- Length: `10`
- Precision: `2`

### `cafe_density`

```qgis
if("area_km2" > 0, round("cafe_count" / "area_km2", 2), NULL)
```

### `restaurant_density`

```qgis
if("area_km2" > 0, round("restaurant_count" / "area_km2", 2), NULL)
```

### `museum_density`

```qgis
if("area_km2" > 0, round("museum_count" / "area_km2", 2), NULL)
```

### `hotel_density`

```qgis
if("area_km2" > 0, round("hotel_count" / "area_km2", 2), NULL)
```

### `station_density`

```qgis
if("area_km2" > 0, round("station_count" / "area_km2", 2), NULL)
```

## Step 7. Verify The Final Attribute Table

Before exporting CSV, confirm:

- exactly 4 rows exist
- each row matches one polygon
- no count field is unexpectedly null
- `area_km2` is filled for all rows
- density fields are filled for all rows where area exists

If a density looks obviously wrong, check:

1. layer CRS
2. polygon geometry
3. count fields

## Step 8. Export The Real CSV

Once the metric layer looks correct:

1. Right-click `phase1_areas_summary_counts_metric`
2. Choose `Export` -> `Save Features As...`
3. Format: `Comma Separated Value [CSV]`
4. File name:
   - `data/exports/phase1_areas_summary_counts.csv`
5. Layer options:
   - `GEOMETRY=AS_XYZ` should be disabled if geometry export is optional
   - or choose no geometry if that option is available in your QGIS dialog
6. Encoding:
   - `UTF-8`

Recommended:

- export attributes only, without geometry columns, if QGIS allows it in the dialog

## Step 9. Replace The React Sample CSV

After the real export exists, copy or export the same CSV content to:

- `web/public/exports/phase1_areas_summary_counts.csv`

That file is what the current React screen reads during local development.

## Quick Expected Result

When the export is successful:

- the CSV in `data/exports/` becomes the source-of-truth project export
- the CSV in `web/public/exports/` becomes the UI input
- the React page updates without touching `App.jsx`

## If You Want A Safe First Pass

If you want the smallest reliable first export, stop here:

1. clean names
2. calculate `area_km2`
3. calculate the 5 density fields
4. export the CSV

That is enough to unblock the frontend and the next Dify integration step.
