# Agri-GIS Intelligence PoC

Agri-GIS Intelligence is a proof of concept for field-level pest and disease support that combines QGIS, a web map UI, and Dify-based grounded responses.

## Current User Flow

1. QGIS prepares field polygons and exports field attributes.
2. The web app loads the selected field into `agri_context`.
3. Dify answers field-summary questions from the selected field context.
4. When the user continues the conversation, the right rail can return pesticide candidates and required quantity from the selected field context.
5. The web app keeps obvious off-topic chat local so the user does not wait on Dify for unrelated messages.
6. The chat shows one pesticide image inline for the first matched candidate in PoC mode.

## What This Repo Contains

- `qgis/` - QGIS project files and field-boundary work
- `data/` - field boundaries, summary exports, and mapping tables
- `web/` - React + Vite web app and Dify proxy scaffolding
- `docs/overview/` - handoff notes and progress summaries
- `docs/design/` - product, scope, and UI design notes
- `docs/qgis/` - QGIS workflow and export checklists
- `docs/dify/` - Dify schema, prompts, and setup notes
- `data/rag/` - Dify Knowledge に投入するRAGシードCSV
- `docs/ops/` - deployment notes
- `docs/legacy/` - older PC-view planning docs kept for reference

## Local Development

### Start

```bash
cd web
npm i
npm run dev
```

- Web UI: `http://127.0.0.1:5173`
- Dify proxy (if used): `http://127.0.0.1:8787`

### Environment

- `web/.env.local`
  - `VITE_DIFY_CHAT_ENDPOINT`
  - `VITE_DIFY_USER_ID`
- `web/.env.proxy`
  - `DIFY_API_BASE_URL`
  - `DIFY_API_KEY`

## Pesticide Image Mapping (PoC)

- Image directory: `web/public/pesticides/`
- Current mapped assets:
  - `orizemate-granule.png`
  - `bracin-flowable.png`
  - `affirm-emulsion.png`
  - `prevathon-flowable5.png`
  - `starkle-wdg.png`
  - `starkle-granule.png`

The UI intentionally displays one image for the first matched candidate while text can list multiple candidates.

## Favicon / OGP

- `web/public/favicon.svg`
- `web/public/favicon.png`
- `web/public/og-image.png`

Meta tags are configured in `web/index.html`.

## Current Working Docs

- [specify-input.txt](specify-input.txt)
- [plan-input.txt](plan-input.txt)
- [docs/overview/agri-handoff-memo.md](docs/overview/agri-handoff-memo.md)
- [docs/design/poc-design.md](docs/design/poc-design.md)
- [docs/design/company-pc-layout-principles.md](docs/design/company-pc-layout-principles.md)
- [docs/qgis/qgis-task-list.md](docs/qgis/qgis-task-list.md)
- [docs/dify/agri-gis-dify-design-plan.md](docs/dify/agri-gis-dify-design-plan.md)
- [docs/dify/agri-gis-dify-prompt-canonical.md](docs/dify/agri-gis-dify-prompt-canonical.md)
- [docs/dify/agri-gis-dify-prompt-llm1-canonical.md](docs/dify/agri-gis-dify-prompt-llm1-canonical.md)
- [docs/dify/agri-gis-dify-prompt-llm2-canonical.md](docs/dify/agri-gis-dify-prompt-llm2-canonical.md)
- [docs/dify/agri-gis-dify-prompt-llm3-canonical.md](docs/dify/agri-gis-dify-prompt-llm3-canonical.md)
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

The QGIS field data and Dify flow are connected. Current focus is improving demonstration quality: stable classification, better response readability, deterministic grounding for pesticide suggestions, and a future path for GIS-style questions such as nearby fields, adjacency, and comparison mode.

## Status

The repository is actively evolving as a PoC. Prompts and workflow settings are iterated in place with matching docs under `docs/dify/`.
