Feature: Register four source-backed OpenRouter text models

- **Type:** Feature
- **Spec modified:** Lifecycle status only; requirements and source snapshot preserved.
- **Code modified:** Read the [catalog](../../../src/data/models.ts), [implementation mapping](implementation.md) and [validation observations](implementation.md#validation-observations) for exact source, tests and synchronized README/skill/model-reference changes.
- **AC impacted:** AC-001 through AC-008; actual reviewed runner capture certifies all eight criteria.
- **Author:** codex
- **Validation:** Bun264pass/0fail/1056assertions, explicit affected-test types and Biome pass; Python0108pass and adjacent0098pass/1scope-skip. Native acceptance capture is valid8/8 with no gaps; read the durable [validation observations](implementation.md#validation-observations). Registry status is written by native finalization after this entry.
