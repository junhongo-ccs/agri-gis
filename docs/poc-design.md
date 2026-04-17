# QGIS + Dify Tourism PoC Initial Design

## Purpose

This document defines the first implementation slice for the proof of concept:

- a small, practical indicator set computed in QGIS
- a structured evidence schema passed into Dify
- grounding rules for LLM output generation

The design follows the project constitution:

- QGIS computes
- the LLM interprets
- every user-facing answer must cite observable indicators

## Initial Scope

The first PoC should start with a small number of sample areas and a limited but interpretable feature set.

Recommended first slice:

- 3 to 5 sample tourism areas
- one common area unit definition across all samples
- OpenStreetMap as the main baseline source
- optional enrichment from Wikimedia or public CSV only when traceable and easy to reproduce

Recommended area unit for the first slice:

- administrative neighborhood, district, or manually curated tourism polygon

The key requirement is consistency. All sample areas should use the same area unit logic.

## QGIS Initial Indicator Set

The first implementation should compute the following indicators per area.

### 1. Basic area metadata

- `area_id`: stable identifier
- `area_name`: display name
- `area_type`: boundary source type such as `admin`, `manual_tourism_polygon`
- `area_size_km2`: polygon area in square kilometers

### 2. Tourism POI volume

These capture how much tourism-related activity is present.

- `tourism_poi_count`: count of tourism-related POIs in the area
- `tourism_poi_density_per_km2`: tourism POIs divided by area size
- `all_poi_count`: optional broader POI count for context
- `all_poi_density_per_km2`: optional broader POI density

Recommended first-pass OSM categories:

- attractions and viewpoints
- museums and galleries
- temples, shrines, historic sites
- hotels and guest accommodations
- restaurants, cafes, food-related spots
- parks and waterfront-related recreation
- retail and market-related spots

### 3. Category mix

These support area character explanations.

- `poi_category_counts`: counts by category
- `poi_category_ratios`: normalized ratio by category
- `dominant_categories`: top 2 to 3 categories by share

Recommended normalized categories for the PoC:

- `culture_history`
- `food_cafe`
- `nature_outdoor`
- `shopping_market`
- `lodging`
- `transport_gateway`
- `nightlife`
- `family_leisure`

### 4. Station accessibility

These help support walkability and access interpretations.

- `nearest_station_distance_m`: distance from area centroid or representative point to nearest station
- `station_count_within_800m`: stations reachable within 800 meters from representative point
- `tourism_spot_count_within_800m_of_station`: tourism spots that fall within station walk buffers

For the first slice, use one simple and reproducible walk threshold:

- `800m` for station-centered walkability

### 5. Internal walkable tourism concentration

These indicate whether an area can be explored on foot.

- `tourism_spot_count_within_400m_clusters`
- `tourism_spot_count_within_800m_clusters`
- `walkable_core_spot_ratio`: share of tourism spots that belong to dense walkable clusters

If implementation time is tight, keep only:

- `walkable_core_spot_ratio`
- `tourism_spot_count_within_800m_clusters`

### 6. Clustering / spatial structure

These support descriptions such as compact, spread out, or node-based.

- `cluster_count`: number of tourism spot clusters in the area
- `largest_cluster_share`: share of tourism spots in the largest cluster
- `cluster_dispersion_index`: simple spread measure across clusters
- `spatial_pattern_label`: derived QGIS-side label such as `compact`, `multi_node`, `dispersed`

Important:

- `spatial_pattern_label` should be rule-based and documented
- the LLM may reference it, but should still cite the underlying numeric indicators

### 7. Text-derived keyword evidence

These support richer but still grounded summaries.

- `text_source_count`: number of descriptions used
- `top_keywords`: top keywords extracted from descriptions
- `keyword_theme_counts`: keyword counts grouped into themes
- `keyword_coverage_ratio`: share of spots with usable text

Recommended text sources:

- Wikimedia short descriptions or category text
- public tourism CSV descriptions
- reproducible text fields tied to source records

Do not pass long raw descriptions into the LLM in the first PoC. Pass extracted keywords and short evidence snippets only.

## Suggested QGIS Output Tables

The first PoC can stay simple with two output tables.

### Area summary table

One row per area, intended for Dify retrieval and LLM grounding.

Suggested columns:

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
- `cluster_dispersion_index`
- `spatial_pattern_label`
- `walkable_core_spot_ratio`
- `text_source_count`
- `top_keywords`
- `keyword_theme_counts`
- `keyword_coverage_ratio`

### Area evidence table

One to many evidence rows per area, intended for traceable explanation support.

Suggested columns:

- `area_id`
- `evidence_type`
- `evidence_key`
- `evidence_value`
- `source_dataset`
- `source_record_ref`
- `note`

Example evidence rows:

- `category_ratio`, `culture_history`, `0.42`
- `station_distance_m`, `nearest_station_distance_m`, `280`
- `keyword`, `temple`, `7`
- `cluster_metric`, `largest_cluster_share`, `0.68`

## Dify Evidence Schema

Only structured summaries and evidence fields should be sent into Dify.

Recommended JSON payload for one area:

