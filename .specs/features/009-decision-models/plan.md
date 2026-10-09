---
title: Generic Decision Models — Technical Plan
status: Approved
scope: M
feature_number: "009"
spec_ref: spec.md
created: 2026-10-07
updated: 2026-10-07
---
# Generic Decision Models — Technical Plan

## Summary

Add Luna registration and a small explicit model/capability resolver to the existing Decisions command, preserving Jev defaults, complete native JSON and bounded transport.

- **Feature:** 009-decision-models · **Branch:** main · **Status:** Planned · **Size:** M (6 FR, 8 AC; five steps, one sequence diagram).
- **Read** [specification](spec.md), [current source snapshot](contracts/openrouter-decisions-source.json), [constitution](../../constitution.md), [stack](../../stacks/_default.md) and [testing strategy](../../testing/strategy.md).
- Stateless capability/request/response value objects; no persisted lifecycle, database tables, UI, migrations or new server endpoint. State/ER diagrams and Penflow are N/A.

## Technical Context

| Aspect | Choice | Reason |
|---|---|---|
| Language/runtime | Strict TypeScript / Bun | Existing stack; verified Bun 1.3.9 |
| CLI | Commander.js command factory | Preserve decide and jev alias, options and stdout contract |
| Transport | Existing OpenRouter alpha Decisions client | POST /api/alpha/decisions; configured API base preserved |
| Credentials | Existing getEnv → creds Keychain reference | No new credential, plaintext token or eager auth |
| Persistence | None for this feature | Model capabilities are static typed data |
| Tests | bun:test; mocked fetch/config; CLI subprocess fixtures | Existing strategy; no paid inference in deterministic tests |
| Static checks | TypeScript 6.0.2 / Biome 2.4.11 | Installed tools verified; stack tooling paragraph predates Biome |
| Dependencies/platform | No new package; existing macOS CLI | Constitution local-first constraint |

## Constitution Check

| Principle | Result and planned application |
|---|---|
| Zero server/local first | PASS — reuse one HTTP request, no daemon or mandatory new cloud service |
| Keychain only | PASS — existing credential resolver; input/category/bounds fail before configuration access |
| Single entry point | PASS — retain createDecideCommand and createAskCommand, no new command |
| Fail fast | PASS — typed AppError 2, ConfigError 3, NetworkError 4 and safe hints; no retries/substitute model |
| Simplicity | PASS — one small additive capability module, existing validators/transport; no router framework |
| Explicit effects/boundaries | PASS — pure resolution/limits, existing service I/O and command orchestration |
| Testing and naming | PASS — Bun fixtures, kebab-case files, public types/JSDoc and brief @spec anchors |
| Living docs | PASS — README, cc-hub skill/reference and later FR/AC mapping updated |

Local constitution and existing project patterns override generic Node/Vitest/class-service examples. Use typed small pure functions, no any, no input mutation, no raw request/response/secret logging; retain existing architecture instead of an unrelated refactor.

## Infrastructure Setup

| Resource | Provisioning/configuration | Verification |
|---|---|---|
| Existing Decisions HTTP endpoint | Reuse existing base-URL handling; no provisioning or new endpoint | Mock records exact alpha path, method, headers, body and AbortSignal |
| Existing Keychain key | Reuse existing configured creds reference; inference alone needs the key | Config spy is untouched for invalid/dry-run; missing key retains safe code 3 |

No external installation, secret rotation or new credential lookup is needed for planning/tests. Existing optional provider routing, including allow_fallbacks, remains user-supplied JSON; cc-hub itself never retries or substitutes a model.

## API Interactions

```gherkin
Feature: Generic Decisions transport
 Scenario: Effective model and complete native envelope
  Given valid Luna input with image references in structured JSON state
  And choice score and noul questions and routing metadata and nested extensions
  When an explicit model alias overrides the body model
  Then the effective model is openai/gpt-6-luna-decisions
  And one bounded Decisions POST retains every other supplied field
  And the matching response retains decimal answers and optional and extension fields
 Scenario: Dry run or invalid request
  Given dry-run or a wrong-category model or Luna with 201 questions
  When decide resolves and validates the input
  Then no credential lookup or HTTP occurs
  And dry-run emits the complete effective request or invalid input fails with code 2
 Scenario: Safe provider failure
  Given a valid request with a timeout or provider rejection or invalid response
  When decide runs
  Then safe stderr uses exit class 4 without success JSON
  And no retry or client model substitution occurs
```

