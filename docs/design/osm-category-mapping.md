# Agricultural Attribute Mapping For The Agri-GIS PoC

## Purpose

This document defines how field and context attributes should be normalized for the Agri-GIS PoC.

The goal is not to build a perfect agronomic ontology. The goal is to produce a small, interpretable, and reproducible set of fields that the QGIS export and Dify workflow can use consistently.

## Mapping Principles

- Prefer a small number of stable fields over a detailed taxonomy.
- Normalize attributes based on the demo use case, not raw source field names alone.
- Keep the mapping reproducible and easy to explain.
- Exclude fields that are too ambiguous unless they are clearly useful in the sample fields.
- Record unmapped fields separately so the mapping can be extended later.

## Normalized Fields

The first PoC uses these normalized fields:

- `field_id`
- `owner_name`
- `area_ha`
- `crop_type`
- `last_pesticide_date`
- `soil_ph`
- `management_notes`
- `risk_flag`

## Recommended Input Layers

For the first pass, extract or join attributes from:

- field boundary polygons
- agricultural census or mesh context layers
- soil context layers
- optional management history layers

## Core Mapping Table

Each row maps one source attribute pattern into one normalized field.

| Priority | Source condition | Normalized field | Notes |
| --- | --- | --- | --- |
| 1 | `field_id` | `field_id` | Stable field key |
| 1 | `owner_name` | `owner_name` | Demo owner label or pseudonym |
| 1 | geometry area | `area_ha` | Computed from the polygon |
| 1 | `crop_type` | `crop_type` | Primary crop or test crop |
| 1 | `last_pesticide_date` | `last_pesticide_date` | Used for recency checks |
| 1 | `soil_ph` | `soil_ph` | Soil context |
| 1 | management note fields | `management_notes` | Free text or short note |
| 1 | QA or warning flags | `risk_flag` | Simple attention flag |
| 2 | missing numeric area | `area_ha` | Set null and flag for review |
| 2 | missing date | `last_pesticide_date` | Allow null for demo data |
| 2 | missing pH | `soil_ph` | Allow null for demo data |

## Priority Rules

Some source attributes may conflict or be missing. Use these resolution rules.

### 1. Stable field keys win over display labels

Use `field_id` as the primary join key whenever possible.

### 2. Calculated area wins over stored area when geometry is authoritative

If the polygon geometry is trustworthy, calculate `area_ha` from geometry rather than trusting a stale stored value.

### 3. Date fields should stay in one format

Normalize `last_pesticide_date` to a consistent date format before export.

### 4. Missing values should stay explicit

Do not invent values for fields that are absent. Use nulls and, if needed, a `risk_flag`.

## Recommended Handling Of Ambiguous Fields

These fields should be handled cautiously in the first PoC.

| Source condition | Suggested handling | Reason |
| --- | --- | --- |
| Unclear crop label | Keep as `crop_type` only if the source is stable | Avoid noisy labels |
| Free-text notes | Keep as `management_notes` | Useful but not structured |
| Incomplete ownership data | Keep pseudonymized `owner_name` or blank | Avoid unstable demo behavior |
| Soil context with mixed formats | Normalize to a numeric pH where possible | Better for comparison |
| Missing area geometry | Flag for review | Area is central to the demo |

## Suggested CSV Format

If implemented as a lookup table in QGIS or CSV, use columns like:

| source_field | normalized_field | include_flag | priority | notes |
| --- | --- | --- | --- | --- |
| `field_id` | `field_id` | 1 | 100 | stable key |
| `owner_name` | `owner_name` | 1 | 90 | demo label |
| geometry | `area_ha` | 1 | 100 | calculated from shape |
| `crop_type` | `crop_type` | 1 | 90 | crop label |
| `last_pesticide_date` | `last_pesticide_date` | 1 | 90 | recency field |
| `soil_ph` | `soil_ph` | 1 | 90 | soil context |
| notes | `management_notes` | 1 | 50 | optional free text |
| QA flag | `risk_flag` | 1 | 50 | optional attention flag |

Recommended logic:

- exact matches first
- calculated geometry fields second
- optional notes last
- keep `priority` numeric so conflicts are easy to resolve

## Suggested Aggregation Rules

For the first PoC, use simple counts and field-level calculations.

- Count one field once in one record
- Do not multi-label a single field into multiple primary records
- Keep raw values and also derive ratios or flags by area

If weighting becomes necessary later, add it as a separate step rather than mixing weighted and unweighted summaries in the first version.

## Outputs To Preserve For Auditability

Keep these outputs after mapping:

- original source attribute fields used for classification
- normalized field names
- mapping rule identifier
- source dataset name
- any manual overrides

This makes it easier to trace why a value was produced.

## First Review Checklist

When reviewing mapped output for sample fields, check:

- Are the field IDs stable and unique?
- Is `area_ha` numeric and positive?
- Are date formats consistent?
- Are missing values explicit rather than invented?
- Are owner names safe for the demo?
- Is the mapping simple enough to maintain?

## Recommended Next Step

After finalizing this mapping, create:

- a CSV lookup table used by QGIS
- 2 to 3 sample field summaries
- a short note on any fields left unmapped
