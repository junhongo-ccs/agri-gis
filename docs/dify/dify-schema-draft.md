# Agri Context Schema Draft

## Purpose

This document defines a small, explicit JSON payload shape for sending field-level context into Dify.

The goal is to keep every Dify answer grounded in exported field attributes, uploaded image evidence, and label data rather than hidden world knowledge.

## Primary Sources

The primary inputs should be:

- `data/exports/agri_fields_summary.csv`
- the selected field geometry and attributes from the frontend
- uploaded crop symptom image references
- selected pesticide label data

Optional supporting input:

- `data/exports/agri_fields_evidence.csv`

## Required Summary CSV Columns

These fields should exist before JSON conversion:

- `field_id`
- `field_name`
- `field_type`
- `area_ha`
- `crop_type`
- `soil_ph`
- `last_pesticide_date`
- `management_note`
- `rotation_status`
- `pest_pressure_note`

## Optional Fields

These fields may be passed if the frontend has them, but they are not required by the current CSV export:

- `owner_name`
- `image_evidence_note`
- `image_reference`
- `selected_label`

## Single Field Payload

```json
{
  "schema_version": "agri.v1",
  "generated_at": "2026-04-20T00:00:00+09:00",
  "field": {
    "field_id": "field_001",
    "field_name": "与田浦",
    "field_type": "managed_field",
    "area_ha": 10.09,
    "crop_type": "mixed_crop",
    "soil_ph": 6.3,
    "last_pesticide_date": "2026-04-10",
    "management_note": "routine management",
    "rotation_status": "current",
    "pest_pressure_note": "none observed"
  },
  "context": {
    "owner_name": "田中",
    "image_evidence_note": "symptom note if available",
    "image_reference": "upload_abc123",
    "selected_label": {
      "product_name": "Test Pesticide A",
      "spray_volume_per_10a_l": 100,
      "dilution_ratio": 1000
    }
  },
  "question": "この圃場はどんな特徴がありますか？"
}
```

## Calculation Payload

Use a separate calculation payload so the code step can compute the result deterministically.

```json
{
  "schema_version": "agri.v1",
  "field_id": "field_001",
  "calculation_inputs": {
    "area_ha": 10.09,
    "spray_volume_per_10a_l": 100,
    "dilution_ratio": 1000
  }
}
```

## Conversion Rules

Use these rules when converting CSV rows to JSON:

- preserve `field_id` exactly as the stable machine key
- preserve `field_name` as the human label shown in UI and prompts
- keep all numeric fields as numbers, not strings
- represent missing metrics as `null`, not `0`, unless the QGIS output explicitly means zero
- round numeric outputs consistently after export, preferably to 2 decimal places for display values
- include `schema_version` so prompt logic can evolve safely

## Prompt Contract

The Dify prompt should assume:

- the payload is the only trusted source
- every claim must cite one or more field attributes, image evidence notes, or label values
- weak or missing evidence must be stated plainly
- spray quantities should come from the deterministic code step, not from free-form model arithmetic

## Minimal Transformation Spec

The CSV-to-JSON transformation can be implemented later with a small script using this mapping:

| CSV column | JSON path |
| --- | --- |
| `field_id` | `field.field_id` |
| `field_name` | `field.field_name` |
| `field_type` | `field.field_type` |
| `area_ha` | `field.area_ha` |
| `crop_type` | `field.crop_type` |
| `soil_ph` | `field.soil_ph` |
| `last_pesticide_date` | `field.last_pesticide_date` |
| `management_note` | `field.management_note` |
| `rotation_status` | `field.rotation_status` |
| `pest_pressure_note` | `field.pest_pressure_note` |

## Next Data Task

The next data pass should produce a clean export that satisfies the required summary CSV columns.

Recommended immediate sequence:

1. open the QGIS project for the Agri-GIS demo fields
2. confirm the 5-row summary export is up to date
3. keep `area_ha` rounded consistently
4. align the frontend payload with the current CSV columns
5. export the final summary CSV into `data/exports/agri_fields_summary.csv`
