# OSM To Tourism Category Mapping

## Purpose

This mapping defines how OpenStreetMap tags should be normalized into the tourism categories used by the QGIS + Dify PoC.

The goal is not to create a perfect global ontology. The goal is to produce a small, interpretable, and reproducible category system for area-level tourism analysis.

## Mapping Principles

- Prefer a small number of stable categories over a detailed taxonomy.
- Normalize tags based on likely tourism interpretation, not raw OSM key names alone.
- Keep the mapping reproducible and easy to explain.
- Exclude tags that are too ambiguous unless they are clearly useful in the sample areas.
- Record unmapped tags separately so the mapping can be extended later.

## Normalized Categories

The first PoC uses these normalized categories:

- `culture_history`
- `food_cafe`
- `nature_outdoor`
- `shopping_market`
- `lodging`
- `transport_gateway`
- `nightlife`
- `family_leisure`

## Recommended Input Layers

For the first pass, extract POIs or relevant features from:

- `tourism=*`
- `historic=*`
- `amenity=*`
- `shop=*`
- `leisure=*`
- `railway=station`
- `public_transport=*` when useful for station enrichment
- selected `natural=*` or `waterway=*` features only if they support tourism context

## Core Mapping Table

Each row maps one or more OSM tag patterns into one normalized category.

| Priority | OSM condition | Normalized category | Notes |
| --- | --- | --- | --- |
| 1 | `tourism=museum` | `culture_history` | Strong tourism relevance |
| 1 | `tourism=gallery` | `culture_history` | Include art galleries |
| 1 | `tourism=attraction` | `culture_history` | Default unless better local rule exists |
| 1 | `tourism=viewpoint` | `nature_outdoor` | Scenic observation points |
| 1 | `tourism=artwork` | `culture_history` | Public art and sculptures |
| 1 | `tourism=theme_park` | `family_leisure` | Clear family/leisure use |
| 1 | `tourism=zoo` | `family_leisure` | Clear family/leisure use |
| 1 | `tourism=aquarium` | `family_leisure` | Clear family/leisure use |
| 1 | `tourism=hotel` | `lodging` | Accommodation |
| 1 | `tourism=hostel` | `lodging` | Accommodation |
| 1 | `tourism=guest_house` | `lodging` | Accommodation |
| 1 | `tourism=apartment` | `lodging` | Accommodation if mapped as stay use |
| 1 | `tourism=camp_site` | `nature_outdoor` | Outdoor stay and recreation |
| 1 | `tourism=caravan_site` | `nature_outdoor` | Outdoor stay and recreation |
| 1 | `historic=*` | `culture_history` | Castles, ruins, memorials, etc. |
| 1 | `amenity=place_of_worship` | `culture_history` | Temples, shrines, churches |
| 1 | `building=temple` | `culture_history` | Useful in some OSM extracts |
| 1 | `building=shrine` | `culture_history` | Useful in some OSM extracts |
| 1 | `amenity=restaurant` | `food_cafe` | Core dining |
| 1 | `amenity=cafe` | `food_cafe` | Cafes and coffee shops |
| 1 | `amenity=fast_food` | `food_cafe` | Quick dining |
| 1 | `amenity=food_court` | `food_cafe` | Food clusters |
| 1 | `amenity=ice_cream` | `food_cafe` | Tourism-friendly snack spots |
| 1 | `amenity=bar` | `nightlife` | Evening-oriented |
| 1 | `amenity=pub` | `nightlife` | Evening-oriented |
| 1 | `amenity=biergarten` | `nightlife` | Evening-oriented |
| 1 | `amenity=nightclub` | `nightlife` | Clear nightlife signal |
| 1 | `shop=mall` | `shopping_market` | Large shopping destination |
| 1 | `shop=department_store` | `shopping_market` | Large shopping destination |
| 1 | `shop=gift` | `shopping_market` | Souvenir relevance |
| 1 | `shop=souvenir` | `shopping_market` | Direct tourism relevance |
| 1 | `shop=convenience` | `shopping_market` | Optional, low weight if included |
| 1 | `amenity=marketplace` | `shopping_market` | Markets and shopping streets |
| 1 | `shop=*` | `shopping_market` | Broad fallback, use carefully |
| 1 | `leisure=park` | `nature_outdoor` | Urban green recreation |
| 1 | `leisure=garden` | `nature_outdoor` | Gardens and landscaped spaces |
| 1 | `leisure=nature_reserve` | `nature_outdoor` | Outdoor tourism relevance |
| 1 | `leisure=playground` | `family_leisure` | Family-oriented facility |
| 1 | `leisure=sports_centre` | `family_leisure` | Only if relevant in sample areas |
| 1 | `leisure=amusement_arcade` | `family_leisure` | Leisure facility |
| 1 | `railway=station` | `transport_gateway` | Core transport node |
| 1 | `public_transport=station` | `transport_gateway` | Use when station records are separate |
| 1 | `amenity=bus_station` | `transport_gateway` | Optional for multimodal access |
| 2 | `natural=beach` | `nature_outdoor` | Only if present in sample areas |
| 2 | `natural=peak` | `nature_outdoor` | Scenic outdoor relevance |
| 2 | `waterway=riverbank` | `nature_outdoor` | Better used as context than POI |
| 2 | `natural=water` | `nature_outdoor` | Use only for named visitor-facing features |