```mermaid
sequenceDiagram
 participant User
 participant CLI as decide or jev
 participant Resolver as Input and model resolver
 participant Validator as Core and capability validator
 participant Config as Existing Keychain configuration
 participant API as OpenRouter Decisions
 User->>CLI: Native JSON or existing source flags
 CLI->>Resolver: Explicit flag, body model, pinned default
 Resolver->>Resolver: Normalize known aliases, retain unknown native ID
 Resolver->>Validator: Complete effective envelope
 alt Invalid core, category or applicable limit
  Validator-->>CLI: AppError 2
  CLI-->>User: Safe actionable stderr
 else Valid dry-run
  Validator-->>CLI: Complete effective request
  CLI-->>User: JSON stdout or exact output file
 else Valid inference
  Validator-->>CLI: Complete validated request
  CLI->>Config: Resolve existing configuration lazily
  alt Missing or invalid configuration
   Config-->>CLI: ConfigError 3
   CLI-->>User: Safe configuration hint
  else Configured
   CLI->>API: One POST /api/alpha/decisions with timeout
   alt HTTP, timeout or malformed result
    API-->>CLI: Transport failure
    CLI-->>User: Safe NetworkError 4; no retry
   else Matching core response
    API-->>Validator: Complete raw JSON
    Validator-->>CLI: Same validated envelope
    CLI-->>User: Full JSON or complete answers projection
   end
  end
 end
```

## Implementation Plan

### Step 1 — Register and resolve model capabilities

Technical prerequisite (2026-10-08): the HEAD inline catalog already exceeds the 500-line convention gate. Extract its unchanged image/video/audio block into `src/data/generation-models.ts`, spreading it at the same position. Preserve every existing model, provider ID and order; verify full catalog equality against the independently hashed104-object fixture from baseline4bb200fb7c2f9a8e1e929de0e2cbcab6c9151f0c after removing only the newly registered Luna model. A dependency-free `src/data/model-types.ts` supplies catalog contracts; `models.ts` re-exports the same public types to preserve callers while avoiding type-only catalog cycles. This bounded extraction does not import the unrelated shared text/media/music refactor.

**FR covered:** FR-001.1: Register Luna and metadata, FR-002.1: Resolve model selectors, FR-004.1: Define identity-specific bounds

- **New:** `src/data/decision-models.ts` — typed decision catalog/capability data: canonical ID, aliases, OpenRouter ID and optional known bounds. Keep module independent of catalog imports to avoid cycles. Reuse existing Model typing with type-only imports when required.
- **Modified:** `src/data/models.ts` — minimal additive composition/reference for Luna; preserve pinned Jev/latest entries and non-decision order. Add optional alias metadata only if needed for uniform lookup.
- **Modified:** `src/services/models.ts` — findModel/findByProviderName or small explicit selector resolver recognize Luna alias; catalog filtering returns decision models and excludes them from text. Preserve unrelated reasoning/provider resolution behavior.
- **New or focused existing module:** pure decision-specific resolveDecisionModel/getDecisionCapabilities functions return native ID and known limits; no I/O or model selection policy. Empty/all-whitespace/surrounding-whitespace selectors fail code 2 before configuration/auth/network, without trimming, known wrong-category selectors fail with ask/decide hint; unknown nonempty canonical IDs pass unchanged.
- Jev pinned/latest identities inherit existing 255-choice/10-score bounds; Luna has maxQuestions 200 and no undocumented choice/score cap. Unknown models have no question/choice/score maximum. Shared required shapes and metadata/timeout bounds remain common. Document sources/date and historical Jev compatibility rationale beside constants.
- **Gate:** lookup/filter fixtures for canonical Luna, luna-decisions, pinned/latest Jev and wrong-category selectors; unknown native ID unchanged.

### Step 2 — Apply selection and validation before auth

**FR covered:** FR-002.2: Apply selector precedence, FR-003.1: Preserve native request JSON, FR-004.2: Validate relevant model limits, FR-005.1: Preserve pre-auth safety

