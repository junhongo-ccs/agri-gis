# Company PC Layout Principles (Agri-GIS)

## Purpose

This document defines the non-negotiable desktop layout principles for Agri-GIS.

The target is the company notebook width band (around `1200px` to `1280px`), not a large external monitor.
The layout must remain readable at browser 100% zoom without relying on users to zoom out.

## Core Rule

Always use this structural split on desktop:

- left column: `header + map`
- right column: `chat rail` (independent, top-to-bottom)

Do not place the header across the full width above both columns.
The right rail must remain an independent vertical surface.

## Mandatory Layout Constraints

1. Keep viewport-fixed app height and avoid page-level scrolling in desktop mode.
2. Build the main area as a two-column grid from `lg` and up.
3. Keep the right rail as `h-full + min-h-0 + flex-col`.
4. Keep chat log as the only scrolling region inside the right rail.
5. Keep input area fixed at the bottom of the right rail.
6. Keep map as the dominant visual surface in the left column.
7. In company-PC width band, reduce or hide heavy header blocks before shrinking the chat rail.

## Breakpoint Intent

- `< 768px`: mobile/narrow flow (handled separately)
- `>= 768px`: tablet/medium
- `>= 1024px (lg)`: enforce two-column split
- `1200px - 1280px`: company-PC priority band
- `>= 1280px (xl)`: optional refinement only, not a separate layout concept

Important:

- The company-PC band is the primary desktop target.
- Do not optimize first for large-monitor density and then compress down.

## Anti-Patterns (Prohibited)

- Full-width global header that pushes chat downward.
- Three equal vertical columns.
- Map squeezed into a narrow side column.
- Multiple nested scroll containers in the right rail.
- Keeping decorative cards that reduce usable map/chat area in the company-PC band.

## Reusable Implementation Skeleton

Use this structural template for future PoCs:

```text
App (h-[100dvh], overflow-hidden)
└─ Container (h-full, flex-col, min-h-0)
   └─ Main grid (min-h-0, lg:2 columns)
      ├─ Left column (min-h-0, flex-col)
      │  ├─ Header (lightweight; hide or compress for company-PC band)
      │  └─ Map region (flex-1, min-h-0)
      └─ Right rail (h-full, min-h-0, flex-col)
         ├─ Field/selection summary (shrink-0)
         ├─ Chat list (flex-1, min-h-0, overflow-y-auto)
         └─ Chat input (shrink-0)
```

## Adoption Rule For Agri-GIS

When updating `web/src/App.jsx`, keep this document as the baseline.
If a design change conflicts with these principles, update this document first and explain why.