## Priority Rules

Some features may match more than one rule. Use these resolution rules.

### 1. Specific tourism tags win over broad fallback rules

Examples:

- `tourism=museum` should map to `culture_history` even if another tag suggests retail context
- `tourism=hotel` should map to `lodging` even if tagged with food amenities

### 2. `historic=*` and worship-related features should stay in `culture_history`

Even if a temple or shrine is also a visitor attraction, keep it in `culture_history` for consistency.

### 3. `nightlife` should only be used for clearly evening-oriented places

Do not infer nightlife from restaurants or cafes alone.

### 4. Broad `shop=*` fallback should be configurable

If the sample area becomes too retail-heavy because of generic shops, restrict fallback `shop=*` and keep only high-signal retail tags such as:

- `shop=mall`
- `shop=department_store`
- `shop=gift`
- `shop=souvenir`

## Recommended Handling Of Ambiguous Tags

These tags should be handled cautiously in the first PoC.

| OSM condition | Suggested handling | Reason |
| --- | --- | --- |
| `tourism=attraction` | Keep, but review sample outputs | Too broad but commonly useful |
| `shop=*` fallback | Optional or low-weight | Can overwhelm tourism signal |
| `amenity=restaurant` | Keep | Important for tourism character |
| `amenity=fast_food` | Keep but consider lower weight later | May overstate destination quality |
| `amenity=bus_station` | Optional | Useful in some cities, noisy in others |
| `leisure=sports_centre` | Optional | Often local-use rather than tourism-use |
| `natural=*` broad fallback | Avoid | Too inconsistent without curation |

## Suggested QGIS Mapping Table Format

If implemented as a lookup table in QGIS or CSV, use columns like:

| source_key | source_value | normalized_category | include_flag | priority | notes |
| --- | --- | --- | --- | --- | --- |
| tourism | museum | culture_history | 1 | 100 | direct tourism culture |
| amenity | cafe | food_cafe | 1 | 90 | food and rest |
| shop | souvenir | shopping_market | 1 | 90 | high tourism relevance |
| shop | * | shopping_market | 0 | 10 | optional fallback |

Recommended logic:

- exact matches first
- wildcard fallback second
- exclude rows where `include_flag=0`
- keep `priority` numeric so conflicts are easy to resolve

## Suggested Aggregation Rules

For the first PoC, use simple counts.

- Count one feature once in one dominant category
- Do not multi-label a single POI into multiple categories
- Keep raw counts and also derive ratios by area

If weighting becomes necessary later, add it as a separate step rather than mixing weighted and unweighted counts in the first version.

## Outputs To Preserve For Auditability

Keep these outputs after mapping:

- original OSM tag fields used for classification
- normalized category
- mapping rule identifier
- source dataset name
- any manual overrides

This makes it easier to trace why a category ratio was produced.

## First Review Checklist

When reviewing mapped output for sample areas, check:

- Are the top categories intuitively plausible for the area?
- Are generic shops overwhelming the result?
- Are transport nodes being counted as tourism POIs by mistake?
- Are temples, shrines, museums, and historic sites grouped consistently?
- Do family leisure signals appear only where they make sense?
- Do nightlife signals come only from strong tags?

## Recommended Next Step

After finalizing this mapping, create:

- a CSV lookup table used by QGIS
- 2 to 3 sample area category summaries
- a short note on any tags left unmapped
