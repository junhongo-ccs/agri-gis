# Agri-GIS Intelligence PoC Initial Design

## Purpose

This document defines the first implementation slice for the Agri-GIS proof of concept:

- a small, practical field-level indicator set computed in QGIS
- a structured `agri_context` schema passed into Dify
- grounding rules for diagnosis language and spray calculation output

The design follows the project constitution:

- QGIS prepares field geometry and attributes
- the web app injects the selected field into context
- Dify interprets the context and image evidence
- deterministic code performs the spray calculation
- every user-facing answer must cite observable indicators or label data

## Initial Scope

The first PoC should start with a small number of demonstration fields and a limited but interpretable feature set.

Recommended first slice:

- 3 to 5 sample fields
- one common field unit definition across all samples
- field polygons from a QGIS-managed boundary layer
- optional enrichment from public or project-provided field history, soil, and crop metadata only when traceable and reproducible

Recommended area unit for the first slice:

- a field polygon representing a manageable demonstration parcel

The key requirement is consistency. All sample fields should use the same field definition logic.

## QGIS Initial Indicator Set

The first implementation should compute the following indicators per field.

### 1. Basic field metadata

- `field_id`: stable identifier
- `field_name`: display name
- `field_type`: boundary source type such as `demo_field`, `managed_field`
- `area_ha`: polygon area in hectares
- `crop_type`: primary crop or crop group
- `soil_ph`: soil acidity value if available
- `last_pesticide_date`: most recent application date if available

### 2. Field history and management context

These help support cautious operational interpretation.

- `management_note`: short field note if available
- `rotation_status`: crop rotation or continuity flag if available
- `pest_pressure_note`: optional historical pest or disease note
- `irrigation_note`: optional water management note

### 3. Spatial context

These support practical interpretation around the selected field.

- `nearest_access_point_distance_m`: distance from representative point to access point or road
- `nearby_risk_flag_count`: count of nearby risk-relevant features if used
- `buffer_context_summary`: short structured summary of nearby context

Keep the first pass simple. Only include spatial context that can be explained clearly and measured reproducibly.

### 4. Evidence for diagnosis support

These support richer but still grounded summaries.

- `image_evidence_note`: short structured note from image analysis or manual tagging
- `symptom_confidence_note`: cautious note about visible symptoms
- `text_source_count`: number of text sources used if any
- `top_keywords`: top keywords extracted from field notes or image notes

Do not pass long raw descriptions into the LLM in the first PoC. Pass short structured evidence only.

## Suggested QGIS Output Tables

The first PoC can stay simple with two output tables.

### Field summary table

One row per field, intended for Dify retrieval and LLM grounding.

Suggested columns:

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
- `nearest_access_point_distance_m`
- `nearby_risk_flag_count`
- `buffer_context_summary`
- `image_evidence_note`
- `symptom_confidence_note`
- `text_source_count`
- `top_keywords`

### Field evidence table

One to many evidence rows per field, intended for traceable explanation support.

Suggested columns:

- `field_id`
- `evidence_type`
- `evidence_key`
- `evidence_value`
- `source_dataset`
- `source_record_ref`
- `note`

Example evidence rows:

- `field_area`, `area_ha`, `1.82`
- `soil`, `soil_ph`, `5.8`
- `history`, `last_pesticide_date`, `2026-04-01`
- `image`, `symptom_confidence_note`, `leaf discoloration visible`

## Agri Context Schema

Only structured summaries and evidence fields should be sent into Dify.

Recommended JSON payload for one field:

```json
{
  "schema_version": "agri.v1",
  "field_id": "field_001",
  "field_name": "Demo Field A",
  "field_metadata": {
    "field_type": "managed_field",
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
    "image_evidence_note": "Leaf discoloration visible on uploaded photo",
    "symptom_confidence_note": "Low to moderate confidence"
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
```

Recommended JSON payload for calculation:

```json
{
  "field_id": "field_001",
  "selected_label": {
    "product_name": "Test Pesticide A",
    "spray_volume_per_10a_l": 100,
    "dilution_ratio": 1000
  },
  "calculation_inputs": {
    "area_ha": 1.82
  }
}
```

