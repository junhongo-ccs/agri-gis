# Field Selection Proposals For The Agri-GIS PoC

## Purpose

This document proposes practical first-pass field selections for the Agri-GIS PoC.

The goal is not cadastral precision. The goal is to define sample field polygons that are:

- easy to explain
- stable enough for repeatable QGIS processing
- different enough to produce meaningful agronomic comparisons

## Boundary Design Principles

For this PoC, field choice should follow these rules:

- prefer compact sample fields over wide regions
- keep each polygon simple enough that area and soil indicators remain meaningful
- avoid fields that are so small that one value dominates all metrics
- avoid mixing multiple management styles into one polygon
- document the logic well enough that another contributor can redraw the same field

## Recommended Selection Method

Use manually curated sample fields for the first PoC.

Reason:

- the goal is a clean demo set, not national coverage
- sample fields are easier to present and validate
- the first PoC should prioritize repeatability over completeness

Each field should be stored with:

- `field_id`
- `owner_name`
- `crop_type`
- `area_ha`
- `last_pesticide_date`
- `soil_ph`
- `selection_method = manual_demo_field`
- `boundary_notes`

## Proposed Sample Fields

### 1. Field A

#### Recommended concept

Use a small, easy-to-explain sample field that demonstrates a standard crop and a clean polygon shape.

#### Include

- one coherent field block
- stable crop management area
- simple geometry with clear edges

#### Exclude

- adjacent non-target parcels
- roads or drainage buffers outside the field
- mixed-use edges that would distort area-based calculations

#### Suggested polygon logic

Create a compact polygon that captures one management unit.

#### Why this works

- gives the PoC a baseline agronomic profile
- keeps area and soil indicators easy to interpret

#### Expected comparison role

- benchmark for `standard management field`

### 2. Field B

#### Recommended concept

Use a second sample field with a different crop or management profile to make comparison meaningful.

#### Include

- one coherent field block
- a slightly different crop type or history
- stable access and boundary edges

#### Exclude

- surrounding plots that are clearly different management units
- non-cultivated buffer areas

#### Suggested polygon logic

Create a compact polygon that contrasts with Field A in either crop, soil, or treatment history.

#### Why this works

- highlights contrast with the baseline field
- gives the demo something measurable to compare

#### Expected comparison role

- benchmark for `comparison field with different history`

### 3. Field C

#### Recommended concept

Use a field with a different soil or recency profile so the demo can show how context changes interpretation.

#### Include

- one coherent field block
- soil context that differs from the first two fields
- recent management history if available

#### Exclude

- anything outside the intended demo management unit

#### Suggested polygon logic

Draw a destination-centered management unit that is simple enough to maintain in the QGIS project.

#### Why this works

- produces a clear context-based difference
- helps test whether the model uses field attributes properly

#### Expected comparison role

- benchmark for `context-sensitive field`

## Relative Size Guidance

The polygons do not need to be equal in area, but they should be comparable enough for the demo.

Recommended rule:

- keep all sample fields within the same order of magnitude
- avoid one field being dramatically larger than the others unless that is the intended test case

If one polygon becomes much larger than the others, area metrics may become misleading.

## Practical Drawing Guidance In QGIS

For the first pass, draw polygons manually on top of:

- field edges
- roads
- drainage lines
- visible parcel boundaries
- irrigation or access features

Recommended attributes to set while drawing:

- `field_id`
- `owner_name`
- `crop_type`
- `last_pesticide_date`
- `soil_ph`
- `boundary_notes`

## Recommended Next Step

After the sample fields are finalized, use them as the base for:

- the working GeoPackage layer
- the summary CSV export
- the Dify context payload