- **Modified:** `src/services/decision-input.ts` — keep full input/file/stdin and state/questions resolution; after explicit overrides choose explicit model > body model > pinned default, normalize known alias and validate the complete request. Preserve body extensions and conflicting-stdin behavior.
- **Modified:** `src/services/decisions.ts` and validator location — direct service entry also resolves aliases and validates before transportConfig, so programmatic callers share command behavior. Copy only the effective envelope/model; never mutate caller input or trim an unknown canonical ID.
- The validator is currently extracted to untracked `src/services/decision-validation.ts`; apply a focused change there in the working tree, and carry the minimal equivalent validation change in tracked `src/services/decisions.ts` for isolated HEAD delivery if extraction remains unrelated. Do not make the extraction a dependency of 009.
- Pass known capability limits to choice/score validators after common shape validation; apply Luna question count including 1/200/201. Preserve structured instructions, null choice guidance, optional noul criteria, provider null fields and nested JSON validation.
- `src/data/decision-limits.ts` extraction likewise remains pre-existing: keep shared timeout/metadata constants separate from model-specific bounds, without requiring that unrelated file to be published.
- **Gate:** all explicit/body/default permutations, jev command override and alias, direct service normalization; Luna 11 score/256 choice accepted locally, unknown 201 questions/11 score/256 choice accepted locally; all Jev selector variants retain historical rejection. Acceptance is local validation evidence, not provider capability certification.

### Step 3 — Preserve output, transport and category guards

**FR covered:** FR-003.2: Preserve response and output, FR-005.2: Retain transport and failures

- **Modified:** `src/commands/decide.ts` — retain default JSON, pretty, answers-only, exact-file output, dry-run and error boundary. Description/help become generic; jev alias unchanged. Commander `exitOverride()` delegates parser exits to the entry boundary so piped help can finish.
- **Modified:** `bin/cc-hub.ts` — catch only CommanderError, preserve its exit code via process.exitCode, and let Bun drain queued output; unrelated exceptions propagate. This bounded AC-007 repair follows observed 512-byte help truncation on real binary and harness.
- **Tests:** Compare complete decide/jev pipe output with native helpInformation; preserve parser failure codes on both production binary and isolated harness. Harnesses mirror the production exit boundary, without mocking stdout.
- **Modified only if necessary:** `src/commands/ask.ts` — existing guard uses alias-aware lookup before chat call; Luna canonical/alias and all Jev registered IDs fail locally with decide hint. Registered text model IDs remain rejected by decide before config/network.
- **Retained:** `src/types/decisions.ts` and response validation — validate required answer names/types, finite score numbers (including 4, negative and decimals without rubric-derived bounds), probability/noul ranges and usage while returning raw complete object. Optional confidence/probabilities/legend/id/provider remain optional. Preserve provider-returned versioned model ID, decimal numbers, outer/usage/answer extensions. Change types only for a proven gap.
- Keep timeout/base URL, safe status hints, no automatic retry, no client fallback, single POST and existing exit classes unchanged. No token, state, session or provider-body logging.
- **Gate:** mock body deep equality and output round-trip across all primitives/modalities/extensions; wrong-category/config/HTTP/network/timeout/malformed/mismatched response fixtures assert no successful JSON and exact allowed I/O counts.

### Step 4 — Synchronize user and agent documentation

**FR covered:** FR-006.1: Update help and documentation

- **Modified:** `README.md`, `.agent-sync/skills/cc-hub/SKILL.md`, `.agent-sync/skills/cc-hub/references/models.md` and decide help — generic command, both model IDs, luna-decisions alias, explicit/body/default precedence, native input/output extensions, multimodal JSON forwarding, per-model limits, Decisions/chat distinction and copyable dry-run examples.
- Explain native passthrough without claiming chat supported_parameters apply to Decisions or every provider accepts unknown extensions. No image upload/conversion feature is added.
- Keep existing command reference and model reference synchronized with README; no new or moved skill is introduced, so the new/moved-skill optimization gate does not apply.
- **Gate:** installed/source CLI help and filtered catalog, examples executed offline with dry-run and parsed effective JSON; README/skill/reference consistent.

### Step 5 — Verify mapped acceptance and isolated delivery

**FR covered:** FR-001.2: Prove catalog compatibility, FR-002.3: Prove model precedence, FR-003.3: Prove native JSON contract, FR-004.3: Prove capability boundaries, FR-005.3: Prove safe failure paths, FR-006.2: Tests mappings and delivery evidence