## Minimum Output Types Expected From Dify

For the first PoC, Dify should generate only these output types.

### 1. Diagnosis-oriented summary

Short phrase such as:

- `possible leaf stress, low confidence`
- `symptom pattern needs closer inspection`
- `field context suggests caution after recent application`

### 2. Practical next-step summary

2 to 4 short sentences:

- what should be checked next
- what the image and field context suggest
- whether more data is needed

### 3. Spray calculation result

The response should include:

- total spray volume in liters
- pesticide amount in milliliters or liters as appropriate
- the label values used in the calculation

### 4. Evidence-grounded explanation

2 to 5 short sentences:

- which field attributes were used
- which image evidence was used
- which label data was used
- whether confidence is limited

## UI Presentation Direction

The PoC should not rely on the default Dify chat surface alone for user-facing presentation.

Recommended product split:

- QGIS prepares the field polygons and structured attributes
- a lightweight custom frontend presents the map, image upload, and result cards
- Dify provides grounded language in a side conversation panel or response area

Important implication:

- the map should remain a primary visual element
- Dify should be positioned as the interpretation layer, not the whole UI
- the calculation result should be visually emphasized as a first-class output

Recommended interaction model:

- user selects a field on a map
- the frontend shows the field summary and image upload area
- Dify explains the field context or diagnosis using only the structured payload
- the response area shows calculated spray quantity when a label is chosen

Avoid a narrow three-column layout where the map becomes too thin to read.

## Prompt Constraints For Dify

The initial prompt should enforce the following rules.

### Required behaviors

- Use only the provided indicators, image evidence, and label data.
- Present conclusions as interpretations, not objective truth.
- Mention the specific inputs used in each answer.
- Prefer short, plain explanations.
- If evidence is weak or mixed, say that explicitly.
- Keep calculation output exact and traceable.

### Forbidden behaviors

- Do not invent disease names, severity, or treatment outcomes.
- Do not claim safety or efficacy beyond the provided label and evidence.
- Do not invent missing field history or soil facts.
- Do not rely on world knowledge that is absent from the payload.
- Do not perform spray arithmetic in free-form prose if a code step is available.

### Recommended answer pattern

Use this structure internally when generating answers:

1. identify the strongest inputs
2. form a cautious interpretation
3. state the grounds explicitly
4. mention uncertainty if the evidence is partial

## Mapping Rules From Inputs To Language

To keep the first version interpretable, use lightweight rule hints.

- Recent pesticide history plus visible symptom uncertainty suggests caution before recommendation.
- Lower `soil_ph` can be mentioned as a contextual factor, not a diagnosis.
- Larger area plus label volume-per-10a produces a predictable spray quantity through the calculation step.
- Weak image evidence should lower confidence in diagnosis language.

These are hints, not hard-coded user-facing claims. The LLM should still cite the numeric and label evidence.

## Recommended First Sample Questions

- What should be checked next for this field?
- How much spray liquid is needed for this field?
- How much pesticide is needed for the selected label?
- Does this field history suggest any extra caution?
- How should this field condition be described cautiously?

## Implementation Sequence

Recommended build order:

1. Define sample fields and freeze field polygons.
2. Build field attribute export and summary CSV.
3. Prepare image upload and selected-field context injection.
4. Prepare label knowledge and calculation inputs.
5. Compute deterministic spray results in code.
6. Create Dify prompt and output format using only the exported payloads.
7. Manually review whether every generated sentence can be traced back to evidence or label data.

## Open Decisions To Resolve Soon

- exact field unit definition
- exact field selection workflow
- exact image evidence schema
- label data source and normalization rules
- rule for handling missing soil or history values
- evaluation rubric for grounded answer quality

## Recommended Next Artifact

After this document, the next useful artifact is:

- a concrete `agri-attribute-mapping` table for field attributes
- a sample `agri_fields_summary.json` export for 2 to 3 fields
- a Dify workflow draft that consumes this schema
