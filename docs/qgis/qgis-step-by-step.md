# QGIS Step-By-Step For The Agri-GIS PoC

## Goal

This guide walks through the first QGIS workflow for the Agri-GIS PoC.

The goal is to produce:

- a boundary layer for the sample fields
- field-level attributes such as area, crop, and management history
- summary indicators that can be passed into Dify
- a CSV export that the web app can load directly

## What You Need Before Starting

Prepare these items first:

- QGIS installed
- the repository files available locally
- the template file [data/boundaries/agri-fields-template.geojson](C:/github/agri-gis/data/boundaries/agri-fields-template.geojson)
- the field selection notes in the Agri docs set
- the attribute mapping in [data/mappings/agri-attribute-mapping.csv](C:/github/agri-gis/data/mappings/agri-attribute-mapping.csv)

## Phase 1 Workflow Overview

We will do this in order:

1. create a QGIS project
2. review the sample field polygons
3. load field attribute sources and context layers
4. normalize field attributes into project columns
5. spatially join features to the fields
6. calculate summary indicators
7. export the field summary table

## Step 1. Create A New QGIS Project

1. Open QGIS.
2. Create a new project.
3. Save the project in the repo, for example as `qgis/agri-fields-poc.qgz`.
4. Set the project CRS to a projected CRS suitable for area and distance calculations in the demo region.

Recommended practice:

- keep source geometry in WGS84 if needed
- do calculations in a projected CRS

## Step 2. Load The Field Template Layer

1. Add vector layer.
2. Open [data/boundaries/agri-fields-template.geojson](C:/github/agri-gis/data/boundaries/agri-fields-template.geojson).
3. Confirm that the sample field features load with their existing attributes.
4. Save this layer as a working layer, ideally a GeoPackage layer, for example:
   `data/boundaries/agri-fields-working.gpkg`

Why save as GeoPackage:

- easier editing
- more stable than editing raw GeoJSON directly
- better for adding fields later

## Step 3. Review And Adjust Field Polygons

1. Toggle editing for the working boundary layer.
2. For each feature, confirm that the geometry matches the intended sample field.
3. Use roads, drainage lines, visible field edges, and parcel boundaries as practical references.
4. Keep each polygon compact and stable enough for repeatable area calculations.
5. Save edits after each field.

Use these rough intentions:

- `field_id` should identify one sample field
- `owner_name` is only for demo data and may be pseudonymized later
- `crop_type` should reflect the intended crop or test crop
- `last_pesticide_date` should support recency checks
- `soil_ph` should support agronomic context

After adjusting each polygon:

1. fill in the required attributes
2. confirm `area_ha` is calculated from geometry
3. set `status` to `reviewed` only after checking the shape

## Step 4. Add A Basemap For Visual Reference

1. Add an OpenStreetMap basemap using your preferred QGIS method.
2. Keep it as a visual guide only.
3. Use it to confirm that each polygon matches the intended field boundary.

Do not use the basemap itself as analysis data. Use actual vector data layers for calculations.

## Step 5. Load Source Data Layers

For the first PoC, load these source layers:

- field boundary polygons
- agricultural census or mesh context layers
- optional soil or irrigation context layers
- optional risk layers if useful for QA

Minimum required data layers:

- `field_source`
- `context_source`

If your source data contains mixed geometry types:

- keep polygons for field calculations
- convert points or lines only when they are needed as contextual evidence

## Step 6. Inspect Available Attributes

Before normalizing anything:

1. open the attribute table for the field layer
2. inspect which fields are actually available
3. check which values are present for:
   `field_id`, `owner_name`, `area_ha`, `crop_type`, `last_pesticide_date`, `soil_ph`
4. confirm whether any supplemental management fields exist

This matters because real demo extracts differ by source and schema.

## Step 7. Create A Normalized Context Field Set

1. Open the field layer attributes.
2. Add or confirm the required demo columns.
3. Populate them using the mapping logic in [data/mappings/agri-attribute-mapping.csv](C:/github/agri-gis/data/mappings/agri-attribute-mapping.csv).

Recommended first-pass fields:

- `field_id`
- `owner_name`
- `area_ha`
- `crop_type`
- `last_pesticide_date`
- `soil_ph`
- `management_notes`
- `risk_flag`

Suggested use:

- `field_id`: stable key for Dify context
- `owner_name`: only if needed for the demo
- `area_ha`: computed field area in hectares
- `crop_type`: crop or test crop
- `last_pesticide_date`: date for recency checks
- `soil_ph`: soil context for interpretation
- `management_notes`: optional manual note
- `risk_flag`: simple QA flag for attention

## Step 8. Filter Out Noise Before Aggregation

Before area calculations:

1. review a sample of fields and contextual features
2. check whether missing or invalid values dominate the dataset
3. confirm `area_ha` is numeric and positive
4. exclude fields with incomplete demo data if needed

Good QA questions:

- Is `area_ha` computed consistently?
- Are missing dates or pH values handled cleanly?
- Are pseudonymous owner names stable?
- Are the sample fields distinct enough for the demo?

## Step 9. Prepare Context Layers

1. Load the context datasets.
2. Keep only the layers needed for the first PoC.
3. Make sure each contextual layer has a clear purpose.
4. Preserve source names and IDs if available.

This layer set will support:

- field adjacency checks
- crop and soil context
- simple risk or management annotations

## Step 10. Join Context To Fields

1. Use a spatial join or field-by-field attribute workflow.
2. Assign each contextual feature to the corresponding field if needed.
3. Save the joined output as a new layer.

Recommended output fields:

- `field_id`
- `owner_name`
- `area_ha`
- `crop_type`
- `last_pesticide_date`
- `soil_ph`
- `management_notes`
- `risk_flag`

At this point, each field should clearly have one stable record or no record.

## Step 11. Calculate Basic Field Metrics

For each field, calculate:

- `area_ha`
- `field_count`
- `crop_group_count`
- simple completeness flags
- optional density or ratio fields if useful

Recommended approach:

1. calculate polygon area in hectares
2. aggregate counts of valid field records
3. derive simple completeness ratios
4. keep the output easy to inspect in CSV

## Step 12. Prepare The CSV Export

Export a CSV named [data/exports/agri_fields_summary.csv](C:/github/agri-gis/data/exports/agri_fields_summary.csv).

Minimum recommended columns:

- `field_id`
- `owner_name`
- `area_ha`
- `crop_type`
- `last_pesticide_date`
- `soil_ph`
- `management_notes`
- `risk_flag`

## Step 13. Final Checks

Before handing the CSV to the web app or Dify:

1. confirm the file path is correct
2. confirm the header names match the expected schema
3. confirm `area_ha` is numeric
4. confirm dates are in a consistent format
5. confirm the sample fields are stable enough for the demo

## Recommended Next Step

After finalizing this workflow, create:

- the exported CSV used by the web app
- a short note about which fields were included
- a summary of any demo-only assumptions or pseudonymized values
