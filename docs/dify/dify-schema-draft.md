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

## Suggested Evidence CSV Columns

If an evidence table is exported, use:

- `field_id`
- `evidence_type`
- `evidence_key`
- `evidence_value`
- `source_dataset`
- `source_record_ref`
- `note`

## Single Field Payload

```json
{
  "schema_version": "agri.v1",
  "generated_at": "2026-04-17T00:00:00+09:00",
  "field": {
    "field_id": "field_001",
    "field_name": "Demo Field A",
    "field_type": "managed_field",
    "metadata": {
      "area_ha": 1.82,
      "crop_type": "rice",
      "soil_ph": 5.8,
      "last_pesticide_date": "2026-04-01"
    },
    "context": {
      "management_note": "Early-season field with recent inspection",
      "rotation_status": "current_crop_continuous",
      "pest_pressure_note": "No confirmed outbreak",
      "nearest_access_point_distance_m": 180,
      "nearby_risk_flag_count": 2,
      "buffer_context_summary": "Bordering road and drainage edge"
    },
    "image_evidence": {
      "image_reference": "upload_abc123",
      "image_evidence_note": "Leaf discoloration visible on uploaded photo",
      "symptom_confidence_note": "Low to moderate confidence"
    },
    "selected_label": {
      "product_name": "Test Pesticide A",
      "spray_volume_per_10a_l": 100,
      "dilution_ratio": 1000
    },
    "evidence": [
      {
        "type": "field_area",
        "key": "area_ha",
        "value": 1.82,
        "source_dataset": "qgis_field_layer"
      },
      {
        "type": "soil",
        "key": "soil_ph",
        "value": 5.8,
        "source_dataset": "soil_layer"
      },
      {
        "type": "history",
        "key": "last_pesticide_date",
        "value": "2026-04-01",
        "source_dataset": "field_history"
      }
    ]
  }
}
```

## Calculation Payload

Use a separate calculation payload so the code step can compute the result deterministically.

```json
{
  "schema_version": "agri.v1",
  "field_id": "field_001",
  "calculation_inputs": {
    "area_ha": 1.82,
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
| `area_ha` | `field.metadata.area_ha` |
| `crop_type` | `field.metadata.crop_type` |
| `soil_ph` | `field.metadata.soil_ph` |
| `last_pesticide_date` | `field.metadata.last_pesticide_date` |
| `management_note` | `field.context.management_note` |
| `rotation_status` | `field.context.rotation_status` |
| `pest_pressure_note` | `field.context.pest_pressure_note` |

## Next Data Task

The next data pass should produce a clean export that satisfies the required summary CSV columns.

Recommended immediate sequence:

1. open the QGIS project for the Agri-GIS demo fields
2. clean field names in the latest summary layer
3. save a stable copy such as `agri_fields_summary_clean`
4. add `area_ha` and any required history or soil fields
5. export the final summary CSV into `data/exports/agri_fields_summary.csv`
