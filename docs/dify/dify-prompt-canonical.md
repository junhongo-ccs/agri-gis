# Dify Prompt Canonical (Split by Node)

This repository now manages prompt canonicals by workflow node.
Do not keep a single monolithic prompt as the source of truth.

## Canonical Files

- `LLM1` (primary analysis draft): [dify-prompt-llm1-canonical.md](./dify-prompt-llm1-canonical.md)
- `LLM2` (field-summary / interpretation route): [dify-prompt-llm2-canonical.md](./dify-prompt-llm2-canonical.md)
- `LLM3` (knowledge-search / pesticide route): [dify-prompt-llm3-canonical.md](./dify-prompt-llm3-canonical.md)

## Operational Rule

- Edit node-specific rules in the corresponding LLM file first.
- If shared policy changes, update all relevant LLM canonical files in the same commit.
- Keep `dify-prompt-draft.md` as a lightweight draft only, not as canonical source.
