"""Observe real Decisions CLI/Bun acceptance; provider/config boundaries alone are fixtures."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import shutil
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]

# Kebab-case fixture paths follow project naming; load only this owned local boundary module.
fixture_spec = importlib.util.spec_from_file_location(
    "decision_models_boundary", ROOT / "tests/acceptance/decision-models-boundary.py"
)
assert fixture_spec is not None and fixture_spec.loader is not None
decision_boundary = importlib.util.module_from_spec(fixture_spec)
fixture_spec.loader.exec_module(decision_boundary)
Boundary = decision_boundary.Boundary
BUN = decision_boundary.BUN
LUNA = decision_boundary.LUNA
JEV = decision_boundary.JEV
boundary = decision_boundary.boundary
ensure_bun = decision_boundary.ensure_bun
invoke = decision_boundary.invoke
run_process = decision_boundary.run_process
build_decision_request = decision_boundary.build_decision_request
build_decision_response = decision_boundary.build_decision_response
build_output_responses = decision_boundary.build_output_responses
build_limit_request = decision_boundary.build_limit_request
invoke_invalid_score = decision_boundary.invoke_invalid_score
invoke_transport_failure = decision_boundary.invoke_transport_failure
OUTPUT_FLAGS = decision_boundary.OUTPUT_FLAGS
KNOWN_MODELS = decision_boundary.KNOWN_MODELS
LIMIT_CASES = decision_boundary.LIMIT_CASES
REJECTED_SELECTORS = decision_boundary.REJECTED_SELECTORS
FAILURE_MODES = decision_boundary.FAILURE_MODES
ISOLATED_DELIVERY_PATHS = decision_boundary.ISOLATED_DELIVERY_PATHS
PRESERVED_RULE_HASHES = decision_boundary.PRESERVED_RULE_HASHES


# @spec AC-001: Catalog and explicit aliases — .specs/features/009-decision-models/spec.md#ac-001
def test_catalog(boundary: Boundary) -> None:
    rows = invoke(
        boundary, ["models", "list", "--type", "decision", "--provider", "openrouter"]
    )
    assert rows.returncode == 0 and [
        line.split()[0] for line in rows.stdout.splitlines()
    ] == [JEV, "~typesafe/jev-latest", LUNA]
    text = invoke(boundary, ["models", "list", "--type", "text"])
    assert text.returncode == 0 and LUNA not in text.stdout
    lookup = run_process(
        [
            BUN,
            "-e",
            'const {findModel,resolveForProvider}=await import("./src/services/models.ts"); console.log(JSON.stringify([findModel("luna-decisions")?.id,resolveForProvider("luna-decisions","openrouter")]));',
        ]
    )
    assert lookup.returncode == 0 and json.loads(lookup.stdout) == [LUNA, LUNA]


# @spec AC-002: Explicit body default precedence — .specs/features/009-decision-models/spec.md#ac-002
def test_selection(boundary: Boundary) -> None:
    server, _, _, lookups = boundary
    for command in ["decide", "jev"]:
        for body_model, explicit, expected in [
            (None, None, JEV),
            ("luna-decisions", None, LUNA),
            (JEV, "luna-decisions", LUNA),
            ("luna-decisions", JEV, JEV),
            ("unknown/future-decisions", None, "unknown/future-decisions"),
        ]:
            body = build_decision_request(body_model)
            if body_model is None:
                del body["model"]
            args = [command, "-i", json.dumps(body), "--dry-run"] + (
                ["-m", explicit] if explicit else []
            )
            result = invoke(boundary, args, no_key=True)
            assert result.returncode == 0 and json.loads(result.stdout) == {
                **body,
                "model": expected,
            }
    assert server.requests == [] and not lookups.exists()


# @spec AC-003: Full source and native envelope — .specs/features/009-decision-models/spec.md#ac-003
def test_native_input(boundary: Boundary, tmp_path: Path) -> None:
    server, _, _, _ = boundary
    body = build_decision_request("luna-decisions")
    source = tmp_path / "request.json"
    source.write_text(json.dumps(body))
    for args, stdin in [
        (["decide", "-i", json.dumps(body)], None),
        (["decide", "-i", str(source)], None),
        (["decide", "-i", "-"], json.dumps(body)),
        (["jev"], json.dumps(body)),
    ]:
        count = len(server.requests)
        result = invoke(boundary, args, stdin=stdin)
        assert (
            result.returncode == 0
            and len(server.requests) == count + 1
            and server.requests[-1] == ("/api/alpha/decisions", {**body, "model": LUNA})
        )
    changed = invoke(
        boundary,
        ["jev", "-i", str(source), "-s", '"text override"', "--user", "override"],
    )
    assert changed.returncode == 0 and server.requests[-1][1] == {
        **body,
        "model": LUNA,
        "state": "text override",
        "user": "override",
    }
    count = len(server.requests)
    collision = invoke(
        boundary, ["decide", "-s", "-", "-q", "-"], stdin=json.dumps(body)
    )
    assert (
        collision.returncode == 2
        and collision.stdout == ""
        and "competing" in collision.stderr
        and len(server.requests) == count
    )


# @spec AC-004: Complete response and projections — .specs/features/009-decision-models/spec.md#ac-004
def test_native_output(boundary: Boundary, tmp_path: Path) -> None:
    server, _, _, _ = boundary
    raw_responses = build_output_responses()
    for raw in raw_responses:
        server.result = raw
        for flags in OUTPUT_FLAGS:
            expected = raw["answers"] if "--answers-only" in flags else raw
            result = invoke(
                boundary, ["decide", "-i", json.dumps(build_decision_request()), *flags]
            )
            assert (
                result.returncode == 0
                and result.stderr == ""
                and json.loads(result.stdout) == expected
            )
            output = tmp_path / "result.custom"
            result = invoke(
                boundary,
                [
                    "decide",
                    "-i",
                    json.dumps(build_decision_request()),
                    *flags,
                    "-o",
                    str(output),
                ],
            )
            assert (
                result.returncode == 0
                and result.stdout == ""
                and json.loads(output.read_text()) == expected
            )
    for answers in [
        {"extra": {"type": "noul", "noul": 1}},
        {**build_decision_response()["answers"], "kind": {"type": "score", "score": 0}},
        {
            **build_decision_response()["answers"],
            "quality": {"type": "score", "score": "invalid"},
        },
    ]:
        server.result = {**build_decision_response(), "answers": answers}
        result = invoke(
            boundary, ["decide", "-i", json.dumps(build_decision_request())]
        )
        assert (
            result.returncode == 4
            and result.stdout == ""
            and "invalid Decisions response" in result.stderr
        )


# @spec AC-005: Common shape and model-specific limits — .specs/features/009-decision-models/spec.md#ac-005
def test_limits(boundary: Boundary) -> None:
    server, _, _, lookups = boundary
    for count in [1, 200, 201]:
        body = build_decision_request("luna-decisions")
        body["questions"] = {
            f"q{i}": {"type": "noul", "instructions": "Check"} for i in range(count)
        }
        result = invoke(
            boundary, ["decide", "-i", json.dumps(body), "--dry-run"], no_key=True
        )
        assert result.returncode == (2 if count == 201 else 0) and (
            "200" in result.stderr
            if count == 201
            else len(json.loads(result.stdout)["questions"]) == count
        )
    for model in KNOWN_MODELS:
        for kind, count in LIMIT_CASES:
            body = build_limit_request(model, kind, count)
            result = invoke(
                boundary, ["decide", "-i", json.dumps(body), "--dry-run"], no_key=True
            )
            rejected = model in [JEV, "~typesafe/jev-latest"] and count in [256, 11]
            assert result.returncode == (2 if rejected else 0) and (
                result.stdout == ""
                if rejected
                else json.loads(result.stdout)["questions"] == body["questions"]
            )
    body = {
        **build_decision_request("unknown/future-decisions"),
        "questions": {
            f"q{i}": {"type": "noul", "instructions": "Check"} for i in range(201)
        },
    }
    unknown = invoke(
        boundary, ["decide", "-i", json.dumps(body), "--dry-run"], no_key=True
    )
    assert (
        unknown.returncode == 0 and len(json.loads(unknown.stdout)["questions"]) == 201
    )
    invalid = invoke_invalid_score(boundary)
    assert (
        invalid.returncode == 2
        and invalid.stdout == ""
        and server.requests == []
        and not lookups.exists()
    )


# @spec AC-006: Safe pre-auth and single bounded failures — .specs/features/009-decision-models/spec.md#ac-006
def test_safe_failures(boundary: Boundary, tmp_path: Path) -> None:
    server, _, _, lookups = boundary
    for model in [JEV, "~typesafe/jev-latest", LUNA, "luna-decisions"]:
        guard = invoke(boundary, ["ask", "Question", "-m", model])
        assert (
            guard.returncode == 2
            and guard.stdout == ""
            and "cc-hub decide" in guard.stderr
            and server.requests == []
        )
    lookups.unlink(missing_ok=True)
    for body in [
        {**build_decision_request(), "model": model} for model in REJECTED_SELECTORS
    ] + [{**build_decision_request(), "state": None}]:
        result = invoke(boundary, ["decide", "-i", json.dumps(body)])
        assert (
            result.returncode == 2
            and result.stdout == ""
            and server.requests == []
            and not lookups.exists()
        )
    dry = invoke(
        boundary,
        ["decide", "-i", json.dumps(build_decision_request()), "--dry-run"],
        no_key=True,
    )
    assert (
        dry.returncode == 0
        and json.loads(dry.stdout) == build_decision_request()
        and server.requests == []
        and not lookups.exists()
    )
    missing = invoke(
        boundary, ["decide", "-i", json.dumps(build_decision_request())], no_key=True
    )
    assert (
        missing.returncode == 3
        and missing.stdout == ""
        and "Keychain" in missing.stderr
        and server.requests == []
    )
    for mode in FAILURE_MODES:
        server.mode = mode
        count = len(server.requests)
        output = tmp_path / "failed.json"
        output.write_text("unchanged")
        result = invoke_transport_failure(boundary, output, mode)
        assert (
            result.returncode == 4
            and result.stdout == ""
            and len(server.requests) == count + 1
            and output.read_text() == "unchanged"
            and "fixture-credential" not in result.stderr
            and "PRIVATE" not in result.stderr
        )


# @spec AC-007: Installed help and accurate offline docs — .specs/features/009-decision-models/spec.md#ac-007
def test_help_docs(boundary: Boundary) -> None:
    candidate_help = invoke(boundary, ["decide", "--help"])
    assert (
        candidate_help.returncode == 0
        and "luna-decisions" in candidate_help.stdout
        and "body model" in candidate_help.stdout
    )
    installed = shutil.which("cc-hub")
    if installed is None:
        pytest.fail(
            "installed cc-hub is required on PATH; install the candidate CLI before acceptance"
        )
    help_result = run_process([installed, "decide", "--help"])
    assert (
        help_result.returncode == 0
        and "luna-decisions" in help_result.stdout
        and "body model" in help_result.stdout
        and "--dry-run" in help_result.stdout
    )
    for name in [
        "README.md",
        ".agent-sync/skills/cc-hub/SKILL.md",
        ".agent-sync/skills/cc-hub/references/models.md",
    ]:
        text = (ROOT / name).read_text()
        assert all(
            term in text
            for term in [
                LUNA,
                "luna-decisions",
                JEV,
                "supported_parameters",
                "200",
                "255",
                "10",
                "extensions",
            ]
        )
        example = invoke(
            boundary,
            [
                "decide",
                "-m",
                "luna-decisions",
                "--input",
                '{"state":"Compiler tutorial","questions":{"useful":{"type":"noul","instructions":"Is this useful?"}}}',
                "--dry-run",
            ],
        )
        assert example.returncode == 0 and json.loads(example.stdout) == {
            "state": "Compiler tutorial",
            "questions": {
                "useful": {"type": "noul", "instructions": "Is this useful?"}
            },
            "model": LUNA,
        }


# @spec AC-008: Actual Bun/static and isolated feature diff — .specs/features/009-decision-models/spec.md#ac-008
def test_regression_and_isolation() -> None:
    for argv in [
        [BUN, "test"],
        [BUN, "x", "--no-install", "tsc", "--noEmit"],
        [BUN, "x", "--no-install", "biome", "check", "."],
    ]:
        result = run_process(argv)
        assert result.returncode == 0
    baseline_path = ROOT / "tests/fixtures/decision-catalog-baseline.json"
    baseline = json.loads(baseline_path.read_text())
    assert (
        hashlib.sha256(baseline_path.read_bytes()).hexdigest()
        == "2a0a4581b7fffb5ff51112420011010973637952e4c428dae4d626ed4ec5fb9e"
        and len(baseline) == 104
    )
    baseline_ids = json.dumps([model["id"] for model in baseline])
    identity = run_process(
        [
            BUN,
            "-e",
            f'const {{MODELS}}=await import("./src/data/models.ts");const ids=new Set({baseline_ids});console.log(JSON.stringify(MODELS.filter(m=>ids.has(m.id))));',
        ]
    )
    assert identity.returncode == 0 and baseline == json.loads(identity.stdout)


# The working-tree scope is a one-time delivery observation, not a permanent regression contract.
# @spec AC-008: Observe isolated009 delivery before integrating later features — .specs/features/009-decision-models/spec.md#ac-008
@pytest.mark.skipif(
    os.environ.get("CC_HUB_009_VERIFY_DELIVERY_SCOPE") != "1",
    reason="one-time isolated009 delivery scope; enable explicitly before integrating later features",
)
def test_delivery_scope_snapshot() -> None:
    # Exact public manifest fixed independently by the parent before control-audit repairs.
    allowed = ISOLATED_DELIVERY_PATHS
    diff = run_process(["git", "diff", "--name-only", "HEAD"])
    assert diff.returncode == 0 and set(diff.stdout.splitlines()) <= allowed
    # Preserve only these two pre-existing inputs, using the historical runner capture ee87eb7230834736869c4a3d0b5ec58f.
    preserved = PRESERVED_RULE_HASHES
    for name, expected_hash in preserved.items():
        path = ROOT / name
        assert (
            path.is_file()
            and hashlib.sha256(path.read_bytes()).hexdigest() == expected_hash
        )
    untracked = run_process(["git", "ls-files", "--others", "--exclude-standard"])
    assert (
        untracked.returncode == 0
        and set(untracked.stdout.splitlines()) <= allowed | preserved.keys()
    )
    assert not any(
        term in (ROOT / "src/data/models.ts").read_text()
        for term in ["text-models.ts", "media-models.ts", "music-models.ts"]
    )
    assert not any(
        term in (ROOT / "src/services/decisions.ts").read_text()
        for term in ["decision-validation.ts", "decision-limits.ts"]
    )
