# QGIS Dify Tourism PoC Constitution

## Core Principles

### I. Grounded Outputs First
Every user-facing answer must be grounded in explicit spatial or textual indicators derived from approved source data. The system must not present unsupported impressions, safety claims, popularity claims, or forecasts as facts.

### II. QGIS Computes, LLM Interprets
QGIS is the source of truth for data integration, spatial processing, and feature generation. The LLM layer must operate on structured summaries and evidence fields rather than on vague freeform prompts or untraceable intuition.

### III. Explainability Over Cleverness
Each answer must include the indicators or observations that support it. Short, interpretable explanations are preferred over creative but weakly grounded prose.

### IV. Public Data and Reproducibility
The baseline PoC must rely on free public datasets and reproducible processing steps. Data sources, transformations, and assumptions must be documented well enough for another contributor to rerun the analysis.

### V. Incremental Validation
Features must be developed as independently testable slices, beginning with a small number of sample areas. Expansion to more areas or richer text sources happens only after grounding quality and answer usefulness are demonstrated.

## Data and Quality Constraints

- Approved baseline sources are free public datasets such as OpenStreetMap, administrative boundaries, transport nodes, public tourism CSVs, and Wikimedia-related metadata.
- Any derived label such as "calm", "historic", or "walkable" must be tied to observable indicators or keyword evidence.
- Raw user-facing outputs must clearly distinguish interpretation from objective measurement.
- The PoC should favor low-cost, maintainable components and avoid proprietary data dependencies in the initial version.

## Development Workflow

- Use `/speckit.specify` to define the user value in technology-agnostic terms.
- Use `/speckit.clarify` before planning if ranking logic, area units, or evaluation criteria remain ambiguous.
- Use `/speckit.plan` to lock in the QGIS processing flow, Dify orchestration, evidence schema, and evaluation approach.
- Use `/speckit.tasks` only after the plan identifies concrete artifacts, sample areas, and measurable success checks.
- Review all specs for grounding, reproducibility, and clear source-to-answer traceability before implementation.

## Governance

This constitution takes precedence over convenience, novelty, and ungrounded model behavior. Any exception must document why it is needed, what simpler grounded alternative was rejected, and how the resulting risk will be contained. All specifications, plans, and reviews must verify compliance with these principles.

**Version**: 1.0.0 | **Ratified**: 2026-04-13 | **Last Amended**: 2026-04-13
