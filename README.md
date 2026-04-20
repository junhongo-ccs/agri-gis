# Agri-GIS Intelligence PoC

Agri-GIS Intelligence is a proof of concept for field-level pest and disease support that combines QGIS, a web map UI, and Dify-based grounded responses.

The core flow is:

1. QGIS prepares field polygons and exports field attributes.
2. The web app loads the selected field into `agri_context`.
3. The user uploads a crop symptom image and optionally chooses a pesticide label.
4. Dify explains the field context and a code step calculates spray quantity deterministically.

## What This Repo Contains

- `qgis/` - QGIS project files and field-boundary work
- `data/` - field boundaries, summary exports, and mapping tables
- `web/` - React + Vite web app and Dify proxy scaffolding
- `docs/overview/` - handoff notes and progress summaries
- `docs/design/` - product, scope, and UI design notes
- `docs/qgis/` - QGIS workflow and export checklists
- `docs/dify/` - Dify schema, prompts, and setup notes
- `docs/ops/` - deployment notes
- `docs/legacy/` - older PC-view planning docs kept for reference

## Current Working Docs

- [specify-input.txt](specify-input.txt)
- [plan-input.txt](plan-input.txt)
- [docs/overview/agri-handoff-memo.md](docs/overview/agri-handoff-memo.md)
- [docs/design/poc-design.md](docs/design/poc-design.md)
- [docs/qgis/qgis-task-list.md](docs/qgis/qgis-task-list.md)
- [docs/dify/dify-design-plan.md](docs/dify/dify-design-plan.md)
- [docs/dify/dify-schema-draft.md](docs/dify/dify-schema-draft.md)

## Current Working Outputs

- [qgis/agri-fields-poc-agri.qgz](qgis/agri-fields-poc-agri.qgz)
- [data/boundaries/agri-fields-working.gpkg](data/boundaries/agri-fields-working.gpkg)
- [data/exports/agri_fields_summary.csv](data/exports/agri_fields_summary.csv)
- [web/dist/exports/agri_fields_summary.csv](web/dist/exports/agri_fields_summary.csv)

These files represent the current Agri working set:

- 5 field polygons
- stable `field_id` values
- computed `area_ha`
- summary rows ready for `agri_context`

## Development Notes

- Keep the API key server-side only.
- Keep the spray calculation in code, not in free-form LLM text.
- Keep `agri_context` as the primary structured input contract.

## Current Focus

The QGIS field data is already in place. The next work is to wire the web app to build `agri_context` from the summary CSV, then align the Dify workflow and response rendering.

## Status

The repository is being refactored into the Agri-GIS PoC. Some files are still in transition and are being replaced in place.
