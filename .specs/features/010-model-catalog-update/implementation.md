# Implementation — Text Model Catalog Update

Four source-backed OpenRouter text records are additive. Provider lookup, ask request building, effort mapping, defaults and command APIs reuse unchanged implementations. Read the [approved spec](spec.md) and [plan](plan.md) for the bounded contract.

| Requirement | Source / proof | Actual traceability anchor | Status | Updated |
|---|---|---|---|---|
| Read [FR-001](spec.md#fr-001) | Read [catalog](../../../src/data/models.ts) and [discovery tests](../../../tests/commands/models.test.ts) | `FR-001: Register exact text model`; `FR-001: Discover four exact text models` | Implemented | 2026-10-08 |
| Read [FR-002](spec.md#fr-002) | Read [provider tests](../../../tests/services/models.test.ts), [ask tests](../../../tests/commands/ask.test.ts) and [HTTP tests](../../../tests/services/openrouter.test.ts) | `FR-002: Verify provider-only resolution`; `FR-002: Preserve actual HTTP request contract` | Implemented | 2026-10-08 |
| Read [FR-003](spec.md#fr-003) | Read [catalog](../../../src/data/models.ts), [effort tests](../../../tests/services/models.test.ts) and [HTTP tests](../../../tests/services/openrouter.test.ts) | `FR-003: Source-proven ordered efforts`; `FR-003: Omitted or exclude-true reasoning` | Implemented | 2026-10-08 |
| Read [FR-004](spec.md#fr-004) | Read [compatibility tests](../../../tests/services/models.test.ts) and [real default request witness](../../../tests/acceptance/model-catalog-update-acceptance.py) | `FR-004: Preserve prior catalog values`; `AC-006: Independently captured prior records/defaults/decision types` | Implemented | 2026-10-08 |
| Read [FR-005](spec.md#fr-005) | Read [README](../../../README.md), [canonical skill](../../../.agent-sync/skills/cc-hub/SKILL.md) and [model reference](../../../.agent-sync/skills/cc-hub/references/models.md) | `FR-005: Document verified text models` | Implemented | 2026-10-08 |
| Read [FR-006](spec.md#fr-006) | Read [catalog tests](../../../tests/services/models.test.ts), [HTTP tests](../../../tests/services/openrouter.test.ts), [acceptance runner](../../../tests/acceptance/model-catalog-update-acceptance.py) and [HTTP boundary](../../../tests/acceptance/model-catalog-http-boundary.py) | `FR-006: Prove catalog regressions`; `FR-006: Deterministic HTTP fixture` | Implemented | 2026-10-08 |

All source anchors include the feature-qualified spec deep-link. Reused production functions receive no algorithm change; verification anchors document the resulting existing behavior.

| Acceptance criterion | Actual assertion owner | Anchor / test | Status |
|---|---|---|---|
| Read [AC-001](spec.md#ac-001) | Read [runner](../../../tests/acceptance/model-catalog-update-acceptance.py) | `AC-001` / `test_catalog` | Covered — independent Test passed 2026-10-09 |
| Read [AC-002](spec.md#ac-002) | Read [runner](../../../tests/acceptance/model-catalog-update-acceptance.py) | `AC-002` / `test_provider_filters` | Covered — independent Test passed 2026-10-09 |
| Read [AC-003](spec.md#ac-003) | Read [runner](../../../tests/acceptance/model-catalog-update-acceptance.py) | `AC-003` / `test_ask_messages` | Covered — independent Test passed 2026-10-09 |
| Read [AC-004](spec.md#ac-004) | Read [runner](../../../tests/acceptance/model-catalog-update-acceptance.py) | `AC-004` / `test_efforts` | Covered — independent Test passed 2026-10-09 |
| Read [AC-005](spec.md#ac-005) | Read [runner](../../../tests/acceptance/model-catalog-update-acceptance.py) | `AC-005` / `test_reasoning` | Covered — independent Test passed 2026-10-09 |
| Read [AC-006](spec.md#ac-006) | Read [runner](../../../tests/acceptance/model-catalog-update-acceptance.py) | `AC-006` / `test_compatibility` | Covered — independent Test passed 2026-10-09 |
| Read [AC-007](spec.md#ac-007) | Read [runner](../../../tests/acceptance/model-catalog-update-acceptance.py) | `AC-007` / `test_docs` | Covered — independent Test passed 2026-10-09 |
| Read [AC-008](spec.md#ac-008) | Read [runner](../../../tests/acceptance/model-catalog-update-acceptance.py) | `AC-008` / `test_regressions` | Covered — independent Test passed 2026-10-09 |

Independent Test on2026-10-09 covers all8criteria with zero generated tests; read the [test report](checks/2026-10-09-test.md) for actual suite counts and limits.

The reviewed mapping binds qualified AC IDs to exact assertion spans, their source SHA and runner-produced JUnit outcomes. Actual local capture observes eight passing runner cases and certifies all eight AC with no gaps. Read the durable [validation observations](#validation-observations) for commands, counts, input identities and evidence boundaries. Test names alone establish no certification.

## Validation observations

These are observed local results on the isolated candidate, not a promise of future checkout execution. Raw native receipts, prepared contexts, reviewer JSON, runner reports and the ignored execution log are retained locally and excluded from publication. Receipt IDs below identify those historical observations; current proof consumption independently revalidates input identities. The final native goal artifact records the exact receipt accepted at closure.

| Actual command / check | Observed result | Exit |
|---|---|---|
| `bun test` | 264 passed, 0 failed, 1056 assertions, 22 files | 0 |
| `bunx --no-install tsc --noEmit` | Project source/bin type check passes | 0 |
| `bunx --no-install tsc --ignoreConfig --noEmit --strict --skipLibCheck --target ESNext --module ESNext --moduleResolution bundler --allowImportingTsExtensions --types bun-types tests/services/models.test.ts tests/commands/models.test.ts tests/commands/ask.test.ts tests/services/openrouter.test.ts` | All four affected tests pass; legacy tests are not claimed type-checked | 0 |
| `bunx --no-install @biomejs/biome check src/data/models.ts tests/services/models.test.ts tests/commands/models.test.ts tests/commands/ask.test.ts tests/services/openrouter.test.ts tests/fixtures/model-catalog-baseline.json` | Six changed source/test/fixture files pass | 0 |
| `ruff check tests/acceptance/model-catalog-update-acceptance.py tests/acceptance/model-catalog-http-boundary.py` | Both files pass | 0 |
| `ruff format --check tests/acceptance/model-catalog-update-acceptance.py tests/acceptance/model-catalog-http-boundary.py` | Both files formatted under default88; runner422/max56, boundary127/max19 | 0 |
| `/opt/homebrew/opt/python@3.14/bin/python3.14 -m pytest tests/acceptance/model-catalog-update-acceptance.py -q` | Repaired full suite8 passed, 0 failed; native JUnit capture certifies all eight qualified AC with no gaps | 0 |
| `/opt/homebrew/opt/python@3.14/bin/python3.14 -m pytest tests/acceptance/decision-models-acceptance.py -q` | 8 passed, 1 delivery-scope skip; this does not certify the old isolated009 delivery snapshot | 0 |
| `livespec conventions verify --json --feature 010-model-catalog-update` | Historical Implement PASS with7 advisories; later independent Test PASS has6. The global009 hard60 violation was subsequently resolved by Audit48, without waiving hard500/60. | 0 |
| `livespec journey run --feature 010-model-catalog-update --json` | No applicable journeys; no journey coverage invented | 0 |

Read the [strict test invocation](../../../tests/acceptance/model-catalog-update-acceptance.py) for the exact deterministic HTTP assertions. Adjacent009 used the controlled candidate CLI on the outer PATH, with `CC_HUB_009_VERIFY_DELIVERY_SCOPE` unset. Native capture runs the pytest command through `livespec test --feature 010-model-catalog-update --acceptance-mapping <local-mapping> --execution-command '<pytest-command>' --report-adapter junit`.

- First full Python observation:7passed/1failed, caused by generated provider-witness syntax. Corrected witness preserves the same assertions; failure and genuine repaired8pass output remain local.
- First native observation `b0d903e7a1284d1aa638b7b9fe9e82f6`: runner8passed/exit0 but capture invalid, source snapshots empty because prospective rules-directory document links could not resolve. It certifies zero AC. Exact authorized link repair retains canonical rules examples and dry-run/force warnings.
- Native observations `4cb51e6144e24ec29e7949885960844e` and `a56a7599e3ac4e2e8f24dbf5aed21455`: valid8/8, gaps empty, eight passed cases. These observations precede this durable summary delta; closure requires a fresh current-input capture rather than relabelling historical receipts.
- Independent gpt-6 step review uses400000 characters; actual mapping review uses200000, 34inventoried sections, eight covered conclusions, confidence5, zero findings/ambiguities/extra scope. Virtual canonical mapping SHA `d215a7c774bdc8d5090bfc0b615847e3222865cb8d9a4916ea58e470033b9153`; physical formatted mapping SHA `039a9562d6907bb18bb7ce668aef8d3ed366bab1105f6f99321632b15815bb33`; context `79205f4959d597b0c365a287c7d8414b403cf87e95dbcc42b721d66da634f8da`. Failed citation-scope ingestion is preserved; independent corrected raw bundle ingests complete/ready with errors empty.
- Catalog source SHA `639dcc0b539b87a71a44af8ac7a95c8a2ad3a78ba617e0af7f215ec018888a91`; acceptance runner SHA `3b13fdb6e6e70b9e8849d2c7c31503ce1e2dd229dea4f940178833d5fbdda2b0`; HTTP boundary SHA `52550c88745114a38679b850a759200b7677e937e91aeed0d10b8cd0cd8ba1a3`. Read the [preserved source/oracle identities](#preservation). Default-bearing services remain unchanged.
- Deterministic mocked HTTP/configuration proves request behavior, without observing paid inference, personal configuration, authentication or token availability. Read-only audit findings and errors remain local; global009 hard60/root Ruff-gate remediation and publication belong to the parent.

## Preservation

Original pre-app105 raw SHA `5e9b1576248aba67ed135ad437a91e414cfb3c51feb2b7123257c6d0e2b0da2e`; formatted public105 SHA `19ef7f285fbe1f4ff026f8fa5653b0fe2390961b316a59f16d2a3d700945a96a`; complete parsed values/object-key/array order unchanged. Prior105 projection canonical SHA `00d3955ab961b03a398f68f4098b13d3cdee5c264332af155cbbeb5558bcc0cc`; resulting catalog109 excludes only the four additions for that comparison. Read the unchanged [104 oracle](../../../tests/fixtures/decision-catalog-baseline.json) with SHA `2a0a4581b7fffb5ff51112420011010973637952e4c428dae4d626ed4ec5fb9e` and [source snapshot](sources.json) with SHA `f95c3dc6fab7e1693e04ff1883738325b98df873789ced443919003398795edd`.

Jev pinned/latest and Luna retain decision types/routes. Controlled configuration proves ask uses the fixture's existing configured model when no override is supplied; no personal stored configuration or live credentials are observed.

## Files

Modified: read [catalog](../../../src/data/models.ts), [model service tests](../../../tests/services/models.test.ts), [models command tests](../../../tests/commands/models.test.ts), [ask tests](../../../tests/commands/ask.test.ts), [README](../../../README.md), [skill](../../../.agent-sync/skills/cc-hub/SKILL.md) and [model reference](../../../.agent-sync/skills/cc-hub/references/models.md).
Created: read [OpenRouter tests](../../../tests/services/openrouter.test.ts), [acceptance runner](../../../tests/acceptance/model-catalog-update-acceptance.py), [HTTP boundary](../../../tests/acceptance/model-catalog-http-boundary.py) and [105 baseline](../../../tests/fixtures/model-catalog-baseline.json). Feature progress, this mapping, execution log, changelog and deterministic finalization metadata record the native closure.

## Limits

Non-UI: no visual baseline, Penflow certification or build manifest applies. Metadata and deterministic mocks do not certify paid inference or authentication. Feature010 checks are scoped separately from parent-owned global009 hard60 remediation and root Ruff-gate maintenance before publication. Parent owns selective Git staging/publication; this child performs no Git mutation.
