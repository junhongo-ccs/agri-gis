# Session Note 2026-04-14

## What Was Added

To make the next QGIS session easier to resume, the repository now includes:

- a CSV lookup table for agricultural attribute mapping:
  - `data/mappings/agri-attribute-mapping.csv`
- an exports directory note with the expected summary CSV columns:
  - `data/exports/README.md`
- a Dify payload schema draft based on the planned summary export:
  - `docs/dify/dify-schema-draft.md`
- a Dify right-rail contract and prompt draft:
  - `docs/dify/dify-right-rail.md`
  - `docs/dify/dify-prompt-draft.md`
- a setup checklist for the actual Dify app:
  - `docs/dify/dify-setup-checklist.md`

## Why This Helps

These artifacts reduce setup work in the next session:

- QGIS can use a concrete lookup table instead of rebuilding the mapping from prose
- the summary layer now has a clear target column set
- Dify integration has a stable JSON contract ready before the final CSV export exists
- the frontend now has a Railway deployment path with a matching Docker build

## Remaining Manual QGIS Work

The highest-priority manual work has shifted to Dify setup and proxy wiring, but the current QGIS artifacts are already usable:

1. confirm the exported CSV still matches the React screen
2. decide whether any optional evidence fields should be added later
3. keep the current QGIS project and layer names as the reference point

## Suggested Follow-Up

The next useful implementation step is to finish the Dify app and connect it to the local proxy.

## Migration Note

The current handoff target is the Agri-GIS PoC.

Keep the Dify API key out of the client and use the local proxy or backend only.
