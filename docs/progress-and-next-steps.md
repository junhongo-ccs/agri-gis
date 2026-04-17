# Progress And Next Steps

## Purpose

This document records the current QGIS progress for the Phase 1 tourism PoC so work can resume smoothly on a later day.

## Current Status

Work completed in QGIS:

- QGIS LTR was installed and launched
- a project file was created and saved in the repository
- Phase 1 area polygons were created for:
  - `shinagawa`
  - `oimachi`
  - `shiba_park_tokyo_tower`
  - `odaiba`
- a working polygon layer exists as `phase1_areas_polygon`
- QuickOSM was installed
- OSM data retrieval was tested successfully
- area-level counts were successfully aggregated into a summary layer
- the summary layer was normalized and exported to CSV
- `area_km2` and density fields were added for the final summary table

Work completed in the React / Dify-side PoC:

- the main screen now shows the map as the primary surface
- the right rail works as a lightweight question-and-answer surface
- local chat fallback exists so the UI can be exercised before Dify is connected
- a small Dify proxy contract was added for `POST /api/dify/chat`
- a canonical Dify prompt source now exists at `docs/dify-prompt-canonical.md`
- Railway deployment is now the target for the frontend build
- the Railway production deployment is live and GitHub-linked
- the Dify app has been created, published, and connected through the server-side proxy
- the right rail now uses a desktop-oriented fixed-height layout with internal scroll
- assistant replies are split into multiple chat bubbles by blank lines
- the custom duplicate suggested-question block in the right rail was removed
- the input area now uses Enter to send, Shift+Enter to newline, and ignores IME composition Enter
- the map popup now focuses on facts:
  - area name
  - theme label
  - icon/count summary
  - factual count breakdown
- the popup no longer shows:
  - the decorative colored square
  - the old narrative interpretation line
- the user-facing theme label for `gateway` is now `移動拠点`

## Live State As Of 2026-04-15

The current live PoC state is:

- Railway production is serving the frontend build from `master`
- Dify API access is configured server-side through Railway variables
- the Dify app uses `tourism_context` as the grounded input variable
- `docs/dify-prompt-canonical.md` is the single source of truth for the Dify prompt
- the canonical prompt has also been pasted into the Dify app
- the current focus has shifted from infrastructure setup to UX and prompt tuning

## Latest Known Summary Fields

The latest working summary table includes these fields:

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

Latest known values from the current export:

| area_id | area_name | cafe_count | restaurant_count | museum_count | hotel_count | station_count |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `shinagawa` | `Shinagawa` | 27 | 53 | 5 | 7 | 5 |
| `oimachi` | `Oimachi` | 10 | 16 | 0 | 3 | 3 |
| `shiba_park_tokyo_tower` | `Shiba Park / Tokyo Tower` | 16 | 38 | 0 | 2 | 3 |
| `odaiba` | `Odaiba` | 18 | 29 | 5 | 2 | 12 |

The cleaned CSV export now exists at:

- `data/exports/phase1_areas_summary_counts.csv`

## Important Lessons Learned

These points matter for future work:

- keep `phase1_areas_polygon` as the source boundary layer
- use `Layer Extent = phase1_areas_polygon` or a canvas clearly showing all Phase 1 areas when running QuickOSM
- do not rely on partially accumulated summary layers without checking results after each step
- verify one category at a time before chaining multiple aggregations
- for counting, use point layers rather than polygon layers from QuickOSM results

## QGIS Artifacts To Keep

Keep these artifacts in the project:

- `phase1_areas_polygon`
- latest summary layer, currently named similar to `phase1_areas_summary_counts`
- QGIS project file:
  - `qgis/phase1-tourism-poc.qgz`

Intermediate layers that can be deleted or recreated:

- temporary `Count` output layers
- duplicate QuickOSM layers from failed or partial runs
- obsolete table-only layer created from the original template export

## Suggested Restart On Mac

If the next session starts on a Mac, resume in this order:

1. open the repository and confirm the branch is `master`
2. run `nvm use` in the repo root and in `web/` so `Node 24.13.1` is selected
3. verify the React app still loads the summary CSV and the right chat rail
4. confirm `docs/dify-prompt-canonical.md` is still the only prompt source to edit
5. if testing locally, copy `web/.env.example` and `web/.env.proxy.example` into local `.env` files
6. point `VITE_DIFY_CHAT_ENDPOINT` to the local proxy if needed
7. keep the Dify API key server-side only
8. if prompt behavior changes, update the canonical prompt file first and only then sync Dify

## Recommended Task Sequence For Next Session

Resume work in this order.

### Task 1. Continue prompt tuning from the canonical source

- edit `docs/dify-prompt-canonical.md` first
- sync the prompt changes into the Dify app
- keep outputs short, paragraph-based, and UI-friendly
- preserve the grounding rule that only `tourism_context` may be used

### Task 2. Keep the chat UI stable on desktop

- preserve the fixed-height right rail
- keep only the message list scrollable
- preserve the Enter / Shift+Enter behavior and IME-safe send handling
- verify long answers do not push the page height

### Task 3. Continue refining the map-popup / chat role split

- keep the popup factual and compact
- keep interpretation inside chat responses, not inside the popup
- preserve the icon-and-count UI in the popup

### Task 4. Optional future QGIS enrichment

- if the indicators need more nuance later, add extra evidence columns in QGIS
- keep those additions separate from the Dify connection work

## Quick Restart Checklist

At the start of the next session:

1. open `qgis/phase1-tourism-poc.qgz`
2. confirm `phase1_areas_polygon` is present
3. confirm the latest summary CSV is present
4. inspect the right rail behavior before changing layout or prompt rules
5. edit `docs/dify-prompt-canonical.md` before editing the Dify app prompt
6. keep the API key server-side only

## Notes On What Not To Repeat

- do not start aggregating from an unclear temporary `Count` layer
- do not chain multiple steps without checking the intermediate attribute table
- do not assume `railway=station` will always return results in this area
- prefer `public_transport=station` if station retrieval is sparse

## Suggested Deliverables For The Next Working Session

If the next session goes well, the deliverables should be:

- a shorter, more stable Dify response style tuned from the canonical prompt
- final confirmation that long desktop chat sessions stay inside the fixed right rail
- any remaining popup copy or theme-label cleanup
- optional extra QGIS evidence fields if needed later