```json
{
  "area_id": "asakusa",
  "area_name": "Asakusa",
  "area_metadata": {
    "area_type": "admin",
    "area_size_km2": 1.8
  },
  "indicators": {
    "tourism_poi_count": 124,
    "tourism_poi_density_per_km2": 68.9,
    "poi_category_ratios": {
      "culture_history": 0.31,
      "food_cafe": 0.28,
      "shopping_market": 0.17,
      "nature_outdoor": 0.06
    },
    "dominant_categories": [
      "culture_history",
      "food_cafe",
      "shopping_market"
    ],
    "nearest_station_distance_m": 220,
    "station_count_within_800m": 2,
    "tourism_spot_count_within_800m_of_station": 41,
    "cluster_count": 3,
    "largest_cluster_share": 0.72,
    "cluster_dispersion_index": 0.33,
    "spatial_pattern_label": "compact",
    "walkable_core_spot_ratio": 0.76,
    "text_source_count": 38,
    "top_keywords": [
      "temple",
      "traditional",
      "shopping street",
      "river",
      "festival"
    ],
    "keyword_theme_counts": {
      "heritage": 14,
      "food": 9,
      "waterside": 4
    },
    "keyword_coverage_ratio": 0.64
  },
  "evidence": [
    {
      "type": "category_ratio",
      "key": "culture_history",
      "value": 0.31,
      "source_dataset": "osm_tourism_poi"
    },
    {
      "type": "station_access",
      "key": "nearest_station_distance_m",
      "value": 220,
      "source_dataset": "osm_station"
    },
    {
      "type": "keyword",
      "key": "temple",
      "value": 11,
      "source_dataset": "wikimedia_text"
    }
  ]
}
```

Recommended JSON payload for comparison:

```json
{
  "areas": [
    {
      "area_id": "asakusa",
      "area_name": "Asakusa",
      "indicators": {}
    },
    {
      "area_id": "ueno",
      "area_name": "Ueno",
      "indicators": {}
    }
  ],
  "comparison_focus": "first_time_visitor"
}
```

## Minimum Output Types Expected From Dify

For the first PoC, Dify should generate only these output types.

### 1. Impression label

Short phrase such as:

- `compact heritage walk`
- `station-accessible museum district`
- `spread-out waterfront leisure area`

### 2. Area summary

2 to 4 short sentences:

- what kind of area it appears to be
- what indicators support that view
- what kind of visitor it may suit

### 3. Area comparison

2 to 5 short sentences:

- main differences
- where each area is stronger
- explicit evidence references

### 4. Audience-specific description

2 to 4 short sentences adjusted for:

- first-time visitors
- families
- foreign visitors
- people who want a calm walking experience

## UI Presentation Direction

The PoC should not rely on the default Dify chat surface alone for user-facing presentation.

Recommended product split:

- QGIS prepares the polygons and structured indicators
- a lightweight custom frontend presents maps and charts
- Dify provides grounded natural-language explanations in a side conversation panel

Important implication:

- the map should remain a primary visual element
- Dify should be positioned as the interpretation layer, not the whole UI

Recommended interaction model:

- user selects one or more areas on a map
- the frontend shows summary cards and indicator charts
- Dify explains the selected area or comparison using only the structured payload

Avoid a narrow three-column layout where the map becomes too thin to read.

## Prompt Constraints For Dify

The initial prompt should enforce the following rules.

### Required behaviors

- Use only the provided indicators and evidence.
- Present conclusions as interpretations, not objective truth.
- Mention the specific indicators used in each answer.
- Prefer short, plain explanations.
- If evidence is weak or mixed, say that explicitly.

### Forbidden behaviors

- Do not claim safety, popularity, or future growth unless directly supported by provided evidence.
- Do not invent missing facts about crowd size, atmosphere, pricing, or visitor demographics.
- Do not infer exact walking comfort from distance alone.
- Do not rely on world knowledge that is absent from the payload.

### Recommended answer pattern

Use this structure internally when generating answers:

1. identify the strongest indicators
2. form a cautious interpretation
3. state the grounds explicitly
4. mention uncertainty if the evidence is partial

## Mapping Rules From Indicators To Language

To keep the first version interpretable, use lightweight rule hints.

- High `culture_history` ratio plus heritage keywords suggests historic or traditional character.
- High `food_cafe` ratio plus dense clusters suggests active street exploration.
- Low station distance plus high walkable cluster ratio suggests easy short-distance exploration.
- High largest cluster share suggests a concentrated core.
- Higher dispersion with multiple clusters suggests a broader or more spread-out visit pattern.

These are hints, not hard-coded user-facing claims. The LLM should still cite the numeric evidence.

## Recommended First Sample Questions

- What kind of tourism experience is this area suitable for?
- How is Area A different from Area B?
- Which area seems easier for a first-time visitor to explore?
- Which area seems better for a calm walking-oriented visit?
- How would you describe this area for families?

## Implementation Sequence

Recommended build order:

1. Define sample areas and freeze area polygons.
2. Build OSM extraction and normalized category mapping in QGIS.
3. Compute area summary indicators.
4. Compute evidence rows for top supporting facts.
5. Export JSON payloads for a few sample areas.
6. Create Dify prompt and output format using only the exported payloads.
7. Manually review whether every generated sentence can be traced back to evidence.

## Open Decisions To Resolve Soon

- exact area unit definition
- exact OSM tag to normalized category mapping
- rule for representative point used in station distance
- clustering method and threshold
- keyword extraction method and stopword rules
- evaluation rubric for grounded answer quality

## Recommended Next Artifact

After this document, the next useful artifact is:

- a concrete `category-mapping` table for OSM tags
- a sample `area-summary.json` export for 2 to 3 areas
- a Dify prompt draft that consumes this schema
