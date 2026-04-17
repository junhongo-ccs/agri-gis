# QGIS Step-By-Step For The Tourism PoC

## Goal

This guide walks through the first QGIS workflow for the Phase 1 PoC areas:

- `Shinagawa`
- `Oimachi`
- `Shiba Park / Tokyo Tower`
- `Odaiba`

The goal is to produce:

- a boundary layer for the 4 areas
- categorized tourism POIs
- area-level summary indicators
- exported tables or JSON that can be passed into Dify

## What You Need Before Starting

Prepare these items first:

- QGIS installed
- the repository files available locally
- the template file [data/boundaries/phase1-areas-template.geojson](C:/github/qgis-dify-tourism-poc/data/boundaries/phase1-areas-template.geojson)
- the boundary notes in [docs/area-boundary-proposals.md](C:/github/qgis-dify-tourism-poc/docs/area-boundary-proposals.md)
- the category design in [docs/osm-category-mapping.md](C:/github/qgis-dify-tourism-poc/docs/osm-category-mapping.md)

## Phase 1 Workflow Overview

We will do this in order:

1. create a QGIS project
2. draw the 4 area polygons
3. load OpenStreetMap-derived tourism and station data
4. normalize OSM tags into project categories
5. spatially join features to the 4 areas
6. calculate summary indicators
7. export area summary and evidence tables

## Step 1. Create A New QGIS Project

1. Open QGIS.
2. Create a new project.
3. Save the project in the repo, for example as `qgis/phase1-tourism-poc.qgz`.
4. Set the project CRS to a projected CRS suitable for Tokyo-area distance and area calculations.

Recommended practice:

- keep the source boundary file in WGS84 if needed
- do calculations in a projected CRS

## Step 2. Load The Area Template Layer

1. Add vector layer.
2. Open [data/boundaries/phase1-areas-template.geojson](C:/github/qgis-dify-tourism-poc/data/boundaries/phase1-areas-template.geojson).
3. Confirm that the 4 features load with attributes and null geometry.
4. Save this layer as a working layer, ideally a GeoPackage layer, for example:
   `data/boundaries/phase1-areas-working.gpkg`

Why save as GeoPackage:

- easier editing
- more stable than editing raw GeoJSON directly
- better for adding fields later

## Step 3. Draw The 4 Area Polygons

1. Toggle editing for the working boundary layer.
2. For each feature, use the boundary notes to draw a polygon manually.
3. Use visible roads, coastline, park edges, and major blocks as practical boundaries.
4. Keep each polygon compact and focused on the visitor-facing area.
5. Save edits after each area.

Use these rough intentions:

- `Shinagawa`: station-centered gateway and hotel zone
- `Oimachi`: station-centered mixed retail and food zone
- `Shiba Park / Tokyo Tower`: landmark plus park walking zone
- `Odaiba`: waterfront leisure core, not the whole island

After drawing each polygon:

1. fill in `north_edge`
2. fill in `south_edge`
3. fill in `east_edge`
4. fill in `west_edge`
5. set `status` to `reviewed` only after checking the shape

## Step 4. Add A Basemap For Visual Reference

1. Add an OpenStreetMap basemap using your preferred QGIS method.
2. Keep it as a visual guide only.
3. Use it to confirm that each polygon matches the intended walking or tourism zone.

Do not use the basemap itself as analysis data. Use actual vector data layers for calculations.

## Step 5. Load Source Data Layers

For the first PoC, load these source layers:

- tourism-related OSM POIs
- station or transport node data
- optional park or shoreline context layers if useful for QA

Minimum required data layers:

- `tourism_poi_source`
- `station_source`

If your OSM extract contains mixed geometry types:

- keep points for POI counting
- convert polygons to representative points if needed for simple counting

## Step 6. Inspect Available OSM Tags

Before categorizing anything:

1. open the attribute table for the tourism POI layer
2. inspect which fields are actually available
3. check which tag fields hold values such as:
   `tourism`, `historic`, `amenity`, `shop`, `leisure`, `railway`, `public_transport`
4. confirm whether names and descriptions exist

This matters because real OSM extracts differ by tool and schema.

## Step 7. Create A Normalized Category Field

1. Open the tourism POI layer attributes.
2. Add a new text field called `normalized_category`.
3. Populate it using the mapping logic in [docs/osm-category-mapping.md](C:/github/qgis-dify-tourism-poc/docs/osm-category-mapping.md).

Recommended first-pass categories:

- `culture_history`
- `food_cafe`
- `nature_outdoor`
- `shopping_market`
- `lodging`
- `transport_gateway`
- `nightlife`
- `family_leisure`

Also add:

- `mapping_rule_id`
- `include_flag`

Suggested use:

- `mapping_rule_id`: trace which rule assigned the category
- `include_flag`: `1` if the feature should be counted in area indicators, `0` if excluded

## Step 8. Filter Out Noise Before Aggregation

Before area calculations:

1. review a sample of categorized features
2. check whether generic shops are dominating the dataset
3. confirm stations are not mixed into tourism POI counts unless intentionally included
4. exclude clearly irrelevant features by setting `include_flag=0`

