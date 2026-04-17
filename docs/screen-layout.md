# Screen Layout Recommendation

## Goal

This document defines the recommended screen structure for the QGIS + Dify Tourism PoC.

The key conclusion is:

- do not place the map in a narrow left column

The map is one of the main value surfaces of this PoC and needs enough width to support area recognition, comparison, and interaction.

## Recommended Layout

Use a `main canvas + right conversation rail` layout.

Recommended split:

- left or center main area: `65% to 75%`
- right conversation panel: `25% to 35%`

Within the main area:

- top: large map
- bottom: summary cards and indicator charts

## Why This Layout Fits The PoC

This project has three user needs at the same time:

- see where the area is
- understand how the indicators differ
- read a grounded explanation

If the screen is split into three narrow vertical panes, the map becomes too thin and loses its value. The user then sees neither the geography nor the structure of each area clearly.

The recommended layout keeps:

- the map visually dominant
- the charts close to the map
- Dify available as an explanation layer without overwhelming the screen

## Wireframe

Desktop wireframe:

```text
+------------------------------------------------------+----------------------+
|                                                      |                      |
|                    MAIN MAP                          |    DIFY CHAT         |
|     selectable polygons, hover tooltips,            |    question input    |
|     base map, compare mode highlight                |    grounded answers  |
|                                                      |    evidence callout  |
+------------------------------------------------------+----------------------+
|                                                      |                      |
| SUMMARY CARDS + BAR CHARTS + EVIDENCE STRIP          |                      |
| area label, counts, density, top differences         |                      |
| comparison cards when 2 areas are selected           |                      |
|                                                      |                      |
+------------------------------------------------------+----------------------+
```

## Main Screen Regions

### 1. Map Region

The map should be the largest element on screen.

Recommended contents:

- Phase 1 area polygons
- selected area highlight
- hover tooltip with key metrics
- optional compare mode with two highlighted polygons

Recommended map interactions:

- click one area to inspect
- click two areas to compare
- hover to preview counts
- toggle between street map and imagery if useful

### 2. Summary And Chart Region

Place this below the map, not in a separate narrow side column.

Recommended contents:

- selected area title
- impression label
- indicator chips
- one small grouped bar chart for counts or densities
- one evidence strip listing the indicators used

For single-area mode, show:

- area label
- concise summary
- counts and densities

For compare mode, show:

- two area cards
- side-by-side bars
- a short machine-readable difference summary

### 3. Dify Conversation Rail

Dify should live in a right-side panel as the interpretation surface.

Recommended contents:

- question input
- generated explanation
- comparison explanation
- audience-specific rewrite
- explicit grounding notes

The chat panel should consume structured JSON prepared by the frontend or backend, not raw map layers.

## Recommended User Flow

### Single-area flow

1. user clicks an area on the map
2. the bottom panel updates with metrics and charts
3. the right panel shows a suggested summary or allows the user to ask a question
4. Dify returns a grounded explanation using the selected area's indicators

### Compare flow

1. user selects two areas
2. the map highlights both
3. the bottom panel shows differences in counts and densities
4. Dify explains the contrast in natural language

## Mobile Or Narrow-Screen Fallback

If the screen is narrow, stack the layout vertically:

- map first
- summary cards and charts second
- Dify conversation third

Do not preserve the desktop side-by-side layout on narrow screens if it causes the map to collapse.

## What To Avoid

Avoid these layouts:

- a thin left map column
- three equal vertical columns
- chat-first screens where the map is reduced to a thumbnail
- hiding the indicators behind the conversation instead of showing them directly

## Design Principle

Use the UI to separate responsibilities clearly:

- map for location and spatial context
- charts for immediate indicator comparison
- Dify for explanation and narrative grounding

This keeps the PoC interpretable and prevents the chat interface from becoming the only way to understand the result.
