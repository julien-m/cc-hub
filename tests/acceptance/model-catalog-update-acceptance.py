"""Observe real catalog/CLI/request boundaries with independent pre-addition oracles."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]

IDS = [
    "openai/gpt-6.1-sol",
    "anthropic/claude-sonnet-5.5",
    "anthropic/claude-opus-5.5",
    "xai/grok-4.6",
]
NATIVE_IDS = [*IDS[:3], "x-ai/grok-4.6"]
DOCS = [
    "README.md",
    ".agent-sync/skills/cc-hub/SKILL.md",
    ".agent-sync/skills/cc-hub/references/models.md",
]


MODIFIED_TESTS = [
    "tests/services/models.test.ts",
    "tests/commands/models.test.ts",
    "tests/commands/ask.test.ts",
    "tests/services/openrouter.test.ts",
]
STRICT_TEST_ARGS = [
    "--ignoreConfig",
    "--noEmit",
    "--strict",
    "--skipLibCheck",
    "--target",
    "ESNext",
    "--module",
    "ESNext",
    "--moduleResolution",
    "bundler",
    "--allowImportingTsExtensions",
    "--types",
    "bun-types",
]

# Kebab-case fixture filenames are mandated; load only this owned candidate module before exposing pytest fixtures.
fixture_spec = importlib.util.spec_from_file_location(
    "catalog_http_boundary", ROOT / "tests/acceptance/model-catalog-http-boundary.py"
)
assert fixture_spec is not None and fixture_spec.loader is not None
http_boundary = importlib.util.module_from_spec(fixture_spec)
fixture_spec.loader.exec_module(http_boundary)
Boundary = http_boundary.Boundary
BUN = http_boundary.BUN
boundary = http_boundary.boundary
invoke = http_boundary.invoke
run_process = http_boundary.run_process


def observe(script: str) -> object:
    """Load real pure catalog services in Bun, fail on runtime errors, and decode their output."""
    if BUN is None:
        pytest.fail("bun is required for model catalog acceptance")
    result = run_process([BUN, "-e", script])
    assert result.returncode == 0, result.stderr
    return json.loads(result.stdout)


# @spec AC-001: Four exact source-backed catalog entries — .specs/features/010-model-catalog-update/spec.md#ac-001
def test_catalog() -> None:
    """Verify unique complete records against the independently frozen source contract."""
    entries = observe(
        'const {MODELS}=await import("./src/data/models.ts");console.log(JSON.stringify(MODELS));'
    )
    expected = [
        {
            "id": model,
            "type": "text",
            "providers": {"openrouter": native},
            "reasoningEfforts": ["low", "medium", "high", "xhigh"]
            + ([] if model == IDS[-1] else ["max"]),
        }
        for model, native in zip(IDS, NATIVE_IDS)
    ]
    selected = [[entry for entry in entries if entry["id"] == model] for model in IDS]
    source = ROOT / ".specs/features/010-model-catalog-update/sources.json"
    assert (
        selected == [[entry] for entry in expected]
        and hashlib.sha256(source.read_bytes()).hexdigest()
        == "f95c3dc6fab7e1693e04ff1883738325b98df873789ced443919003398795edd"
    )


# @spec AC-002: Provider filter/resolution excludes unsupported mappings — .specs/features/010-model-catalog-update/spec.md#ac-002
def test_provider_filters() -> None:
    """Use real functions to assert positive filtering, helpful negative errors and raw pass-through."""
    script = (
        'const {listModels,resolveForProvider}=await import("./src/services/models.ts");const ids='
        + json.dumps(IDS)
        + ';console.log(JSON.stringify(ids.map(id=>({openrouter:listModels({type:"text",provider:"openrouter"}).filter(m=>m.id===id).length,native:resolveForProvider(id,"openrouter"),unsupported:["copilot","codex","poyo"].map(provider=>{let message="";try{resolveForProvider(id,provider)}catch(e){message=e.message}return {provider,present:listModels({provider}).some(m=>m.id===id),message}})}))));'
    )
    rows = observe(script)
    expected = [
        {
            "openrouter": 1,
            "native": native,
            "unsupported": [
                {
                    "provider": provider,
                    "present": False,
                    "message": f"{model} is not available on {provider}. Use 'cc-hub models list --provider {provider}' to see available models.",
                }
                for provider in ["copilot", "codex", "poyo"]
            ],
        }
        for model, native in zip(IDS, NATIVE_IDS)
    ]
    raw = observe(
        'const {resolveForProvider}=await import("./src/services/models.ts");console.log(JSON.stringify(resolveForProvider("x-ai/grok-4.6","openrouter")));'
    )
    assert rows == expected and raw == "x-ai/grok-4.6"


def expected_context_body(
    native: str, schema: dict[str, object], context: Path
) -> dict[str, object]:
    """Build the independent expected context/schema envelope with prompt-before-context ordering."""
    return {
        "model": native,
        "messages": [
            {
                "role": "system",
                "content": "Respond with valid JSON only. No markdown, no explanation, no code fences.",
            },
            {"role": "user", "content": "Summarize compiler context"},
            {
                "role": "user",
                "content": f'<file path="{os.path.relpath(context, ROOT)}">\nexport const answer = 42;\n</file>\n\n<stdin>\npiped compiler context\n</stdin>',
            },
        ],
        "response_format": {"type": "json_schema", "json_schema": schema},
        "reasoning": {"effort": "high", "exclude": True},
    }


# @spec AC-003: Actual ask native/context/schema and JSON HTTP shapes — .specs/features/010-model-catalog-update/spec.md#ac-003
def test_ask_messages(boundary: Boundary, tmp_path: Path) -> None:
    """Exercise every registered ID with real stdin/file paths and both structured-output modes."""
    server, _, _ = boundary
    context = tmp_path / "context.ts"
    context.write_text("export const answer = 42;")
    schema = {
        "name": "answer",
        "schema": {"type": "object", "properties": {"answer": {"type": "number"}}},
    }
    schema_file = tmp_path / "schema.json"
    schema_file.write_text(json.dumps(schema))
    observations = []
    for model, native in zip(IDS, NATIVE_IDS):
        for schema_input in [json.dumps(schema), str(schema_file)]:
            result = invoke(
                boundary,
                [
                    "Summarize compiler context",
                    "-m",
                    model,
                    "-f",
                    str(context),
                    "-s",
                    schema_input,
                    "-e",
                    "high",
                ],
                "piped compiler context",
            )
            path, body = server.requests[-1]
            expected = expected_context_body(native, schema, context)
            observations.append(
                result.returncode == 0
                and result.stdout == "fixture-output\n"
                and path == "/fixture/v1/chat/completions"
                and body == expected
            )
        result = invoke(boundary, ["-m", model, "-j"], "stdin prompt")
        path, body = server.requests[-1]
        observations.append(
            result.returncode == 0
            and body
            == {
                "model": native,
                "messages": [
                    {
                        "role": "system",
                        "content": "Respond with valid JSON only. No markdown, no explanation, no code fences.",
                    },
                    {"role": "user", "content": "stdin prompt"},
                ],
                "response_format": {"type": "json_object"},
            }
            and path == "/fixture/v1/chat/completions"
        )
    assert observations == [True] * 12 and len(server.requests) == 12


# @spec AC-004: Entire supported list and minimal/ultra bounds — .specs/features/010-model-catalog-update/spec.md#ac-004
def test_efforts() -> None:
    """Observe real mapper results for every supported effort and both global boundary efforts."""
    script = (
        'const {getReasoningEfforts,mapReasoningEffortForModel}=await import("./src/services/models.ts");const ids='
        + json.dumps(IDS)
        + ';console.log(JSON.stringify(ids.map(id=>({efforts:getReasoningEfforts(id),mapped:["minimal","low","medium","high","xhigh","max","ultra"].map(e=>mapReasoningEffortForModel(id,e))}))));'
    )
    observed = observe(script)
    expected = [
        {
            "efforts": ["low", "medium", "high", "xhigh"]
            + ([] if model == IDS[-1] else ["max"]),
            "mapped": [
                "low",
                "low",
                "medium",
                "high",
                "xhigh",
                "xhigh" if model == IDS[-1] else "max",
                "xhigh" if model == IDS[-1] else "max",
            ],
        }
        for model in IDS
    ]
    assert observed == expected


# @spec AC-005: Omitted/default and explicit exclude-true reasoning — .specs/features/010-model-catalog-update/spec.md#ac-005
def test_reasoning(boundary: Boundary) -> None:
    """Observe full real HTTP envelopes so omitted reasoning and absence of disable flags are explicit."""
    server, _, _ = boundary
    observed = []
    for model, native in zip(IDS, NATIVE_IDS):
        for effort in [None, "minimal", "high", "ultra"]:
            result = invoke(
                boundary,
                [
                    "Compiler question",
                    "-m",
                    model,
                    *([] if effort is None else ["-e", effort]),
                ],
                "",
            )
            expected_effort = (
                "low"
                if effort == "minimal"
                else ("xhigh" if model == IDS[-1] else "max")
                if effort == "ultra"
                else effort
            )
            expected = {
                "model": native,
                "messages": [{"role": "user", "content": "Compiler question"}],
                **(
                    {}
                    if effort is None
                    else {"reasoning": {"effort": expected_effort, "exclude": True}}
                ),
            }
            observed.append(
                result.returncode == 0 and server.requests[-1][1] == expected
            )
    assert observed == [True] * 16 and len(server.requests) == 16


# @spec AC-006: Independently captured prior records/defaults/decision types — .specs/features/010-model-catalog-update/spec.md#ac-006
def test_compatibility(boundary: Boundary) -> None:
    """Compare the full prior projection/order and default-bearing unchanged code to independent oracles."""
    captured = ROOT / "tests/fixtures/model-catalog-baseline.json"
    old = ROOT / "tests/fixtures/decision-catalog-baseline.json"
    baseline = json.loads(captured.read_text())
    models = observe(
        'const {MODELS}=await import("./src/data/models.ts");console.log(JSON.stringify(MODELS));'
    )
    prior = [model for model in models if model["id"] not in IDS]
    decisions = [model["id"] for model in models if model["type"] == "decision"]
    env_hash = hashlib.sha256((ROOT / "src/services/env.ts").read_bytes()).hexdigest()
    default_result = invoke(boundary, ["Default question"], "")
    default_expected = {
        "model": "openai/gpt-4.1",
        "messages": [{"role": "user", "content": "Default question"}],
    }
    default_preserved = (
        default_result.returncode == 0
        and default_result.stdout == "fixture-output\n"
        and boundary[0].requests == [("/fixture/v1/chat/completions", default_expected)]
    )
    assert (
        default_preserved
        and prior == baseline
        and json.dumps(prior, separators=(",", ":"), ensure_ascii=False)
        == json.dumps(baseline, separators=(",", ":"), ensure_ascii=False)
        and hashlib.sha256(
            json.dumps(prior, separators=(",", ":"), ensure_ascii=False).encode()
        ).hexdigest()
        == "00d3955ab961b03a398f68f4098b13d3cdee5c264332af155cbbeb5558bcc0cc"
        and len(baseline) == 105
        and len(models) == 109
        and hashlib.sha256(captured.read_bytes()).hexdigest()
        == "19ef7f285fbe1f4ff026f8fa5653b0fe2390961b316a59f16d2a3d700945a96a"
        and hashlib.sha256(old.read_bytes()).hexdigest()
        == "2a0a4581b7fffb5ff51112420011010973637952e4c428dae4d626ed4ec5fb9e"
        and decisions
        == ["typesafe/jev-1.13", "~typesafe/jev-latest", "openai/gpt-6-luna-decisions"]
        and env_hash
        == "27eaae131b290455a9d41627d8b72c94839e56b780f32cfab150903c3213e535"
    )


# @spec AC-007: Exact bounded shared model documentation — .specs/features/010-model-catalog-update/spec.md#ac-007
def test_docs() -> None:
    """Verify each governed docs block states exact IDs/provider/efforts and no additional CLI availability."""
    blocks = [
        (ROOT / name)
        .read_text()
        .split("<!-- model-catalog-010:start -->", 1)[1]
        .split("<!-- model-catalog-010:end -->", 1)[0]
        for name in DOCS
    ]
    expected_rows = [
        f"| `{model}` | `{native}` | "
        + (
            "low, medium, high, xhigh"
            if model == IDS[-1]
            else "low, medium, high, xhigh, max"
        )
        + " |"
        for model, native in zip(IDS, NATIVE_IDS)
    ]
    observations = [
        all(row in block for row in expected_rows)
        and all(
            text in block
            for text in [
                "OpenRouter",
                "provider default",
                "minimal → low",
                "ultra → max",
                "ultra → xhigh",
                "Copilot",
                "Codex",
                "Poyo",
                "prompt/stdin",
                "files",
                "JSON/schema",
                "effort",
                "exclude: true",
            ]
        )
        and not any(
            flag in block
            for flag in ["--temperature", "--top-p", "--max-tokens", "--seed"]
        )
        for block in blocks
    ]
    assert observations == [True, True, True]


# @spec AC-008: Bun/static regressions and controlled negative boundaries — .specs/features/010-model-catalog-update/spec.md#ac-008
def test_regressions(boundary: Boundary) -> None:
    """Execute real Gherkin-derived Bun/type checks, plus pre-HTTP provider/schema and HTTP-error paths."""
    if BUN is None:
        pytest.fail("bun is required for catalog regressions")
    commands = [
        [BUN, "test"],
        [BUN, "x", "--no-install", "tsc", "--noEmit"],
        [BUN, "x", "--no-install", "tsc", *STRICT_TEST_ARGS, *MODIFIED_TESTS],
        [
            BUN,
            "x",
            "--no-install",
            "@biomejs/biome",
            "check",
            "src/data/models.ts",
            *MODIFIED_TESTS,
        ],
        [
            "ruff",
            "check",
            "tests/acceptance/model-catalog-update-acceptance.py",
            "tests/acceptance/model-catalog-http-boundary.py",
        ],
        [
            "ruff",
            "format",
            "--check",
            "tests/acceptance/model-catalog-update-acceptance.py",
            "tests/acceptance/model-catalog-http-boundary.py",
        ],
    ]
    results = [run_process(command) for command in commands]
    server, _, _ = boundary
    negative = []
    for model in IDS:
        unsupported = invoke(boundary, ["Question", "-m", model, "-p", "poyo"], "")
        invalid = invoke(boundary, ["Question", "-m", model, "-s", "{invalid"], "")
        negative.append(
            unsupported.returncode == 4
            and "not available on poyo" in unsupported.stderr
            and invalid.returncode == 4
            and server.requests == []
        )
    server.status = 503
    failed = invoke(boundary, ["Question", "-m", IDS[0]], "")
    assert (
        all(result.returncode == 0 for result in results)
        and negative == [True] * 4
        and failed.returncode == 4
        and "503" in failed.stderr
        and len(server.requests) == 1
    )
