# Agri-GIS Handoff Memo

This document is the handoff note for the next Codex session.

## One-Line Summary

We are converting the old QGIS-Dify tourism PoC into an Agri-GIS Intelligence PoC for field-level pest and disease support, pesticide spray calculation, and field management.

## What The Project Is

The target product is a grounded agricultural support app that combines:

- QGIS for field polygons and spatial context
- a web app for selecting fields and sending `agri_context`
- Dify for grounded explanation and workflow orchestration
- a deterministic code step for spray quantity calculation

The important design rule is:

- LLM for explanation
- code for calculation
- no mixing of those two roles

## What Has Already Been Done

### Spec and design docs

The repository has already been rewritten away from the tourism PoC at the spec and design level.

Updated files:

- [specify-input.txt](C:/github/agri-gis/specify-input.txt)
- [plan-input.txt](C:/github/agri-gis/plan-input.txt)
- [docs/design/poc-design.md](C:/github/agri-gis/docs/design/poc-design.md)
- [docs/dify/dify-design-plan.md](C:/github/agri-gis/docs/dify/dify-design-plan.md)
- [docs/dify/dify-schema-draft.md](C:/github/agri-gis/docs/dify/dify-schema-draft.md)
- [README.md](C:/github/agri-gis/README.md)

### Supporting docs already rewritten for Agri-GIS

- [docs/qgis/qgis-step-by-step.md](C:/github/agri-gis/docs/qgis/qgis-step-by-step.md)
- [docs/design/area-boundary-proposals.md](C:/github/agri-gis/docs/design/area-boundary-proposals.md)
- [docs/design/osm-category-mapping.md](C:/github/agri-gis/docs/design/osm-category-mapping.md)
- [docs/dify/dify-prompt-canonical.md](C:/github/agri-gis/docs/dify/dify-prompt-canonical.md)
- [docs/dify/dify-prompt-draft.md](C:/github/agri-gis/docs/dify/dify-prompt-draft.md)
- [docs/design/region-scope.md](C:/github/agri-gis/docs/design/region-scope.md)
- [docs/ops/railway-deploy.md](C:/github/agri-gis/docs/ops/railway-deploy.md)
- [docs/overview/session-2026-04-14-note.md](C:/github/agri-gis/docs/overview/session-2026-04-14-note.md)

### Placeholder docs

These are intentionally minimal because the copy source repo still exists:

- [docs/dify/dify-right-rail.md](C:/github/agri-gis/docs/dify/dify-right-rail.md)
- [docs/dify/dify-setup-checklist.md](C:/github/agri-gis/docs/dify/dify-setup-checklist.md)
- [docs/legacy/company-pc-view/company-pc-view-plan.md](C:/github/agri-gis/docs/legacy/company-pc-view/company-pc-view-plan.md)
- [docs/legacy/company-pc-view/company-pc-view-implementation-plan.md](C:/github/agri-gis/docs/legacy/company-pc-view/company-pc-view-implementation-plan.md)
- [docs/legacy/company-pc-view/company-pc-view-revision-plan.md](C:/github/agri-gis/docs/legacy/company-pc-view/company-pc-view-revision-plan.md)
- [docs/legacy/company-pc-view/company-pc-view-task-list.md](C:/github/agri-gis/docs/legacy/company-pc-view/company-pc-view-task-list.md)
- [docs/overview/progress-and-next-steps.md](C:/github/agri-gis/docs/overview/progress-and-next-steps.md)
- [docs/design/mobile-ui-notes.md](C:/github/agri-gis/docs/design/mobile-ui-notes.md)
- [docs/design/stitch-mobile-spec.md](C:/github/agri-gis/docs/design/stitch-mobile-spec.md)

### Renamed assets

