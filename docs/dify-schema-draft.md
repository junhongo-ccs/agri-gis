# Dify Schema Draft

## Purpose

This document defines a small, explicit JSON payload shape for sending QGIS-derived area summaries into Dify.

The goal is to keep every Dify answer grounded in exported indicators rather than hidden world knowledge.

## Primary Source

The primary input should be:

- `data/exports/phase1_areas_summary_counts.csv`

Optional supporting input:

- `data/exports/phase1_areas_evidence.csv`

## Required Summary CSV Columns

These fields should exist before JSON conversion:

- `area_id`
- `area_name`
- `theme`
- `status`
- `area_km2`
- `cafe_count`
- `restaurant_count`
- `museum_count`
- `hotel_count`
- `station_count`
- `cafe_density`
- `restaurant_density`
- `museum_density`
- `hotel_density`
- `station_density`

## Suggested Evidence CSV Columns

If an evidence table is exported, use:

- `area_id`
- `evidence_type`
- `evidence_key`
- `evidence_value`
- `source_dataset`
- `source_record_ref`
- `note`

## Single Area Payload

```json
{
  "schema_version": "phase1.v1",
  "generated_at": "2026-04-14T00:00:00+09:00",
  "area": {
    "area_id": "shinagawa",
    "area_name": "Shinagawa",
    "theme": "gateway_and_business",
    "status": "draft",
    "metrics": {
      "area_km2": 1.23,
      "counts": {
        "cafe": 27,
        "restaurant": 53,
        "museum": 5,
        "hotel": 7,
        "station": 5
      },
      "density_per_km2": {
        "cafe": 21.95,
        "restaurant": 43.09,
        "museum": 4.07,
        "hotel": 5.69,
        "station": 4.07
      }
    },
    "evidence": [
      {
        "evidence_type": "top_metric",
        "evidence_key": "restaurant_count",
        "evidence_value": 53,
        "note": "Highest raw count among tracked categories"
      }
    ]
  }
}
```

## Compare Payload

For compare questions, prefer one payload with a shared category list and two normalized area objects.

```json
{
  "schema_version": "phase1.v1",
  "comparison": {
    "left_area_id": "shinagawa",
    "right_area_id": "odaiba",
    "categories": ["cafe", "restaurant", "museum", "hotel", "station"],
    "areas": [
      {
        "area_id": "shinagawa",
        "area_name": "Shinagawa",
        "counts": {
          "cafe": 27,
          "restaurant": 53,
          "museum": 5,
          "hotel": 7,
          "station": 5
        },
        "density_per_km2": {
          "cafe": 21.95,
          "restaurant": 43.09,
          "museum": 4.07,
          "hotel": 5.69,
          "station": 4.07
        }
      },
      {
        "area_id": "odaiba",
        "area_name": "Odaiba",
        "counts": {
          "cafe": 18,
          "restaurant": 29,
          "museum": 5,
          "hotel": 2,
          "station": 12
        },
        "density_per_km2": {
          "cafe": 8.1,
          "restaurant": 13.0,
          "museum": 2.2,
          "hotel": 0.9,
          "station": 5.4
        }
      }
    ]
  }
}
```

## Conversion Rules

Use these rules when converting CSV rows to JSON:

- preserve `area_id` exactly as the stable machine key
- preserve `area_name` as the human label shown in UI and prompts
- keep all numeric fields as numbers, not strings
- represent missing metrics as `null`, not `0`, unless the QGIS output explicitly means zero
- round densities consistently after export, preferably to 2 decimal places
- include `schema_version` so prompt logic can evolve safely

## Prompt Contract

The Dify prompt should assume:

- the payload is the only trusted source
- every claim must cite one or more metrics or evidence rows
- weak or missing evidence must be stated plainly
- comparisons should mention whether they are based on raw counts, density, or both

## Minimal Transformation Spec

The CSV-to-JSON transformation can be implemented later with a small script using this mapping:

| CSV column | JSON path |
| --- | --- |
| `area_id` | `area.area_id` |
| `area_name` | `area.area_name` |
| `theme` | `area.theme` |
| `status` | `area.status` |
| `area_km2` | `area.metrics.area_km2` |
| `cafe_count` | `area.metrics.counts.cafe` |
| `restaurant_count` | `area.metrics.counts.restaurant` |
| `museum_count` | `area.metrics.counts.museum` |
| `hotel_count` | `area.metrics.counts.hotel` |
| `station_count` | `area.metrics.counts.station` |
| `cafe_density` | `area.metrics.density_per_km2.cafe` |
| `restaurant_density` | `area.metrics.density_per_km2.restaurant` |
| `museum_density` | `area.metrics.density_per_km2.museum` |
| `hotel_density` | `area.metrics.density_per_km2.hotel` |
| `station_density` | `area.metrics.density_per_km2.station` |

## Next QGIS Task

The next QGIS pass should produce a clean export that satisfies the required summary CSV columns.

Recommended immediate sequence:

1. open `qgis/phase1-tourism-poc.qgz`
2. clean area names in the latest summary layer
3. save a stable copy such as `phase1_areas_summary_counts_clean`
4. add `area_km2` and density fields
5. export the final summary CSV into `data/exports/phase1_areas_summary_counts.csv`
