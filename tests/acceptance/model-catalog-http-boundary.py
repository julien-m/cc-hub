"""Own loopback/config fixtures for real model-catalog CLI acceptance."""

from __future__ import annotations
import json
import os
import shutil
import subprocess
import threading
from collections.abc import Iterator, Sequence
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import pytest

ROOT = Path(__file__).resolve().parents[2]
BUN = shutil.which("bun")
# Bounded process execution prevents hanging HTTP acceptance certification.
TIMEOUT_SECONDS = 90
# Event-driven shutdown with bounded polling/join avoids arbitrary sleeps.
POLL_SECONDS = 0.05
JOIN_SECONDS = 2


def run_process(
    args: Sequence[str], stdin: str | None = None, env: dict[str, str] | None = None
) -> subprocess.CompletedProcess[str]:
    """Run real argv in the candidate, retaining actual exit/stdout/stderr with a timeout."""
    return subprocess.run(
        args,
        cwd=ROOT,
        input=stdin,
        env=env,
        text=True,
        capture_output=True,
        timeout=TIMEOUT_SECONDS,
    )


# @spec FR-006: Deterministic HTTP fixture — .specs/features/010-model-catalog-update/spec.md#fr-006
class Server(ThreadingHTTPServer):
    """Loopback HTTP fixture recording real requests from the unchanged client."""

    daemon_threads = True

    def __init__(self) -> None:
        """Bind an ephemeral port; each test owns its independent requests and result."""
        super().__init__(("127.0.0.1", 0), Handler)
        self.requests: list[tuple[str, dict[str, object]]] = []
        self.status = 200


class Handler(BaseHTTPRequestHandler):
    """Serve deterministic chat responses without network, credentials or personal data."""

    server: Server

    def log_message(self, *_args: object) -> None:
        """Suppress fixture access logs; captured request data stays in test memory."""
        pass

    def do_POST(self) -> None:
        """Record the POST path/body and emit one controlled completion or HTTP error."""
        self.server.requests.append(
            (
                self.path,
                json.loads(self.rfile.read(int(self.headers["Content-Length"]))),
            )
        )
        data = json.dumps(
            {"choices": [{"message": {"content": "fixture-output"}}]}
        ).encode()
        self.send_response(self.server.status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


Boundary = tuple[Server, Path, dict[str, str]]


def write_harness(tmp_path: Path) -> Path:
    """Generate the entry point, replacing only external config lookup before real imports."""
    harness = tmp_path / "cli.ts"
    # Environment lookup is the sole mock: actual prompt, files, catalog, command and HTTP client run.
    harness.write_text(f"""import {{ mock }} from "bun:test";
mock.module({json.dumps(str(ROOT / "src/services/env.ts"))},()=>({{getEnv:(key:string)=>{{
 if(key==="OPENROUTER_BASE_URL") return process.env.CATALOG_FIXTURE_BASE;
 if(key==="OPENROUTER_API_KEY") return process.env.CATALOG_FIXTURE_NO_KEY ? undefined : "fixture-only";
 if(key==="ASK_MODEL") return "openai/gpt-4.1";
 return undefined;
}}}}));
const {{createAskCommand}}=await import({json.dumps(str(ROOT / "src/commands/ask.ts"))});
await createAskCommand().parseAsync(["bun","ask",...process.argv.slice(2)]);
""")
    return harness


@pytest.fixture
def boundary(tmp_path: Path) -> Iterator[Boundary]:
    """Own isolated loopback response/config fixtures and clean up threads after each test."""
    server = Server()
    thread = threading.Thread(
        target=server.serve_forever, kwargs={"poll_interval": POLL_SECONDS}, daemon=True
    )
    thread.start()
    harness = write_harness(tmp_path)
    env = {
        **os.environ,
        "CATALOG_FIXTURE_BASE": f"http://127.0.0.1:{server.server_port}/fixture/v1",
        "NO_COLOR": "1",
    }
    try:
        yield server, harness, env
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=JOIN_SECONDS)


def invoke(
    boundary: Boundary, args: list[str], stdin: str | None = None
) -> subprocess.CompletedProcess[str]:
    """Invoke the real ask factory in a separate Bun process through fixture config only."""
    _, harness, env = boundary
    if BUN is None:
        pytest.fail("bun is required for ask acceptance")
    return run_process([BUN, str(harness), *args], stdin=stdin, env=env)
