# Region Scope Recommendation For The PoC

## Recommendation

The first proof of concept should focus on:

- one metropolitan region
- 3 to 5 tourism areas inside that region
- clearly different area characters that can be explained with the same indicator set

Recommended first region:

- Tokyo south-central area centered on Shinagawa and Minato

## Why Shinagawa And Minato Are A Good First Region

The Shinagawa and Minato area is a strong first target for this PoC because it gives us:

- dense OpenStreetMap coverage
- many tourism area types within one city
- strong differences in area character over short distances
- relatively consistent transport and POI data patterns
- easier comparison without mixing very different city structures
- direct relevance to internal demos if the company is based in Shinagawa

This makes it easier to validate whether the QGIS indicators and Dify explanations are actually useful.

## Why Not Start Broader

A broader geography such as all of Japan would make the first PoC harder to evaluate because:

- area boundaries would become less consistent
- OSM tagging patterns would vary more by locality
- text metadata coverage would be uneven
- the same indicator might mean different things in different urban forms
- prompt behavior would be harder to debug

For the first slice, we want to test grounding quality, not maximize geographic coverage.

## Selection Criteria For The First Areas

The first set of areas should:

- all belong to the same metro context
- be recognizable tourism areas
- differ clearly in tourism style
- have enough OSM POIs and transport context
- avoid being near-duplicates of one another

## Recommended Shinagawa-Minato Starter Set

Recommended first 5 candidates:

- `Shinagawa`
- `Oimachi`
- `Takanawa / Shirokane gateway side`
- `Hamamatsucho / Daimon`
- `Shiba Park / Tokyo Tower`
- `Odaiba`

## Why These Areas

### Shinagawa

Good candidate for:

- gateway and transport-oriented interpretation
- hotel, station access, and business-leisure mix
- comparison of transit convenience versus destination density

Expected character:

- highly accessible
- gateway-like
- mixed-purpose

### Oimachi

Good candidate for:

- redevelopment-influenced urban tourism and local activity mix
- strong rail accessibility with a more everyday city feel than Shinagawa
- food, shopping, and neighborhood-scale movement patterns

Expected character:

- convenient
- mixed local and visitor use
- evolving urban center

### Takanawa / Shirokane gateway side

Good candidate for:

- calmer premium urban walking pattern
- hotels, temples, museums, and residential edges
- contrast with the busier Shinagawa station core

Expected character:

- calmer
- more spacious
- mixed heritage and residential feel

### Hamamatsucho / Daimon

Good candidate for:

- strong transport access
- proximity to waterfront and airport access routes
- food and business-tourism mix

Expected character:

- practical
- connected
- urban transit hub

### Shiba Park / Tokyo Tower

Good candidate for:

- landmark-centered tourism
- park and heritage mix
- easier explanation of walking, open space, and iconic destination pull

Expected character:

- landmark-oriented
- open-space balanced
- first-visit friendly

### Odaiba

Good candidate for:

- waterfront and leisure-oriented tourism
- more spread-out spatial pattern
- family and attraction-oriented interpretation

Expected character:

- leisure-focused
- spacious
- destination-style

## Minimum Starter Set If We Want To Move Faster

If we want the fastest useful first validation, start with only 3 areas:

- `Shinagawa`
- `Oimachi`
- `Shiba Park / Tokyo Tower`

Why this smaller set works:

- it already gives gateway, redevelopment-mixed urban, and landmark-park contrasts
- the areas are highly recognizable in a business demo
- transport and POI data should be relatively easy to extract

If we want a slightly richer but still manageable first demo, use 4 areas:

- `Shinagawa`
- `Oimachi`
- `Shiba Park / Tokyo Tower`
- `Odaiba`

Why this 4-area set is strong:

- it adds a clearly different waterfront-leisure pattern
- it increases comparison value without expanding beyond the same broad business context
- it gives a more visually persuasive demo than using only station-area comparisons

## Suggested Evaluation Questions For These Areas

- Can the model explain why Shinagawa feels different from Oimachi using indicators rather than generic Tokyo knowledge?
- Can the model distinguish Oimachi from Shiba Park without making unsupported claims about prestige or popularity?
- Can the model identify a calmer walking-oriented area without overstating what the data proves?
- Can every output sentence be traced back to POI mix, accessibility, clustering, or keyword evidence?

## Proposed Decision

For the first PoC, lock the scope to:

- `Region`: Shinagawa and Minato centered Tokyo south-central area
- `Phase 1 areas`: Shinagawa, Oimachi, Shiba Park / Tokyo Tower, Odaiba
- `Phase 2 expansion candidates`: Takanawa / Shirokane gateway side, Hamamatsucho / Daimon

## Next Steps

After this scope is accepted, the next concrete tasks should be:

1. define exact polygons or administrative boundaries for the Phase 1 areas
2. prepare the OSM category lookup CSV
3. run the first QGIS extraction for the 3 starter areas
4. export trial summary JSON for Dify
