# Area Boundary Proposals For Phase 1

## Purpose

This document proposes practical first-pass area boundaries for the Phase 1 PoC areas:

- `Shinagawa`
- `Oimachi`
- `Shiba Park / Tokyo Tower`
- `Odaiba`

The goal is not legal or administrative precision. The goal is to define area polygons that are:

- easy to explain
- stable enough for reproducible QGIS processing
- different enough to produce meaningful comparisons

## Boundary Design Principles

For this PoC, boundary choice should follow these rules:

- prefer recognizable walking or tourism zones over large ward-scale areas
- keep each polygon compact enough that density and walkability indicators remain meaningful
- avoid polygons that are so small that one facility dominates all metrics
- avoid mixing two very different area characters into one polygon
- document the logic well enough that another contributor can redraw the same area

## Recommended Boundary Method

Use manually curated polygons for the first PoC.

Reason:

- administrative boundaries do not match tourism behavior very well in these areas
- the Phase 1 goal is explanatory quality, not official statistics
- manual tourism polygons are easier to present in demos

Each polygon should be stored with:

- `area_id`
- `area_name`
- `boundary_method = manual_tourism_polygon`
- `boundary_notes`

## Proposed Areas

### 1. Shinagawa

#### Recommended concept

Use a station-centered gateway and hotel district polygon around Shinagawa Station rather than a broad district definition.

#### Include

- Shinagawa Station east-west immediate influence zone
- station forecourt and main access corridors
- hotel concentration around the station
- major visitor-facing commercial facilities directly tied to station movement

#### Exclude

- broad surrounding residential areas
- distant waterfront logistics zones
- detached office zones that do not contribute to visitor walkability

#### Suggested polygon logic

Create a compact polygon that captures:

- the station node itself
- the high-access hotel and commercial belt
- the main pedestrian catchment that a first-time visitor would reasonably explore on foot

#### Why this works

- supports a clear `gateway` interpretation
- avoids dilution from non-tourism land uses
- makes station-distance and cluster metrics more interpretable

#### Expected comparison role

- benchmark for `transport-accessible urban gateway`

### 2. Oimachi

#### Recommended concept

Use a station-centered urban activity polygon around Oimachi Station that captures redevelopment, shopping, food, and local urban movement.

#### Include

- Oimachi Station immediate surroundings
- main retail and dining streets
- station-linked commercial complexes
- nearby visitor-relevant facilities within a short walk radius

#### Exclude

- wide residential hinterland
- industrial edges not tied to visitor movement
- distant low-activity blocks beyond the core walking zone

#### Suggested polygon logic

Create a compact but slightly broader polygon than Shinagawa if needed to capture the mixed-use urban core.

The polygon should reflect:

- station-led access
- everyday city activity
- moderate walking circulation across retail and dining points

#### Why this works

- highlights contrast with Shinagawa's gateway-heavy profile
- captures redevelopment and local-urban texture
- likely produces a useful mix of food, shopping, and transport signals

#### Expected comparison role

- benchmark for `redevelopment-influenced mixed urban center`

### 3. Shiba Park / Tokyo Tower

#### Recommended concept

Use a landmark-centered polygon combining Tokyo Tower, Shiba Park, and the immediate temple or heritage context that forms one walkable visitor zone.

#### Include

- Tokyo Tower
- Shiba Park open-space core
- direct pedestrian routes between the park and tower
- immediate heritage or temple assets that are naturally part of the same visit pattern

#### Exclude

- broad office districts in central Minato
- large surrounding residential or embassy areas
- distant station catchments that are not part of the landmark walk

#### Suggested polygon logic

Draw a destination-centered polygon that captures one coherent open-space and landmark experience.

The polygon should preserve:

- landmark pull
- park/open-space influence
- short-distance walkability between major points

#### Why this works

- produces a clear landmark-plus-open-space signature
- avoids the area being swallowed by surrounding office geography
- should create a good contrast with both Shinagawa and Oimachi

#### Expected comparison role

- benchmark for `landmark-oriented urban walking area`

### 4. Odaiba

#### Recommended concept

Use a waterfront leisure polygon centered on the main visitor-facing Odaiba zone, not the entire reclaimed island area.

#### Include

- major waterfront promenade and leisure destinations
- mall and attraction cluster that visitors commonly treat as one trip area
- park or open-space edges directly tied to the same visit pattern

#### Exclude

- remote exhibition or logistics edges outside the main leisure core
- broad back-of-island infrastructure zones
- detached facilities requiring separate travel legs

#### Suggested polygon logic

Create a larger polygon than the other three areas, but keep it bounded to the primary visitor experience zone.

The polygon should preserve:

- waterfront orientation
- destination-style movement
- spread-out leisure structure

#### Why this works

- gives the PoC a clearly different spatial pattern
- helps test whether the model can describe a more dispersed leisure area
- strengthens the demo by adding a visually and behaviorally distinct destination

#### Expected comparison role

- benchmark for `waterfront leisure destination`

## Relative Size Guidance

The polygons do not need to be equal in area, but they should be roughly comparable as visitor zones.

Recommended rule:

- Shinagawa and Oimachi should be the most compact
- Shiba Park / Tokyo Tower should be compact to medium
- Odaiba can be the broadest, but not more than needed for the main leisure core

If one polygon becomes much larger than the others, density metrics may become misleading.

## Practical Drawing Guidance In QGIS

For the first pass, draw polygons manually on top of:

- station locations
- major roads
- waterways
- park boundaries
- coastline
- visible commercial clusters

Suggested workflow:

1. place station and major destination layers on the map
2. identify the main visitor walking zone
3. use roads, shoreline, and parks as natural polygon edges
4. keep a short note explaining each edge choice

## Boundary Notes Template

For each polygon, record notes in this style:

- `north_edge`
- `south_edge`
- `east_edge`
- `west_edge`
- `center_point_reason`
- `why_excluded_adjacent_area`

This will make later revision easier.

## Suggested Initial Comparison Hypotheses

These are not outputs to show users. They are internal hypotheses for validation.

- `Shinagawa` should score high on transport access and lodging context
- `Oimachi` should show stronger everyday food and shopping mix than Shinagawa
- `Shiba Park / Tokyo Tower` should show stronger landmark and open-space balance
- `Odaiba` should show a more dispersed cluster pattern and stronger family-leisure signal

If the indicators do not reflect these broad differences, the issue is likely in:

- polygon definition
- OSM category mapping
- clustering rules
- station handling

## Recommended Next Deliverable

After agreeing on these boundary concepts, create:

- a GeoJSON or GeoPackage layer with the 4 polygons
- a short metadata table describing each polygon
- a first extraction run to verify indicator plausibility