Good QA questions:

- Are temples and museums ending up in `culture_history`?
- Are restaurants and cafes in `food_cafe`?
- Is `shop=*` creating too much noise?
- Is Odaiba showing more family/leisure signals than Shinagawa?

## Step 9. Prepare A Station Layer

1. Load the station dataset.
2. Keep only station-like features relevant to the PoC.
3. Add a clean station point layer if the source is mixed or noisy.
4. Make sure station names and IDs are preserved if available.

This layer will support:

- nearest station distance
- stations within threshold counts
- station-centered tourism spot counts

## Step 10. Join Tourism POIs To Areas

1. Use a spatial join or point-in-polygon workflow.
2. Assign each included tourism POI to one of the 4 areas.
3. Save the joined output as a new layer.

Recommended output fields:

- `area_id`
- `area_name`
- `normalized_category`
- `mapping_rule_id`
- `include_flag`

At this point, each tourism POI should clearly belong to one area or no area.

## Step 11. Calculate Basic Area Metrics

For each area, calculate:

- `area_size_km2`
- `tourism_poi_count`
- `tourism_poi_density_per_km2`
- category counts by `normalized_category`
- category ratios by `normalized_category`

Recommended approach:

1. calculate polygon area in square kilometers
2. aggregate counts of included POIs by area
3. aggregate counts by area plus category
4. convert category counts into ratios

## Step 12. Calculate Station Accessibility Metrics

For each area, calculate:

- `nearest_station_distance_m`
- `station_count_within_800m`
- `tourism_spot_count_within_800m_of_station`

Suggested practical method:

1. choose an area representative point
2. calculate nearest distance from representative point to station layer
3. build 800m station buffers
4. count tourism POIs intersecting those buffers

For the first pass, the area representative point can be:

- polygon centroid, if it falls sensibly inside the area
- or a manually adjusted representative point if centroid is misleading

## Step 13. Calculate Spatial Pattern Metrics

For each area, calculate a simple first-pass clustering summary.

Minimum useful metrics:

- `cluster_count`
- `largest_cluster_share`
- `walkable_core_spot_ratio`

If you want to keep this simple in the first pass:

1. create a distance-based clustering result for tourism POIs
2. count how many clusters exist per area
3. count how many spots belong to the largest cluster
4. calculate the share of spots belonging to dense clusters

If this step becomes too heavy, defer it temporarily and start with:

- nearest station distance
- category mix
- density

## Step 14. Prepare Text Evidence If Available

If the source data includes names, short descriptions, or linked metadata:

1. preserve those fields in the joined POI layer
2. extract keywords outside the LLM if possible
3. keep only short structured keyword outputs for Dify

For the first QGIS run, this can be postponed.

The first useful version can succeed even without text evidence if the spatial indicators are strong enough.

## Step 15. Build An Area Summary Table

Create one row per area with fields like:

- `area_id`
- `area_name`
- `area_size_km2`
- `tourism_poi_count`
- `tourism_poi_density_per_km2`
- `dominant_categories`
- `nearest_station_distance_m`
- `station_count_within_800m`
- `tourism_spot_count_within_800m_of_station`
- `cluster_count`
- `largest_cluster_share`
- `walkable_core_spot_ratio`

This is the main table that Dify will use.

## Step 16. Build An Area Evidence Table

Create a longer table with one evidence row per fact, for example:

- area/category ratio facts
- station distance facts
- cluster facts
- keyword facts

Suggested fields:

- `area_id`
- `evidence_type`
- `evidence_key`
- `evidence_value`
- `source_dataset`
- `source_record_ref`
- `note`

This table is useful for traceability and answer explanations.

## Step 17. Export Outputs

Export at least these outputs:

1. final area boundary layer
2. categorized tourism POI layer
3. area summary table as CSV
4. area evidence table as CSV

If possible, also export:

- one JSON file per area for Dify input
- one comparison JSON file with all Phase 1 areas

## Step 18. Run A Plausibility Check

Before handing anything to Dify, inspect the outputs manually.

Check:

- Do the 4 area polygons match how a person would describe the area?
- Do the dominant categories make intuitive sense?
- Is Shinagawa more gateway-oriented than Oimachi?
- Does Shiba Park / Tokyo Tower show open-space plus landmark signals?
- Does Odaiba look more spread-out and leisure-oriented?
- Are there any obviously bad counts caused by noisy OSM tags?

If something looks wrong, fix this order first:

1. boundary polygon
2. category mapping
3. source data cleaning
4. clustering settings

## Suggested Deliverables After The First QGIS Pass

At the end of the first successful pass, we should have:

- one clean boundary layer
- one categorized tourism POI layer
- one station layer ready for distance analysis
- one area summary CSV
- one area evidence CSV
- notes about any weak data or mapping issues

## What To Do Next

Once the first QGIS outputs exist, the next step is:

1. convert area summary rows into Dify-ready JSON
2. write the Dify prompt with explicit grounding rules
3. test 3 to 5 comparison questions
4. review whether every sentence can be traced back to indicators
