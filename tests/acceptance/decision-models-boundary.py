"""Independent real CLI/Bun observations; only provider/config boundaries are fixtures."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from collections.abc import Iterator, Sequence

import pytest

ROOT = Path(__file__).resolve().parents[2]
BUN = shutil.which("bun")
# Whole Bun regressions plus CLI fixtures must finish within this bounded process allowance.
PROCESS_TIMEOUT_SECONDS = 90
# The 20ms client timeout fires first; release also unblocks teardown.
RESPONSE_RELEASE_TIMEOUT_SECONDS = 1
# Poll the shutdown condition promptly without delaying individual observations.
SERVER_POLL_SECONDS = 0.05
# Bound teardown so fixture thread failures cannot hang certification.
THREAD_JOIN_SECONDS = 2
LUNA = "openai/gpt-6-luna-decisions"
JEV = "typesafe/jev-1.13"


def build_decision_request(model: str = LUNA) -> dict[str, object]:
    """Build a full native Decisions envelope with all three primitives."""
    return {
        "model": model,
        "state": {
            "text": "Compiler tutorial",
            "images": [{"url": "https://example.test/diagram.png", "detail": "high"}],
        },
        "questions": {
            "kind": {
                "type": "choice",
                "instructions": {"classify": True},
                "criteria": {"keep": None, "hide": ["Other"]},
            },
            "quality": {
                "type": "score",
                "instructions": ["Rate"],
                "criteria": ["Low", {"level": "High"}],
            },
            "claim": {
                "type": "noul",
                "instructions": "Useful?",
                "criteria": {"true": "Yes", "false": {"reason": "No"}},
            },
        },
        "provider": {
            "order": ["OpenAI"],
            "only": None,
            "ignore": [],
            "allow_fallbacks": False,
            "require_parameters": True,
            "data_collection": "deny",
            "zdr": None,
            "enforce_distillable_text": False,
            "quantizations": ["fp16"],
            "sort": {"by": "latency", "partition": None},
            "max_price": {
                "prompt": "0.01",
                "completion": "0",
                "image": "0",
                "audio": "0",
                "request": "0",
            },
            "preferred_min_throughput": {"p50": 1, "p99": None},
            "preferred_max_latency": 5,
            "options": {"OpenAI": {"native": [True, None]}},
            "future": {"keep": 0.125},
        },
        "session_id": "fixture-session",
        "trace": {"trace_id": "fixture", "custom": [1, None]},
        "user": "fixture-user",
        "extension": {"nested": [True, None, 0.125]},
    }


def build_decision_response() -> dict[str, object]:
    """Build a complete extensible response including fractional answers."""
    return {
        "model": LUNA + "-versioned",
        "id": "fixture-result",
        "provider": "Fixture",
        "answers": {
            "kind": {
                "type": "choice",
                "choice": "keep",
                "confidence": 0.8,
                "probabilities": {"keep": 0.8, "hide": 0.2},
                "future": {"keep": [None, True]},
            },
            "quality": {
                "type": "score",
                "score": 0.8123456789,
                "legend": {"0": "Low", "1": {"level": "High"}},
                "probabilities": {"0": 0.2, "1": 0.8},
            },
            "claim": {"type": "noul", "noul": 0.75, "extension": [False, 0.125]},
        },
        "usage": {
            "input_tokens": 10,
            "output_tokens": 3,
            "cost": 0.00001,
            "extension": [None],
        },
        "extension": {"keep": [None, 0.125]},
    }


@pytest.fixture(scope="session", autouse=True)
def ensure_bun() -> None:
    """Fail explicitly when the required Bun runtime is unavailable."""
    if BUN is None:
        pytest.fail("bun is required on PATH to run Decisions acceptance tests")


def run_process(
    args: Sequence[str | None],
    *,
    stdin: str | None = None,
    env: dict[str, str] | None = None,
) -> subprocess.CompletedProcess[str]:
    """Run argv in the project, returning stdout/stderr/exitcode without raising for nonzero exits.

    stdin/env are injected process inputs; the process can perform its normal filesystem I/O.
    TimeoutExpired propagates after the bounded integration-suite allowance.
    """
    if not args or args[0] is None:
        pytest.fail("bun or installed cc-hub is required on PATH for this observation")
    return subprocess.run(
        args,
        cwd=ROOT,
        input=stdin,
        env=env,
        text=True,
        capture_output=True,
        timeout=PROCESS_TIMEOUT_SECONDS,
    )


class Server(ThreadingHTTPServer):
    """Local HTTP response fixture that records every native POST body."""

    daemon_threads = True

    def __init__(self) -> None:
        """Bind an ephemeral loopback port and initialize isolated request/result state."""
        super().__init__(("127.0.0.1", 0), Handler)
        self.mode = "ok"
        self.requests: list[tuple[str, dict[str, object]]] = []
        self.release = threading.Event()
        self.result = build_decision_response()


class Handler(BaseHTTPRequestHandler):
    """Serve successful, invalid, HTTP-error, network and timeout fixture modes."""

    server: Server

    def log_message(self, *_args: object) -> None:
        """Suppress fixture HTTP access logs so request bodies never leak into test output."""
        pass

    def do_POST(self) -> None:
        """Record one POST and emit the selected deterministic response or failure."""
        self.server.requests.append(
            (
                self.path,
                json.loads(self.rfile.read(int(self.headers["Content-Length"]))),
            )
        )
        mode = self.server.mode
        if mode == "network":
            self.connection.close()
            return
        if mode == "timeout":
            self.server.release.wait(timeout=RESPONSE_RELEASE_TIMEOUT_SECONDS)
        data = (
            b"PRIVATE_BAD_RESPONSE"
            if mode == "json"
            else json.dumps(
                {"private": "PRIVATE"} if mode == "malformed" else self.server.result
            ).encode()
        )
        self.send_response(int(mode) if mode.isdigit() else 200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        try:
            self.wfile.write(data)
        except (BrokenPipeError, ConnectionResetError):
            # Timeout/network scenarios intentionally close the client socket before the write.
            pass


Boundary = tuple[Server, Path, dict[str, str], Path]


def write_cli_harness(tmp_path: Path) -> Path:
    """Write a Bun entry point that substitutes only the environment boundary."""
    harness = tmp_path / "cli.ts"
    # Mock only environment lookup; import real commands and parse actual CLI arguments.
    harness.write_text(f"""import {{ mock }} from "bun:test";