- **Modified:** `tests/services/models.test.ts`, `tests/commands/models.test.ts`, `tests/services/decisions.test.ts`, `tests/commands/decide.test.ts`, `tests/commands/ask.test.ts`; **new if needed:** `tests/services/decision-models.test.ts`. Use per-test typed request factories and mock fetch/config only; real resolver/validation/serialization stay under test.
- Native execution certification uses `tests/acceptance/decision-models-acceptance.py` to run actual CLI/Bun with only provider/config ports replaced; an independently hashed104-object fixture in `tests/fixtures/decision-catalog-baseline.json` supplies the portable catalog oracle. Generated caches/runtime receipts remain local; `.gitignore` preserves canonical spec/plan/progress/implementation/checks/changelog.
- Add FR/AC @spec anchors to changed source/test responsibilities and create 009 implementation.md plus progress checkpoints only during implementation. Preserve historical 008 artifacts/provenance.
- Before code, require current spec/plan independent receipts and `livespec validate .specs/features/009-decision-models --progression implement --model gpt-6` READY.
- Run focused suite, full existing regression suite, TypeScript and Biome. Record exact commands/exits and AC mappings under 009 logs/evidence. No UI tests.
- Parent selectively stages only required hunks/new capability module; preserve pre-existing CI, 008, catalog split, validation extraction and other unrelated work. The delivery must work against HEAD without publishing unrelated reorganization: validate the staged/committed tree in an isolated checkout, carrying minimal model/validation changes in existing tracked files when needed. Do not reset/stash unrelated work.
- Parent owns explicitly authorized commit/push main and verifies pushed commit identity and diff. Separate local/mock proof from an optional live inference's exact model/timing; no remote success inferred from tests.

## Resolved Test Commands

Availability was verified during plan preparation; implementation tests have not run yet.

| Action | Command | Tool | Status |
|---|---|---|---|
| Unit/focused | `bun test tests/services/models.test.ts tests/services/decisions.test.ts tests/commands/models.test.ts tests/commands/decide.test.ts tests/commands/ask.test.ts` | bun:test | Verified runner and existing file paths |
| Capability module | `bun test tests/services/decision-models.test.ts` | bun:test | Runner verified; create file if module split used |
| Mock HTTP integration | `bun test tests/services/decisions.test.ts` | bun:test injected fetch | Verified runner/path |
| CLI contracts | `bun test tests/commands/decide.test.ts tests/commands/ask.test.ts tests/commands/models.test.ts` | bun:test subprocess mocks | Verified runner/paths |
| E2E/live inference | Optional existing CLI request | OpenRouter | Not required; no live inference observed |
| Visual tests | N/A | N/A | Pure CLI |
| Type check | `bunx --no-install tsc --noEmit` | TypeScript 6.0.2 | Verified installed binary |
| Lint/format/pre-commit | `bunx --no-install biome check .` | Biome 2.4.11 | Local frozen dependency; governed generated .specs metadata excluded, all app/config checked |
| Native acceptance witness | `python3 -m pytest tests/acceptance/decision-models-acceptance.py -q` | Installed Python/pytest assertion capture | Local Bun and installedCLI prerequisites explicit; no remote inference |
| Full suite | `bun test` | bun:test | Verified installed binary |

## Testing Strategy

| Level / concrete file | Gherkin-derived assertions | FR / AC |
|---|---|---|
| Unit: tests/services/models.test.ts; tests/commands/models.test.ts | Luna ID/alias/provider filtering, Jev pinned/latest unchanged, text exclusion, other catalogs unaffected | FR-001, FR-002 / AC-001, AC-002 |
| Unit: tests/services/decision-models.test.ts or tests/services/decisions.test.ts | Empty and wrong-category selectors; explicit/body/default/direct-service resolution; unknown canonical passthrough | FR-002, FR-004 / AC-002, AC-005 |
| Unit + CLI: tests/services/decisions.test.ts; tests/commands/decide.test.ts | Luna 1/200 passes, 201 code 2 before auth; Jev 255/256 choices and 10/11 scores; Luna 11-score/256-choice passes; unknown 201-question/11-score/256-choice passes; common malformed shapes still fail | FR-004, FR-005 / AC-005, AC-006 |
| Mock HTTP: tests/services/decisions.test.ts | Text/object/array state and native image references, three primitives, structured/null guidance, routing/trace/session/user/extensions unchanged in captured POST; matching optional/decimal/extension response raw equality | FR-003, FR-005 / AC-003, AC-004, AC-006 |
| CLI: tests/commands/decide.test.ts | Inline/file/stdin and collisions, jev override, full/pretty/answers-only/file output parsed equality; dry-run zero credential/network; invalid output path safe error | FR-002, FR-003, FR-005 / AC-002, AC-003, AC-004, AC-006 |
| CLI + boundary: tests/commands/ask.test.ts; tests/services/decisions.test.ts | Canonical/alias wrong-endpoint guards; missing key 3; HTTP/malformed/mismatched/network/timeout 4; no retry/fallback/success JSON or payload leakage | FR-005 / AC-004, AC-006 |
| Documentary + CLI: tests/commands/decide.test.ts; tests/commands/models.test.ts | Help/catalog wording and offline README/skill examples; source reference consistency | FR-006 / AC-007 |
| Full regression/static + parent delivery diff | Focused coverage AC-001–AC-007, bun test, tsc, Biome exits 0; mapped proof and isolated committed-tree verification exclude unrelated work | FR-006 / AC-008 |