- [data/boundaries/agri-fields-template.geojson](C:/github/agri-gis/data/boundaries/agri-fields-template.geojson)
- [data/boundaries/agri-fields-working.gpkg](C:/github/agri-gis/data/boundaries/agri-fields-working.gpkg)
- [data/exports/agri_fields_summary.csv](C:/github/agri-gis/data/exports/agri_fields_summary.csv)
- [data/exports/agri_fields_summary.qmd](C:/github/agri-gis/data/exports/agri_fields_summary.qmd)
- [data/mappings/agri-attribute-mapping.csv](C:/github/agri-gis/data/mappings/agri-attribute-mapping.csv)
- [qgis/agri-fields-poc-agri.qgz](C:/github/agri-gis/qgis/agri-fields-poc-agri.qgz)
- [web/index.html](C:/github/agri-gis/web/index.html)
- [web/.env.example](C:/github/agri-gis/web/.env.example)
- [web/package.json](C:/github/agri-gis/web/package.json)
- [web/package-lock.json](C:/github/agri-gis/web/package-lock.json)

## Core Project Spec

### Overview

The app should support:

- pest and disease diagnosis assistance
- pesticide spray calculation
- field-level management context

The key idea is to combine spatial data from QGIS with Dify responses so the output is useful in practice.

### Data layer

The intended field schema is:

- `field_id`
- `owner_name`
- `area_ha`
- `crop_type`
- `last_pesticide_date`
- `soil_ph`

The front end should send the selected field as `agri_context`.

### Dify logic

The intended Dify flow is:

- image input for symptom photos
- structured field context input
- knowledge base for pesticide label data
- code node for deterministic spray calculations

Calculation formula:

```text
Total spray liquid (L) = area(ha) × 10 × prescribed spray amount (L/10a)
Required pesticide amount (ml) = total spray liquid (L) × 1000 ÷ dilution ratio
```

### Frontend

The UI should support:

- polygon-based field selection
- image upload
- a right-side panel that shows Dify output and calculated spray quantity

## Most Important Remaining Work

1. Build a new [qgis/agri-fields-poc-agri.qgz](C:/github/agri-gis/qgis/agri-fields-poc-agri.qgz) for the Agri use case.
2. Make [data/boundaries/agri-fields-working.gpkg](C:/github/agri-gis/data/boundaries/agri-fields-working.gpkg) truly field-oriented.
3. Finalize the columns and values in [data/exports/agri_fields_summary.csv](C:/github/agri-gis/data/exports/agri_fields_summary.csv).
4. Fix the `agri_context` JSON schema to match the actual exported data.
5. Bring the web app and Dify contract into final alignment.

## Current Priority Order

1. QGIS project structure
2. boundary and export data
3. `agri_context` schema
4. web alignment
5. Dify workflow polish

## Hard Rules

- Do not revive `tourism_context`.
- Keep calculations deterministic in code, not in free-form LLM text.
- Do not mix calculation logic and explanation logic.
- The old tourism docs are no longer the source of truth.
- The QGIS project needs real internal Agri field structure, not just renamed files.

## Files That Still Need Care

The highest-risk remaining assets are:

- [qgis/agri-fields-poc-agri.qgz](C:/github/agri-gis/qgis/agri-fields-poc-agri.qgz)
- [data/boundaries/agri-fields-working.gpkg](C:/github/agri-gis/data/boundaries/agri-fields-working.gpkg)
- [data/exports/agri_fields_summary.csv](C:/github/agri-gis/data/exports/agri_fields_summary.csv)
- [web/dist/assets/index-1SWndS0s.js](C:/github/agri-gis/web/dist/assets/index-1SWndS0s.js) if the built bundle is still being used for inspection

## Recommended First Move

Open the QGIS project and decide:

- which layers are actually needed for the Agri PoC
- which layer names should remain
- which attributes are required in the export
- what the final `agri_context` contract should contain

If you continue from here, start with the QGIS project and the export schema.
For the task breakdown that reverses the work from the CSV boundary back to QGIS setup, see [docs/qgis/qgis-task-list.md](C:/github/agri-gis/docs/qgis/qgis-task-list.md).