import {{ appendFileSync }} from "node:fs";
import {{ Command, CommanderError }} from {json.dumps(str(ROOT / "node_modules/commander/esm.mjs"))};
mock.module({json.dumps(str(ROOT / "src/services/env.ts"))},()=>({{getEnv:(key:string)=>{{
 // Fixture setup always injects the lookup log path before this process starts.
 appendFileSync(process.env.DECISION_FIXTURE_LOOKUPS!, JSON.stringify(key)+"\\n");
 if(key==="OPENROUTER_BASE_URL") return process.env.DECISION_FIXTURE_BASE;
 if(key==="OPENROUTER_API_KEY") return process.env.DECISION_FIXTURE_NO_KEY ? undefined : "fixture-credential";
 return undefined;
}}}}));
// Commands load after mock.module so env binds before command module evaluation.
const {{createDecideCommand}}=await import({json.dumps(str(ROOT / "src/commands/decide.ts"))});
const {{createAskCommand}}=await import({json.dumps(str(ROOT / "src/commands/ask.ts"))});
const {{createModelsCommand}}=await import({json.dumps(str(ROOT / "src/commands/models.ts"))});
// Match the production entry boundary: keep Commander codes and let queued output drain.
try {{
 await new Command().addCommand(createDecideCommand()).addCommand(createAskCommand()).addCommand(createModelsCommand()).parseAsync(process.argv);
}} catch (error) {{
 if (!(error instanceof CommanderError)) throw error;
 process.exitCode = error.exitCode;
}}
""")
    return harness


@pytest.fixture
def boundary(tmp_path: Path) -> Iterator[Boundary]:
    """Provide the isolated provider/config observation boundary."""
    server = Server()
    thread = threading.Thread(
        target=server.serve_forever,
        kwargs={"poll_interval": SERVER_POLL_SECONDS},
        daemon=True,
    )
    thread.start()
    lookups = tmp_path / "lookups.jsonl"
    harness = write_cli_harness(tmp_path)
    env = {
        **os.environ,
        "DECISION_FIXTURE_BASE": f"http://127.0.0.1:{server.server_port}/api/v1",
        "DECISION_FIXTURE_LOOKUPS": str(lookups),
        "NO_COLOR": "1",
    }
    yield server, harness, env, lookups
    server.release.set()
    server.shutdown()
    server.server_close()
    thread.join(timeout=THREAD_JOIN_SECONDS)


def invoke(
    boundary: Boundary,
    args: list[str],
    *,
    stdin: str | None = None,
    no_key: bool = False,
) -> subprocess.CompletedProcess[str]:
    """Provide the isolated provider/config observation boundary."""
    _, harness, env, _ = boundary
    return run_process(
        [BUN, str(harness), *args],
        stdin=stdin,
        env={**env, **({"DECISION_FIXTURE_NO_KEY": "1"} if no_key else {})},
    )


def build_output_responses() -> list[dict[str, object]]:
    """Build each original output scenario without sharing mutable responses."""
    raw_responses = [
        build_decision_response(),
        {
            "model": LUNA + "-resolved",
            "answers": {
                "kind": {"type": "choice", "choice": "keep"},
                "quality": {"type": "score", "score": 0.8123456789},
                "claim": {"type": "noul", "noul": 0.75},
            },
            "usage": {"input_tokens": 10, "output_tokens": 3},
        },
    ]
    for score in [4, -2.5]:
        raw_responses.append(
            {
                **build_decision_response(),
                "answers": {
                    "kind": {"type": "choice", "choice": "keep"},
                    "quality": {"type": "score", "score": score},
                    "claim": {"type": "noul", "noul": 0.75},
                },
            }
        )
    return raw_responses


OUTPUT_FLAGS = [[], ["--pretty"], ["--answers-only"], ["--answers-only", "--pretty"]]


KNOWN_MODELS = [
    JEV,
    "~typesafe/jev-latest",
    LUNA,
    "luna-decisions",
    "unknown/future-decisions",
]
LIMIT_CASES = [
    ("choice", 255),
    ("choice", 256),
    ("score", 10),
    ("score", 11),
]


def build_limit_request(model: str, kind: str, count: int) -> dict[str, object]:
    """Keep the original valid primitive shape and exact boundary payload sizes."""
    criteria = (
        {str(i): None for i in range(count)} if kind == "choice" else ["Level"] * count
    )
    body = {
        **build_decision_request(model),
        "questions": {
            "q": {"type": kind, "instructions": "Assess", "criteria": criteria}
        },
    }
    return body


REJECTED_SELECTORS = [
    "openai/gpt-4.1",
    " ",
    " luna-decisions ",
    " openai/gpt-6-luna-decisions ",
    " openai/gpt-4.1 ",
    " unknown/future-decisions ",
]


FAILURE_MODES = [
    "400",
    "401",
    "402",
    "429",
    "503",
    "json",
    "malformed",
    "network",
    "timeout",
]


# Exact historical isolated009 manifest; subsequent010 delivery still intentionally fails if opted in.
ISOLATED_DELIVERY_PATHS = {
    ".agent-sync/skills/cc-hub/SKILL.md",
    ".agent-sync/skills/cc-hub/references/models.md",
    ".gitignore",
    ".specs/changelog.md",
    ".specs/conventions-gates.yaml",
    ".specs/features/009-decision-models/changelog.md",
    ".specs/features/009-decision-models/checks/2026-10-08-test.md",
    ".specs/features/009-decision-models/contracts/openrouter-decisions-source.json",
    ".specs/features/009-decision-models/implementation.md",
    ".specs/features/009-decision-models/pipeline.md",
    ".specs/features/009-decision-models/plan.md",
    ".specs/features/009-decision-models/progress.md",
    ".specs/features/009-decision-models/spec.md",
    ".specs/roadmap.md",
    "README.md",
    "biome.json",
    "bin/cc-hub.ts",
    "src/commands/ask.ts",
    "src/commands/decide.ts",
    "src/data/decision-models.ts",
    "src/data/generation-models.ts",
    "src/data/model-types.ts",
    "src/data/models.ts",
    "src/services/decision-input.ts",
    "src/services/decisions.ts",
    "src/services/models.ts",
    "tests/acceptance/decision-models-acceptance.py",
    "tests/commands/ask.test.ts",
    "tests/commands/decide.test.ts",
    "tests/commands/models.test.ts",
    "tests/fixtures/decision-catalog-baseline.json",
    "tests/fixtures/decision-catalog-baseline.md",
    "tests/services/decision-models.test.ts",
    "tests/services/decisions.test.ts",
    "tests/services/models.test.ts",
    ".specs/README.md",
    ".specs/features/009-decision-models/checks/2026-10-08-final-audit.md",
    ".specs/features/009-decision-models/finalization-entry.md",
}


# Independent historical rule hashes are preserved verbatim.
PRESERVED_RULE_HASHES = {
    ".claude/rules/commands.md": "4f389121c203e319e6180e022e4e4179059f1991db9a95d5c6e58c94f78e8059",
    ".claude/rules/routing.md": "612492c2ecddd962b7f65ca3697aa4079d070224eb2d75fbad814853b2616365",
}


def invoke_invalid_score(boundary: Boundary) -> subprocess.CompletedProcess[str]:
    """Submit the original empty-score invalid input through the real CLI boundary."""
    return invoke(
        boundary,
        [
            "decide",
            "-i",
            json.dumps(
                {
                    **build_decision_request(),
                    "questions": {
                        "q": {"type": "score", "instructions": "Rate", "criteria": []}
                    },
                }
            ),
            "--dry-run",
        ],
    )


def invoke_transport_failure(
    boundary: Boundary, output: Path, mode: str
) -> subprocess.CompletedProcess[str]:
    """Reuse the original failure request and bounded timeout without replacing validation."""
    return invoke(
        boundary,
        [
            "decide",
            "-i",
            json.dumps(build_decision_request()),
            "--timeout-ms",
            "20" if mode == "timeout" else "10000",
            "-o",
            str(output),
        ],
    )
