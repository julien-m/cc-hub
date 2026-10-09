# 009 implementation mapping

This mapping describes the isolated Feature 009 delivery. Historical tests imported the candidate source; installed CLI help was checked separately. No live inference or Git publication is claimed here. Read [the historical Test report](checks/2026-10-08-test.md) and [final audit repair decisions](checks/2026-10-08-final-audit.md) for results and evidence boundaries.

## FR mapping

| Requirement | Source and anchor | Status | Verified |
|---|---|---|---|
| Read [FR-001](spec.md#fr-001) | Read [src/data/decision-models.ts](../../../src/data/decision-models.ts); `@spec FR-001` | Implemented | 2026-10-08 |
| Read [FR-002](spec.md#fr-002) | Read [src/services/models.ts](../../../src/services/models.ts); `@spec FR-002` | Implemented | 2026-10-08 |
| Read [FR-003](spec.md#fr-003) | Read [src/services/decisions.ts](../../../src/services/decisions.ts); `@spec FR-003` | Implemented | 2026-10-08 |
| Read [FR-004](spec.md#fr-004) | Read [src/services/decisions.ts](../../../src/services/decisions.ts); `@spec FR-004` | Implemented | 2026-10-09 |
| Read [FR-005](spec.md#fr-005) | Read [src/services/decisions.ts](../../../src/services/decisions.ts); `@spec FR-005` | Implemented | 2026-10-08 |
| Read [FR-006](spec.md#fr-006) | Read [src/commands/decide.ts](../../../src/commands/decide.ts); `@spec FR-006` | Implemented | 2026-10-08 |

## AC mapping

| Requirement | Source and anchor | Status | Verified |
|---|---|---|---|
| Read [AC-001](spec.md#ac-001) | Read [test_catalog](../../../tests/acceptance/decision-models-acceptance.py); `@spec AC-001` | Covered — Test PASS; observed passing assertion | 2026-10-08 |
| Read [AC-002](spec.md#ac-002) | Read [test_selection](../../../tests/acceptance/decision-models-acceptance.py); `@spec AC-002` | Covered — Test PASS; observed passing assertion | 2026-10-08 |
| Read [AC-003](spec.md#ac-003) | Read [test_native_input](../../../tests/acceptance/decision-models-acceptance.py); `@spec AC-003` | Covered — Test PASS; observed passing assertion | 2026-10-08 |
| Read [AC-004](spec.md#ac-004) | Read [test_native_output](../../../tests/acceptance/decision-models-acceptance.py); `@spec AC-004` | Covered — Test PASS; observed passing assertion | 2026-10-08 |
| Read [AC-005](spec.md#ac-005) | Read [test_limits](../../../tests/acceptance/decision-models-acceptance.py); `@spec AC-005` | Current filtered native PASS — 4 grounded bindings,25 observed assertions | 2026-10-09 |
| Read [AC-006](spec.md#ac-006) | Read [test_safe_failures](../../../tests/acceptance/decision-models-acceptance.py); `@spec AC-006` | Covered — Test PASS; observed passing assertion | 2026-10-08 |
| Read [AC-007](spec.md#ac-007) | Read [test_help_docs](../../../tests/acceptance/decision-models-acceptance.py); `@spec AC-007` | Historical PASS; pipe-help repair locally verified; fresh capture pending | 2026-10-08 |
| Read [AC-008](spec.md#ac-008) | Read [test_regression_and_isolation / test_delivery_scope_snapshot](../../../tests/acceptance/decision-models-acceptance.py); `@spec AC-008` | Covered — Test PASS; observed passing assertion | 2026-10-08 |

Read [the historical Test report](checks/2026-10-08-test.md) for 31 reviewed assertion bindings, native receipt `ee87eb7230834736869c4a3d0b5ec58f`, 9 passing tests, 99 observed assertions and all 8 certified ACs with no gaps. Bun: 247 passing tests; TypeScript, Ruff and Biome: exit 0. The immutable documentary contracts requested 400000 review characters; the separate runtime mapping schema permits at most 200000. Those parameters are recorded distinctly.

These executions preceded the final audit documentation/configuration repair. Their raw receipts, mapping, reviews and logs are retained locally as historical evidence; they do not certify later document or gate bytes. A new source-bound capture follows the parent's control audit.

Read [progress](progress.md). This is a nonvisual CLI feature: no Screens or Behavioral AC, no Penflow contract or visual baseline, and no paid API request.

## Files

| Source / test / documentation | Verified |
|---|---|
| Read [src/data/models.ts](../../../src/data/models.ts) | 2026-10-08 |
| Read [src/services/models.ts](../../../src/services/models.ts) | 2026-10-08 |
| Read [src/services/decision-input.ts](../../../src/services/decision-input.ts) | 2026-10-08 |
| Read [src/services/decisions.ts](../../../src/services/decisions.ts) | 2026-10-08 |
| Read [src/commands/decide.ts](../../../src/commands/decide.ts) | 2026-10-08 |
| Read [src/commands/ask.ts](../../../src/commands/ask.ts) | 2026-10-08 |
| Read [tests/services/models.test.ts](../../../tests/services/models.test.ts) | 2026-10-08 |
| Read [tests/services/decisions.test.ts](../../../tests/services/decisions.test.ts) | 2026-10-08 |
| Read [tests/commands/models.test.ts](../../../tests/commands/models.test.ts) | 2026-10-08 |
| Read [tests/commands/decide.test.ts](../../../tests/commands/decide.test.ts) | 2026-10-08 |
| Read [tests/commands/ask.test.ts](../../../tests/commands/ask.test.ts) | 2026-10-08 |
| Read [README.md](../../../README.md) | 2026-10-08 |
| Read [.agent-sync/skills/cc-hub/SKILL.md](../../../.agent-sync/skills/cc-hub/SKILL.md) | 2026-10-08 |
| Read [.agent-sync/skills/cc-hub/references/models.md](../../../.agent-sync/skills/cc-hub/references/models.md) | 2026-10-08 |
| Read [tests/fixtures/decision-catalog-baseline.json](../../../tests/fixtures/decision-catalog-baseline.json) | 2026-10-08 |
| Read [tests/fixtures/decision-catalog-baseline.md](../../../tests/fixtures/decision-catalog-baseline.md) | 2026-10-08 |
| Read [.gitignore](../../../.gitignore) | 2026-10-08 |
| Read [src/data/model-types.ts](../../../src/data/model-types.ts) | 2026-10-08 |
| Read [biome.json](../../../biome.json) | 2026-10-08 |
| Read [src/data/generation-models.ts](../../../src/data/generation-models.ts) | 2026-10-08 |
| Read [src/data/decision-models.ts](../../../src/data/decision-models.ts) | 2026-10-08 |
| Read [tests/services/decision-models.test.ts](../../../tests/services/decision-models.test.ts) | 2026-10-08 |
| Read [tests/acceptance/decision-models-acceptance.py](../../../tests/acceptance/decision-models-acceptance.py) | 2026-10-08 |
| Read [tests/acceptance/decision-models-boundary.py](../../../tests/acceptance/decision-models-boundary.py) | 2026-10-09 |

Read [final audit decisions](checks/2026-10-08-final-audit.md) for the durable adjudication. Both earlier implementation audits were preserved; confirmed corrections were applied and the parent accepted their adjudication with no unresolved blocker. The former hard validator-size violation was resolved by the later Audit48 extraction (request31/helper50); advisory400/30 findings remain explicit.

Scope certification requires `CC_HUB_009_VERIFY_DELIVERY_SCOPE=1` before Feature 010. Ordinary later regression runs visibly skip the scope snapshot and never claim new scope certification. The 104-ID oracle protects every historical object's fields and relative order while permitting later additions.

Read [the independent Test report](checks/2026-10-08-test.md): Test goal `2c476516` completed its native 53-task contract with scope enabled before Feature 010; generation 0, native 9/9 tests, 99 assertions, 8/8 AC and regression 247 PASS. These are historical observations, separate from post-audit certification and publication.

## Control-audit repair

Read [the control-audit adjudication](checks/2026-10-08-final-audit.md). Padded selectors now fail before lookup/auth/HTTP; score responses preserve all finite numbers without a question-rubric range. Scope now checks the exact 37 public paths and two preserved historical rule hashes, with an observed negative-file probe. Local full Bun 247 PASS and pytest opt-in 9 PASS follow these corrections. The newly reviewed runtime mapping has 32 current-source bindings; its future native capture is distinct from the historical 31-binding/99-assertion Test capture. Parent control audit and post-audit certification remain pending.

## AC-007 pipe-help repair

A later native capture failed AC-007: real binary, globally installed CLI and the environment-boundary harness each returned exit 0 with only 512 bytes of piped help, omitting model guidance. The failed receipt `62a340e80bf64c3297fcea8cf4f4be71` remains historical evidence. Synchronous writes were rejected after observed partial output and EAGAIN on Bun's nonblocking pipe.

Read [the command factory](../../../src/commands/decide.ts) and [the production entry boundary](../../../bin/cc-hub.ts): Commander exitOverride raises CommanderError; the boundary preserves its exit code with process.exitCode, letting queued output drain. Unrelated exceptions propagate. Read [the pipe regression](../../../tests/commands/decide.test.ts): real binary and isolated harness output must exactly match native helpInformation for decide and jev; usage errors keep code 1 and stderr, existing action failures keep codes 2/3/4. The acceptance harness mirrors this entry boundary without substituting stdout.

Local checks after the repair: Bun 249 PASS, focused command tests 17 PASS, TypeScript/Biome/Ruff exit 0, opt-in pytest 9 PASS. Installed-help acceptance uses a local cc-hub symlink to the candidate bin through an explicit PATH; the older global installation remains unchanged. Exact delivery scope now includes the independently approved entry-point path, for 38 paths. A fresh 32-binding mapping review follows the changed Python source. Parent read-only audit and fresh source-bound capture remain pending; local checks do not replace certification.

## Audit48 filtered FR-004 correction — 2026-10-09

Read [the current gap report](checks/2026-10-09.md) and [audit adjudication](checks/2026-10-08-final-audit.md). Read [the decision service](../../../src/services/decisions.ts): validateDecisionRequest now calls the pure validateDecisionQuestions helper, preserving validation order, exact messages, model-specific bounds and all extensions. Validator75→31 lines, helper50, source355, all TypeScript functions≤59.

Read [the acceptance runner](../../../tests/acceptance/decision-models-acceptance.py) and [its boundary fixtures](../../../tests/acceptance/decision-models-boundary.py): default Ruff formatting expanded the old runner beyond hard limits; cohesive original fixture/data extraction restored408/max56 and445/max53. All nine original test names and assertion ASTs, original boundary functions, historical scope literals and104-ID compatibility oracle are unchanged. No mirrored tests were generated.

Initial filtered capture d7cb4688f35a4e4389bb0e0e367cc86f preceded check/report metadata. Capture3da1a287852447e9970c4e88905c74ec followed that check; final SpecFix capture5cd09e33d32e4333821339bb08171600 followed the progress/finalizer writes. Each observed exactly AC-005, four independently grounded bindings, one passing test and25 assertions. These are historical observations after later parent metadata changes. Ordinary009 regression8PASS1scopeSKIP; full Bun264PASS/1056 assertions, focused93PASS/490, strict types/Biome/Ruff lint/defaultformatPASS. The final source-bound capture follows all metadata/finalizer writes. Other rows retain their historical evidence; this filtered correction does not re-certify all eight criteria or isolated009 delivery on the combined009/010 diff. Parent owns the full re-audit, fresh acceptance and publication.