## Quality Engineering Gates

| Priority / risk | Gate and expected proof | Current gap |
|---|---|---|
| P0 Contract/correctness | Current independent spec/plan receipts; precedence/capability unit fixtures and FR/AC mapping | Implementation not yet executed |
| P0 Lossy transport/output | Mock POST deep equality and parsed full/answers/file JSON equality, including images and nested extensions/decimals | Native forwarding is not provider acceptance proof |
| P0 Regression | Jev alias/pinned/latest bounds and default; Luna 200/201, 11-score/256-choice; unknown 201/11/256 | No source-backed unknown/Luna choice or score maximum |
| P0 Security/operability | Auth/fetch spies zero for invalid/dry-run; one request and timeout; safe stderr/payload redaction fixtures | No security audit claimed |
| P1 Documentation | Installed/source help/catalog and dry-run example transcripts | Docs update occurs during implementation |
| P1 Delivery isolation | Full suite/static exits and exact staged/committed diff verified against HEAD in isolated checkout | Parent publishing pending; unrelated working-tree changes exist |

QE defines gates; independent plan reviewers examine complete sources. Later spec-test owns executed evidence and acceptance classification. No visual certification, performance SLA, real Keychain test, remote inference guarantee or database audit is introduced.

## Risks & Considerations

- OpenRouter alpha schema/model metadata can change: read current 009 source snapshot; retain source date and make unknown limits optional, not copied from Jev.
- Alias resolution must happen in both CLI and programmatic service paths before model-bound validation; preserve returned provider model IDs.
- Extensions remain JSON-safe and finite; preserving them does not invent provider support. Known core invalidity still fails before paid requests.
- Catalog/validation split is pre-existing uncommitted work. 009 uses additive module/minimal hunks and isolated final tree verification rather than publishing that split.
- No new OpenAPI endpoint is introduced; existing alpha endpoint schemas are already captured in contracts/openrouter-decisions-source.json, so no redundant generated openapi.yaml is needed.

## Next Action

Run `$spec-implement 009-decision-models --auto` (Claude: `/spec-implement 009-decision-models --auto`) after current plan review and Analyze/progression gates are ready. Parent owns pipeline transitions and final commit/push.

### Portable regression and one-time scope

Read [catalogue oracle](../../../tests/fixtures/decision-catalog-baseline.json): project the current catalogue onto its104 historical IDs and compare every object and its relative order, allowing later feature additions. Luna uniqueness/category remains AC001. Read [acceptance witness](../../../tests/acceptance/decision-models-acceptance.py): the Git scope snapshot is explicitly activated by `CC_HUB_009_VERIFY_DELIVERY_SCOPE=1` for this isolated009 delivery and mapped to AC008. Ordinary later regression runs skip this one-time scope observation; they do not claim a new scope certification. Native009 capture and Test before010 must enable the flag.

## Final control-audit clarifications

- FR-002/FR-004/FR-005: Reject padded aliases, padded registered native IDs, padded text IDs and padded future IDs before any configuration or HTTP access; do not normalize surrounding whitespace silently.
- FR-003/FR-004: The source snapshot has `DecisionsScoreAnswer.score` type number/format double with no minimum/maximum. Preserve every finite score for all decision models; reject nonnumeric/nonfinite scores, retain optional-field and probability/noul validation. Existing Feature 008 spec requires raw numeric precision but never specifies a score range. Finite-only validation enforces the native number shape; mocked values outside the rubric do not establish provider semantics or live availability.
- AC-008 scope snapshot: enumerate the independently fixed 38 public app/config/canonical paths exactly. Generated paths are allowed only through Git ignore rules. Preserve only the two known pre-existing rule files by their exact historical runner SHA256 values; any other tracked change or visible untracked path outside the manifest fails. This remains opt-in before Feature 010.
- The allocator sentinel is excluded only by its exact Feature 009 `.reserved` path; no `.claude/rules` or canonical-feature blanket exemption. The absent `.specs/.finalize` directory is not presumed generated and requires no new ignore rule unless native runtime evidence establishes it.
