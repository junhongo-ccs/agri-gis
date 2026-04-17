# Region Scope Recommendation For The Agri-GIS PoC

## Recommendation

The first proof of concept should focus on:

- one demo region
- 3 to 5 sample fields inside that region
- clearly different field characteristics that can be explained with the same indicator set

Recommended first region:

- one compact farming or demonstration area where the sample fields can be edited and verified easily

## Why A Compact Demo Region Is A Good First Target

A compact demo region is a strong first target for this PoC because it gives us:

- stable QGIS geometry
- easy comparison across a small number of fields
- simpler field attribute maintenance
- clear demo output for Dify
- easier debugging without mixing very different farm structures

This makes it easier to validate whether the QGIS exports and Dify explanations are actually useful.

## Why Not Start Broader

A broader geography such as many farms across a wide region would make the first PoC harder to evaluate because:

- field boundaries would become less consistent
- soil and management patterns would vary more by locality
- text metadata coverage would be uneven
- the same indicator might mean different things in different farming contexts
- prompt behavior would be harder to debug

For the first slice, we want to test grounding quality, not maximize geographic coverage.

## Selection Criteria For The First Fields

The first set of fields should:

- all belong to the same demo context
- be recognizable as distinct management units
- differ clearly in crop, soil, or recency characteristics
- have enough source data to support QGIS export
- avoid being near-duplicates of one another

## Recommended Starter Set

Recommended first 3 candidates:

- `Field A`
- `Field B`
- `Field C`

Why this smaller set works:

- it already gives baseline, comparison, and context-sensitive contrast
- the fields are easy to explain in a business demo
- geometry and attribute extraction should be easy to validate

If we want a slightly richer but still manageable first demo, use 4 or 5 fields only if they are still part of the same compact demo area.

## Suggested Evaluation Questions For These Fields

- Can the model explain why one field differs from another using indicators rather than generic agricultural knowledge?
- Can the model distinguish fields without making unsupported claims about yield or safety?
- Can the model identify a field that needs follow-up without overstating what the data proves?
- Can every output sentence be traced back to area, crop, soil, recency, or notes evidence?

## Proposed Decision

For the first PoC, lock the scope to:

- one compact demo region
- 3 initial sample fields
- one or two expansion candidates if data quality is sufficient

## Next Steps

After this scope is accepted, the next concrete tasks should be:

1. define exact polygons or parcel boundaries for the sample fields
2. prepare the agricultural attribute mapping CSV
3. run the first QGIS extraction for the starter fields
4. export trial summary JSON for Dify
