# cc-hub

AI Swiss-army knife CLI — centralizes execution logs from your AI agents, sends a daily digest to Telegram, and exposes multi-model capabilities.

Runs entirely locally, zero server. Callable from any directory.

## Installation

```bash
bun install
bun link
```

`cc-hub` is now available globally.

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- [`creds`](https://github.com/julien-m/keychain-creds) — only for commands that call external APIs

### Credentials setup

No API key is needed for local commands such as `skill`, `rule`, `command`, `agent`, `log` or `hook`. Configure only the keys of the commands you use.

API keys are stored and read exclusively via the `creds` CLI. No token is ever stored in plaintext.

```bash
creds set OPENROUTER_API_KEY   # example: enables ask / decide
```

| Usage                         | Creds key              | Needed by                                  |
| ----------------------------- | ---------------------- | ------------------------------------------ |
| Telegram Bot Token            | `TELEGRAM_BOT_TOKEN`   | `telegram`                                 |
| Telegram Chat ID              | `TELEGRAM_CHAT_ID`     | `telegram`                                 |
| OpenRouter API Key            | `OPENROUTER_API_KEY`   | `ask`, `decide`                            |
| Poyo API Key (media)          | `POYO_API_KEY`         | `ask` (media), `imagine`, `video`, `motion`, `music` |
| Soniox API Key                | `SONIOX_API_KEY`       | `transcribe`                               |
| Turso Database URL            | `TURSO_DATABASE_URL`   | optional multi-machine sync                |
| Turso Auth Token              | `TURSO_AUTH_TOKEN`     | optional multi-machine sync                |

### Provider & model defaults

Create `~/.claude-hub/.env` to set default providers and models (no secrets here):

```env
# LLM — via OpenRouter
LLM_PROVIDER=openrouter
LLM_MODEL=anthropic/claude-sonnet-4.6

# Copilot — via GitHub Copilot CLI
COPILOT_MODEL=openai/gpt-5.4

# Codex — via OpenAI Codex CLI
CODEX_MODEL=openai/gpt-5.6-sol

# Image — via Poyo
IMAGE_PROVIDER=poyo
IMAGE_MODEL=google/gemini-3.1-flash-image

# Video — via Poyo
VIDEO_PROVIDER=poyo
VIDEO_MODEL=kuaishou/kling-3.0-pro

# Music — via Poyo
MUSIC_MODEL=poyo/generate-music

# Transcription — via Soniox
TRANSCRIBE_PROVIDER=poyo
TRANSCRIBE_MODEL=soniox/soniox
```

All models use **canonical IDs** (OpenRouter format): `provider/model-name`. Use `cc-hub models list` to browse all available models.

Every command uses its `.env` default but accepts `--model` for on-the-fly override.

## Commands

### `log` — Activity logging

#### `cc-hub log add`

```bash
cc-hub log add \
  --type tech_watch \
  --title "Next.js tech watch" \
  --status success \
  --details "12 articles analyzed" \
  --file ./result.md \
  --important
```

| Option        | Description                          | Required |
| ------------- | ------------------------------------ | -------- |
| `--type`      | Event type (see list below)          | yes      |
| `--title`     | Event title                          | yes      |
| `--status`    | `success`, `failed` or `partial`     | yes      |
| `--details`   | Additional details                   | no       |
| `--file`      | Artifact file to attach              | no       |
| `--source`    | Source (default: `claude-code`)      | no       |
| `--important` | Mark as important                    | no       |

**Available types:**

| Type                | Description                 |
| ------------------- | --------------------------- |
| `tech_watch`        | Tech watch / monitoring     |
| `pull_request`      | PR created or merged        |
| `code_refactor`     | Code refactoring            |
| `bug_fix`           | Bug fix                     |
| `code_review`       | Code review                 |
| `test_run`          | Test execution              |
| `deploy`            | Deployment                  |
| `documentation`     | Docs generation or update   |
| `summary_sent`      | Summary sent                |
| `data_analysis`     | Data analysis               |
| `image_gen`         | Image generation            |
| `video_gen`         | Video generation            |
| `transcription`     | Audio transcription         |
| `prompt_used`       | Optimized prompt used       |
| `backup`            | Backup completed            |
| `notification_sent` | Notification sent           |
| `task_scheduled`    | Task scheduled or modified  |
| `error`             | Critical error              |
| `other`             | Other                       |

#### `cc-hub log list`

```bash
cc-hub log list                # all events
cc-hub log list --today        # today only
cc-hub log list --failed       # failures only
cc-hub log list --type deploy  # filter by type
cc-hub log list --limit 10     # limit results
```

#### `cc-hub log get <id>`

Shows event details and its artifact content if present.

```bash
cc-hub log get 42
```

### `digest` — Daily summary

The digest only contains events explicitly pushed via `cc-hub log add`. Other commands are silent by default — it's up to the agent or script to decide what deserves to be logged.

#### `cc-hub digest preview`

Previews the digest in the terminal.

```bash
cc-hub digest preview
cc-hub digest preview --since 2026-03-10
```

Sample output:

```
📋 Digest du 12/03/2026
─────────────────────
✅ Next.js tech watch (03:12) 📎 artifact
✅ 2 PRs merged on project-x (04:30, 05:01)
⚠️  Refactor auth.ts — lint error (02:45)

1 attention point: the refactoring task failed.
```

#### `cc-hub digest send`

Generates a summary via Claude, sends it to Telegram with `--important` log artifacts as attachments.

```bash
cc-hub digest send
```

### `schedule` — Digest scheduling

```bash
cc-hub schedule set 08:00    # daily digest at 8am
cc-hub schedule status       # show current schedule
cc-hub schedule remove       # remove schedule
```

Uses `crontab` internally.

### `ask` — LLM via OpenRouter

```bash
cc-hub ask "Summarize this text"
cc-hub ask "Explain this bug" --model openai/gpt-5.4
cc-hub ask "Reason with an open-weight model" --model openai/gpt-oss-120b
cc-hub ask "Use a long-context coding model" --model z-ai/glm-5.2
cc-hub ask "Deep implementation plan" --model z-ai/glm-5.2 --effort max
cc-hub ask "Translate to English" --model google/gemini-3.1-pro-preview
```

Supports piping and file context:

```bash
cat file.ts | cc-hub ask "Explain this code"
cc-hub ask "Explain this code" -f src/cli.ts
cc-hub ask "Compare these files" -f src/a.ts -f src/b.ts
```

JSON output:

```bash
# Free-form JSON (model chooses the structure)
cc-hub ask "3 European capitals in JSON" --json

# Structured output with a JSON Schema (inline)
cc-hub ask "3 European capitals" --schema '{"name":"caps","strict":true,"schema":{"type":"object","properties":{"capitals":{"type":"array","items":{"type":"object","properties":{"city":{"type":"string"},"country":{"type":"string"}},"required":["city","country"],"additionalProperties":false}}},"required":["capitals"],"additionalProperties":false}}'

# Structured output with a JSON Schema (file)
cc-hub ask "3 European capitals" --schema ./capitals.schema.json
```

| Option | Description |
| --- | --- |
| `--model <model>` | Model ID (default: `ASK_MODEL` from `.env`) |
| `-f, --file <path>` | File or glob as context (repeatable) |
| `--provider <name>` | `openrouter` (default) or `poyo` |
| `--json` | Free-form JSON output |
| `--schema <json_or_file>` | Structured output with JSON Schema (inline string or `.json` file path). Implies `--json` |
| `--effort <level>` | cc-hub reasoning effort: `minimal`, `low`, `medium`, `high`, `xhigh`, `max`, `ultra`; mapped down to the highest effort supported by the selected OpenRouter model |

Output goes to stdout. Silent by default (no auto-logging).

### `decide` / `jev` — Jev typed decisions via OpenRouter

<!-- @spec FR-006: Complete Jev command documentation — .specs/features/008-jev-openrouter/spec.md#fr-006 -->
Jev answers bounded questions with `choice` (category), `score` (ordered levels, including decimal scores) and `noul` (yes/no probability). It uses OpenRouter's [Decisions API](https://openrouter.ai/docs/api/api-reference/alphadecisions/submit-a-decisions-request), with `typesafe/jev-1.13` pinned by default. It is a `decision` model; `ask` directs you to `decide` when Jev is selected.

```bash
# Fast single-question call: no prompts or spinner; JSON stdout
cc-hub jev "This post advertises a paid course" -q '{"ad":{"type":"noul","instructions":"Is this an advertisement?"}}'

# Full body from a file, inline JSON or stdin
cc-hub decide --input request.json
cat request.json | cc-hub jev
cc-hub decide -i '{"state":"Please refund my duplicate charge","questions":{"refund":{"type":"noul","instructions":"Is a refund requested?"}}}'

# Structured state, routing and output options
cc-hub jev --state '{"post":"A new compiler tutorial"}' --questions questions.json \
  --provider '{"only":["TypeSafe"],"allow_fallbacks":false}' \
  --session-id filter-run --trace '{"trace_name":"feed-filter"}' --user feed-script \
  --timeout-ms 5000 --answers-only --pretty --output answers.json
cc-hub jev -i request.json -m '~typesafe/jev-latest' --dry-run
```

Full `request.json` example (illustrative data):

```json
{
  "model": "typesafe/jev-1.13",
  "state": {"post": "Sponsored: buy our coding course today"},
  "questions": {
    "topic": {"type":"choice","instructions":"Classify the post","criteria":{"advertisement":"Promotional offer","technical":"Substantive technical content","other":null}},
    "relevance": {"type":"score","instructions":"How relevant is this post to software development?","criteria":["Unrelated","Some technical content","Substantive tutorial"]},
    "ad": {"type":"noul","instructions":"Is the post advertising something?","criteria":{"true":"Promotional offer","false":"Ordinary post"}}
  },
  "provider": {"only":["TypeSafe"],"allow_fallbacks":false},
  "session_id": "feed-filter-run",
  "trace": {"trace_name":"feed-filter","generation_name":"post-classification"},
  "user": "feed-script"
}
```

| Input option | Meaning |
|---|---|
| `[state]` | Plain text state; when questions are supplied, piped text can supply state too |
| `-i, --input <json_or_file>` | Complete JSON request, inline or file; `-` reads stdin; omitted input/flags reads piped full request |
| `-s, --state <json_or_file>` | JSON string, object or array for structured state |
| `-q, --questions <json_or_file>` | Named typed questions; instructions accept strings, objects or arrays |
| `-m, --model <model>` | Override body model; default `typesafe/jev-1.13`; official latest alias `~typesafe/jev-latest` |
| `-p, --provider <json_or_file>` | OpenRouter provider routing preferences |
| `--session-id <id>` | OpenRouter session grouping; maximum 256 characters |
| `--trace <json_or_file>` | Trace identifiers, names and custom metadata |
| `--user <id>` | End-user identifier; maximum 256 characters |
| `--timeout-ms <ms>` | Positive integer timeout in milliseconds; default 10000; no automatic retries |

Choice supports 1–255 options; Score supports 1–10 ordered levels. Explicit flags override matching full-body fields. Full-body requests preserve additional JSON fields. Provider routing accepts the complete OpenRouter object, including `order`, `only`, `ignore`, `allow_fallbacks`, `require_parameters`, `data_collection`, `zdr`, `enforce_distillable_text`, `quantizations`, `sort`, `max_price`, `preferred_min_throughput`, `preferred_max_latency` and `options`.

| Output option | Meaning |
|---|---|
| `-j, --json` | Explicit JSON mode; JSON is already the default |
| `--answers-only` | Emit only the named `answers` object |
| `--pretty` | Indent JSON for reading |
| `-o, --output <path>` | Write to the exact specified file; stdout stays empty |
| `--dry-run` | Validate and print the effective request without authentication or network |

Default output preserves the complete response: `model`, `answers`, `usage.input_tokens`, `usage.output_tokens`, optional `usage.cost`, `id`, `provider` and additional metadata. Choice answers include `choice` and optional `probabilities`/`confidence`; score answers include decimal `score` and optional `legend`/`probabilities`/`confidence`; noul answers contain a probability `noul` between 0 and 1. No explanations or generated prose are requested. JSON can be consumed directly, for example `cc-hub jev -i request.json | jq '.answers.ad.noul'`.

Uses the existing `OPENROUTER_API_KEY` configuration resolved through `creds`/Keychain. `OPENROUTER_BASE_URL` is shared with chat; a trailing `/v1` is removed for the Decisions endpoint. Errors go to stderr, with empty successful-result stdout: input errors exit 2, missing credentials exit 3, network/provider/invalid-response failures exit 4. Input is validated before key lookup; no request payloads or secrets are logged.

### `imagine` — Image generation

```bash
cc-hub imagine "Dashboard dark mode minimal" -o dashboard.png
cc-hub imagine "Logo for project X" --model google/gemini-3.1-flash-image -o logo.png
cc-hub imagine "Hero banner" --size 16:9 --resolution 2K -o banner.png
cc-hub imagine "Transform into watercolor" -i ./photo.png -o watercolor.png
cc-hub imagine "Stylize this" -i https://example.com/img.jpg -o styled.png
cc-hub imagine "Blend two refs" -i ref1.png -i ref2.png -o blend.png
```

Downloads the image to `~/.claude-hub/artifacts/` and prints the path to stdout. Use `-o, --output <filename>` to specify a custom filename.

| Option | Description |
| --- | --- |
| `--model <model>` | Model override (default: `IMAGINE_MODEL` from `.env`) |
| `--size <ratio>` | Aspect ratio: `1:1`, `16:9`, `9:16`, `3:2`, `2:3`, `4:3`, `3:4`, `4:5`, `5:4`, `21:9` (default: `1:1`) |
| `--resolution <res>` | Output resolution: `1K`, `2K`, `4K` (default: `1K`) |
| `-i, --image <path>` | Reference image (local path or URL). **Repeatable** — pass `-i` multiple times to send several references in one request. The CLI preserves flag order when forwarding `image_urls`. Supported: png, jpg, jpeg, webp |
| `-o, --output <path>` | Output file path or name (**required**) |

Available image models: `google/gemini-3.1-flash-image` (default), `google/gemini-3.1-flash-image-edit`, `google/nano-banana-2` (pro), `google/nano-banana-2-edit` (pro edit), `google/nano-banana`, `google/nano-banana-edit`, `bytedance/seedream-5.0-lite`, `bytedance/seedream-5.0-lite-edit`, `bytedance/seedream-4.5`, `bytedance/seedream-4.5-edit`, `openai/gpt-5.4-image-2`, `openai/gpt-5.4-image-2-edit`, `openai/gpt-image-1.5`, `openai/gpt-image-1.5-edit`, `openai/gpt-4o-image`, `openai/gpt-4o-image-edit`, `openai/z-image`, `bfl/flux-2-pro`, `bfl/flux-2-pro-edit`, `bfl/flux-2-flex`, `bfl/flux-2-flex-edit`, `xai/grok-imagine`.

### `video` — Video generation

```bash
cc-hub video "Product demo 10 seconds" -o demo.mp4
cc-hub video "Animated logo loop" --duration 10 --aspect-ratio 9:16 -o loop.mp4
cc-hub video "Intro clip" -o intro.mp4
cc-hub video "The person starts walking" -i ./portrait.jpg -o animated.mp4
cc-hub video "Zoom out slowly" -i https://example.com/scene.png -o reveal.mp4
cc-hub video "Animate fusion" -i frame1.png -i frame2.png -o fusion.mp4
```

Downloads the video to `~/.claude-hub/artifacts/` and prints the path to stdout. Use `-o, --output <filename>` to specify a custom filename.

| Option | Description |
| --- | --- |
| `--model <model>` | Model override (default: `VIDEO_MODEL` from `.env`) |
| `--duration <seconds>` | Duration in seconds, 3-15 (default: `5`) |
| `--aspect-ratio <ratio>` | Aspect ratio: `16:9`, `1:1`, `9:16` (default: `16:9`) |
| `-i, --image <path>` | Start frame image for animation (local path or URL). **Repeatable** — pass `-i` multiple times to send several reference frames in one request. The CLI preserves flag order when forwarding `image_urls`. Supported: png, jpg, jpeg, webp |
| `-o, --output <path>` | Output file path or name (**required**) |

Available video models: `kuaishou/kling-3.0-pro` (default), `kuaishou/kling-3.0-standard`, `kuaishou/kling-2.6`, `kuaishou/kling-2.6-motion-control`, `kuaishou/kling-2.5-turbo-pro`, `kuaishou/kling-2.1-standard`, `kuaishou/kling-2.1-pro`, `minimax/hailuo-2.3`, `minimax/hailuo-02`, `minimax/hailuo-02-pro`, `alibaba/wan-2.2-text-to-video-fast`, `alibaba/wan-2.2-image-to-video-fast`, `alibaba/wan-2.5-text-to-video`, `alibaba/wan-2.5-image-to-video`, `alibaba/wan-2.6-text-to-video`, `alibaba/wan-2.6-image-to-video`, `alibaba/wan-2.6-video-to-video`, `alibaba/wan-animate-move`, `alibaba/wan-animate-replace`, `bytedance/seedance-1.0-pro`, `bytedance/seedance-1.5-pro`, `runway/gen-4.5`, `google/veo-3.1-fast`, `google/veo-3.1-quality`, `openai/sora-2-official`, `openai/sora-2`, `openai/sora-2-pro`, `openai/sora-2-stable`, `xai/grok-imagine-video`.

### `motion` — Motion control video

Transfers movement from a reference video onto a character image using Kling 3.0 Motion Control.

```bash
cc-hub motion "Dance animation" -i ./character.png -v ./dance.mp4 -o result.mp4
cc-hub motion "Walking scene" -i https://example.com/person.jpg -v ./walk.mp4 -o walk-result.mp4
cc-hub motion "Gesture transfer" -i ./avatar.png -v ./gesture.mp4 --character-orientation video -o out.mp4
cc-hub motion "Walk cycle" -i front.png -i side.png -v ref.mp4 -o walk.mp4
```

| Option | Description |
| --- | --- |
| `-i, --image <path>` | Character image — the person/character to animate (**required**, at least once). **Repeatable** — pass `-i` multiple times to provide several views of the same character. Supported: png, jpg, jpeg, webp |
| `-v, --video <path>` | Reference video — the movement source (**required**). Supported: mp4, webm, mov |
| `--character-orientation <value>` | Alignment mode: `character` or `video` (default: `character`) |
| `-o, --output <path>` | Output file path or name (**required**) |

### `music` — Music generation

```bash
cc-hub music generate "Upbeat jazz with piano and bass" -o jazz.mp3
cc-hub music generate "Ambient electronic chill" --model poyo/generate-music -o ambient.mp3
```

| Option | Description |
| --- | --- |
| `--model <model>` | Model override (default: `MUSIC_MODEL` from `.env`) |
| `-o, --output <path>` | Output file path or name (**required**) |

Default model: `poyo/generate-music`. Only the `generate` subcommand is available for now — other music operations (extend, cover, vocals, stems) will come in a future release.

### `transcribe` — Audio to text

```bash
cc-hub transcribe ./meeting.mp3
```

Transcription via Soniox. Outputs the transcription to stdout.

### `codex` — LLM via OpenAI Codex CLI

LLM access via the `codex` CLI. Supports one-shot prompts, interactive REPL sessions, and repository reviews.

```bash
cc-hub codex "Summarize this text"
cc-hub codex "Explain this code" -f src/cli.ts
cc-hub codex "Compare these files" -f src/a.ts -f src/b.ts
cat file.ts | cc-hub codex "Analyze"
cc-hub codex "Question" --model openai/gpt-5.3-codex
cc-hub codex "Deep analysis" --effort high
cc-hub codex "Max reasoning" --effort max
```

Default model: `openai/gpt-5.6-sol`. Authentication is managed by the Codex CLI itself (`codex login`).

| Option | Description |
| --- | --- |
| `--model <model>` | Model canonical ID (default: `openai/gpt-5.6-sol`) |
| `-f, --file <path>` | File or glob to inject as context in the prompt (repeatable) |
| `--effort <level>` | cc-hub reasoning effort: `minimal`, `low`, `medium`, `high`, `xhigh`, `max`, `ultra`; mapped down to the highest effort known for the selected model |
| `--sandbox <mode>` | Sandbox mode: `read-only` (default), `workspace-write` |
| `--schema <path>` | JSON Schema file for structured output |
| `--interactive` | Start an interactive Codex session |
| `--persist` | Create a non-ephemeral thread; does not automatically resume a previous session |

#### `cc-hub codex --interactive`

Launch a conversational REPL session with Codex:

```bash
cc-hub codex --interactive
cc-hub codex --interactive "Start with this question"
cc-hub codex --interactive --model openai/gpt-5.4
cc-hub codex --interactive --sandbox workspace-write
cc-hub codex --interactive --persist
```

Type `exit` or press Ctrl-C to end the session. Each turn is sent to the same thread, preserving context for that session. Use `--persist` to create a non-ephemeral thread; it does not automatically resume a previous session.

#### `cc-hub codex review`

Run a code review on the current repository:

```bash
cc-hub codex review                    # review uncommitted changes
cc-hub codex review --base main        # review against a base branch
cc-hub codex review --model openai/gpt-53-codex
```

| Option | Description |
| --- | --- |
| `--model <model>` | Model canonical ID (default: `openai/gpt-5.4`) |
| `--base <ref>` | Git base reference for review (e.g. `main`) |

Available Codex models: `openai/gpt-5.6-sol` (default), `openai/gpt-5.6-terra`, `openai/gpt-5.6-luna`, `openai/gpt-5.5`, `openai/gpt-5.4`, `openai/gpt-5.4-mini`, `openai/gpt-53-codex`, `openai/gpt-53-codex-spark`.

### `copilot` — LLM via GitHub Copilot CLI

LLM access via `gh copilot` CLI. Ideal for background/cron tasks.

```bash
cc-hub copilot "Summarize this text"
cc-hub copilot "Explain this code" -f src/cli.ts
cc-hub copilot "Compare these files" -f src/a.ts -f src/b.ts
cat file.ts | cc-hub copilot "Analyze"
cc-hub copilot "Question" --model anthropic/claude-sonnet-4.6
```

Default model: `openai/gpt-5.4`. Token is retrieved automatically via `gh auth token`.

Unlike `ask` (which sends file contents to an external LLM API), `copilot` runs the `gh copilot` CLI locally — it has direct access to the filesystem. You can reference local paths in the prompt without `-f`:

```bash
# Copilot reads the files itself — no need to pass them explicitly
cc-hub copilot "Analyze the project in ~/projects/my-app and suggest improvements"
cc-hub copilot "Find security issues in src/auth/"

# -f is still useful to inject file content directly into the prompt context
cc-hub copilot "Explain this code" -f src/cli.ts
```

| Option | Description |
| --- | --- |
| `--model <model>` | Model canonical ID (default: `openai/gpt-5.4`) |
| `-f, --file <path>` | File or glob to inject as context in the prompt (repeatable) |

### `prompt` — Per-model prompting guides

Maintains a local collection of prompting guides (Markdown files). Claude Code calls `prompt get` at runtime to fetch the guide and craft optimal prompts autonomously.

```bash
cc-hub prompt get --model openai/gpt-5.4        # display guide for a model
cc-hub prompt get --type image                   # display guide by type
cc-hub prompt list                               # list available guides
cc-hub prompt delete --model openai/gpt-5.4     # remove a guide
```

Guides are stored in `~/.claude-hub/prompts/<model-slug>.md`.

### `sync` — Turso Cloud sync

Synchronize portable AI assets from `.agent-sync` / `~/.agent-sync` to Claude Code and Codex provider directories. `sync run`, `sync status`, and `sync repair` include skills, agents, rules, and hooks.

```bash
cc-hub sync run --scope project --targets all
cc-hub sync status --scope all --targets all
cc-hub sync repair --scope project --targets codex
cc-hub sync clean --dry-run
```

Legacy Turso database synchronization remains available under:

```bash
cc-hub sync db
cc-hub sync db-status
```

When Turso is configured, an initial database sync happens automatically on startup.

### `migrate` — Import provider folders into `.agent-sync`

Import existing Claude Code or Codex configuration into the canonical `.agent-sync` layout, then recreate provider symlinks. The folder form is the default workflow:

```bash
cc-hub migrate .claude --from claude --scope project --targets all --force
cc-hub migrate .codex --from codex --scope project --targets all --force
```

Claude folder migration discovers:

- `.claude/skills/*` -> `.agent-sync/skills/<name>`
- `.claude/agents/*.md` -> `.agent-sync/agents/<name>/{agent.yaml,prompt.md,dist/}`
- `.claude/commands/*.md` -> `.agent-sync/skills/<command-name>/SKILL.md`
- `.claude/rules/**/*.md` -> `.agent-sync/rules/<relative-path>.md`

Codex folder migration discovers:

- `.codex/agents/*.toml` -> `.agent-sync/agents/<name>/{agent.yaml,prompt.md,dist/}`

Claude commands become skills because Codex does not have a slash-command artifact type. Targeted imports are also available:

```bash
cc-hub migrate skill .claude/skills/reviewer --scope project --targets all --force
cc-hub migrate agent .claude/agents/reviewer.md --from claude --scope project --targets all --force
cc-hub migrate agent .codex/agents/reviewer.toml --from codex --scope project --targets all --force
cc-hub migrate command .claude/commands/review.md --scope project --targets all --force
cc-hub migrate rule .claude/rules/api.md --scope project --targets all --force
cc-hub migrate rules .claude/rules --scope project --targets all --force
```

Use `--dry-run` to inspect planned writes without changing files. Existing real provider files/directories are preserved unless `--force` is passed.

Use `--output <dir>` when the canonical source should be written somewhere other than `.agent-sync` / `~/.agent-sync`:

```bash
cc-hub migrate command .claude/commands/review.md \
  --output Project/.agent-sync \
  --scope global \
  --targets all \
  --force
```

With `--output`, the destination root is `<dir>/skills`, `<dir>/rules`, and `<dir>/agents`. Relative output paths resolve from the project directory. `--scope` still controls where provider outputs are published: `project` writes project provider links/files, `global` writes global provider links/files, and those outputs point to or are generated from the custom root.

### `skill` / `command` / `rule` / `hook` / `agent` — Provider linking

Install skills, rules, hooks, and agents via `.agent-sync` so the same source can be linked or generated for Claude Code and Codex. Commands remain Claude Code `.md` links because Codex has no matching command artifact.

Skills are portable folders with `SKILL.md`, so cc-hub symlinks the whole canonical skill directory:

```text
.agent-sync/skills/<name>        # project scope
~/.agent-sync/skills/<name>      # global scope
.claude/skills/<name>            # Claude project target
.agents/skills/<name>            # Codex project target
~/.claude/skills/<name>          # Claude global target
~/.agents/skills/<name>          # Codex global target
```

Agents use one editable source and generated provider-native files:

```text
.agent-sync/agents/<name>/agent.yaml
.agent-sync/agents/<name>/prompt.md
.agent-sync/agents/<name>/dist/claude.md
.agent-sync/agents/<name>/dist/codex.toml
.claude/agents/<name>.md
.codex/agents/<name>.toml
```

`agent create` writes the canonical source, builds the selected provider files, then links them to the selected scope. In project scope, Codex agents are published to `.codex/agents/<name>.toml`.

`agent.yaml` model values `haiku`, `sonnet`, `opus`, and Claude model IDs are Claude-only and are omitted from generated Codex TOML. OpenAI canonical IDs with Codex support are rendered as Codex-native names.

Rules use canonical Markdown sources, Claude symlinks, and generated Codex blocks:

```text
.agent-sync/rules/<name>.md             # project canonical rule
~/.agent-sync/rules/<namespace>/<name>.md # global canonical rule
.claude/rules/<name>.md                 # Claude project symlink to canonical rule
~/.claude/rules/<namespace>/<name>.md    # Claude global symlink to canonical rule
AGENTS.md                               # generated project Codex rule block
~/.codex/AGENTS.md                      # generated global Codex rule block
```

Claude reads the canonical file through the `.claude/rules` symlink, so `paths:` frontmatter is preserved without copying. Codex has no equivalent path-scoped rules mechanism, so cc-hub renders paths as textual "When modifying ..." guidance inside the managed `AGENTS.md` block. Edit `.agent-sync/rules` / `~/.agent-sync/rules`, not provider outputs.

Run `cc-hub rule repair --dry-run` before repairing rules. `rule build` and `rule link` without `--force` preserve conflicting local Claude rule files, but non-dry-run `rule repair` is intentionally forceful: it may replace conflicting Claude rule files or symlinks while converting legacy copies to canonical agent-sync symlinks; inspect [`.claude/rules`](.claude/rules) and [`.agent-sync/rules`](.agent-sync/rules) before running without `--dry-run`.

Hooks use a distinct canonical source directory and merge into user-level provider hook configs:

```text
.agent-sync/hooks/<name>/session-start.sh  # project canonical hook
~/.agent-sync/hooks/<name>/session-start.sh # global canonical hook
~/.claude/settings.json                    # Claude hooks.SessionStart merge target
~/.codex/hooks.json                        # Codex hooks.SessionStart merge target
```

`hook link` supports source directories such as `projects/core/kit/hooks/workflow-router/`. The hook source should contain `session-start.sh`, `hook.sh`, or `<name>.sh`; cc-hub configures a portable `bash '<canonical-script>'` `SessionStart` command for Claude and Codex. Config writes are idempotent and preserve existing `PreToolUse`, `Stop`, and unrelated `SessionStart` hooks. Subagents/workers do not automatically inherit a parent session's hook-injected routing context; briefs must copy the active routing instruction or re-detect the target repo.

```bash
# Skills
cc-hub skill link ./my-skill --scope global --targets all
cc-hub skill link ./my-skill --scope project --targets claude,codex
cc-hub skill link ./my-skill --scope project --targets all --agent-sync-root .agent-sync.local
cc-hub skill status --scope all --targets all
cc-hub skill repair --scope project --targets all
cc-hub skill unlink my-skill --scope global --targets claude

# Commands (source = .md file)
cc-hub command link /path/to/project/.claude/commands/deploy.md
cc-hub command list
cc-hub command unlink deploy.md

# Rules (source = .md file, canonicalized into .agent-sync/rules)
cc-hub rule link ./rules/api.md --scope project --targets all
cc-hub rule build --scope project --targets all --agent-sync-root .agent-sync.local
cc-hub rule link .agent-sync/rules/api.md --scope global --targets all --namespace project-x
cc-hub rule build --scope all --targets all
cc-hub rule list
cc-hub rule status --scope all --targets all
cc-hub rule repair --scope project --targets all
cc-hub rule unlink api --scope project --targets all

# Hooks (source = directory or script with SessionStart shell entry)
cc-hub hook link ./projects/core/kit/hooks/workflow-router --scope global --targets all
cc-hub hook list --scope global
cc-hub hook status --scope all --targets all
cc-hub hook repair --scope global --targets all --dry-run
cc-hub hook unlink workflow-router --scope global --targets claude

# Agents
cc-hub agent create reviewer --scope project --targets all
cc-hub agent create local-reviewer --scope project --targets codex
cc-hub agent link local-reviewer --scope project --targets all --agent-sync-root .agent-sync.local
cc-hub agent build reviewer --scope project --targets all
cc-hub agent link reviewer --scope project --targets all
cc-hub agent status --scope all --targets all
cc-hub agent repair --scope project --targets all
cc-hub agent unlink reviewer --scope global --targets claude
```

Common options:

```bash
--scope project|global|all
--targets claude|codex|all
--agent-sync-root <dir> # skill/agent/rule/hook: custom canonical root for agent-sync sources
--output <dir> # migrate only: custom agent-sync root for canonical writes
--force
--json
--dry-run     # migrate/repair/clean only
```

Use `--name` to give a skill symlink a different canonical name than the source:

```bash
cc-hub skill link ./my-skill --name custom-skill-name
cc-hub command link ./test.md --name my-command.md    # ~/.claude/commands/my-command.md
cc-hub rule link ./local-rule.md --name project-rules.md --scope project --targets all
```

For commands and rule names, the `.md` extension is added automatically if omitted.

All provider installs use symlinks where the provider supports symlinks. Skills link to canonical skill directories; agents link to generated provider-native files; Claude rules link to canonical `.agent-sync/rules`; Codex rules generate provider-facing `AGENTS.md` blocks. Hooks keep a canonical source and merge provider JSON config entries because Claude/Codex hook configuration is JSON, not a provider filesystem target.

### `config` — Preferences

```bash
cc-hub config set purge.days 30       # retention period
cc-hub config set digest.channel telegram
cc-hub config show                    # display config
```

### `models` — Model registry

Browse available models filtered by provider or type.

```bash
cc-hub models list                          # all models
cc-hub models list --provider copilot       # models available on GitHub Copilot
cc-hub models list --provider openrouter    # models available on OpenRouter
cc-hub models list --provider poyo          # models available on Poyo
cc-hub models list --type decision          # Jev pinned and latest alias
cc-hub models list --type text              # text models only
cc-hub models list --type image             # image models only
cc-hub models list --type video             # video models only
cc-hub models list --provider copilot --type text  # combine filters
```

Providers: `openrouter`, `copilot`, `poyo`, `codex`. Types: `text`, `image`, `video`, `audio`, `music`, `decision`.

All models across cc-hub use **canonical IDs** (OpenRouter format): `provider/model-name` (e.g. `openai/gpt-5.4`, `openai/gpt-oss-120b`, `z-ai/glm-5.2`, `anthropic/claude-sonnet-4.6`). OpenRouter text models show `max-effort:<level>` when cc-hub knows their documented reasoning limit.

## Artifacts

When a log includes a file (`--file`), cc-hub copies it to `~/.claude-hub/artifacts/` with a normalized name:

```
~/.claude-hub/artifacts/
  2026-03-12_001_tech-watch-nextjs.md
  2026-03-12_002_pr-summary.md
```

Format: `YYYY-MM-DD_<seq>_<slug>.md`

## Telegram notifications

- **Short message**: each digest sends a condensed summary generated by Claude
- **Attachments**: artifacts from `--important` logs are sent as documents via `sendDocument`
- The digest is **intentional** — no noise, only what was explicitly logged

## Auto-purge

- Events are deleted after N days (configurable via `purge.days`, default: 30)
- Associated artifacts are deleted alongside
- Digests are kept indefinitely
- Purge runs automatically on each digest send

## Database schema

```sql
CREATE TABLE events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  source        TEXT DEFAULT 'claude-code',
  type          TEXT NOT NULL,
  status        TEXT NOT NULL,
  title         TEXT NOT NULL,
  details       TEXT,
  artifact_path TEXT,
  important     BOOLEAN DEFAULT 0
);

CREATE TABLE digests (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  period_start DATETIME,
  period_end   DATETIME,
  content      TEXT,
  sent_to      TEXT
);
```

## Local file structure

```
~/.claude-hub/
  activity.db        # SQLite database
  config.json        # general preferences
  artifacts/         # long-form content attached to logs
  .env               # provider & model defaults (no secrets)
  prompts/           # per-model prompting guides
```

## Project structure

```
cc-hub/
  bin/
    cc-hub.js              # entry point (shebang)
  src/
    cli.js                 # Commander setup
    commands/
      log.js               # log add, list, get
      digest.js            # digest preview, send
      schedule.js          # schedule set, remove, status
      config.js            # config set, show
      ask.js               # LLM via OpenRouter
      imagine.js           # image generation via Poyo
      video.js             # video generation via Poyo
      music.js             # music generation via Poyo
      transcribe.js        # audio transcription via Soniox
      prompt.js            # prompting guides (get, init, list, update)
      sync.js              # agent-sync run/status/repair/clean + Turso db sync
      migrate.js           # import Claude/Codex folders into agent-sync
      skill.js             # portable skill link, list, status, repair, unlink
      command.js           # command link, list, unlink
      rule.js              # portable rule build, link, list, status, repair, unlink
      hook.js              # portable SessionStart hook link, list, status, repair, unlink
      agent.js             # portable agent create, build, link, status, repair
      claude-link.js       # legacy Claude command/rule linking logic
    db/
      index.js             # libsql client + Turso embedded replicas
    services/
      artifacts.js         # artifact file management
      creds.js             # credential reading via creds CLI
      digest-generator.js  # digest generation via Claude
      env.js               # .env file parser (provider/model defaults)
      image-input.ts       # resolve local image path or URL for Poyo API
      agent-sync.js        # provider registry, agent rendering, symlink sync
      agent-sync-rules.js  # portable rule generation for Claude and Codex
      agent-sync-hooks.js  # portable SessionStart hook config merge for Claude and Codex
      agent-sync-migrate.js # provider folder migration to agent-sync
      openrouter.js        # OpenRouter API client
      soniox.js            # Soniox transcription API client
      purge.js             # automatic purge
      telegram.js          # Telegram API (message + document)
    utils/
      format.js            # icons and terminal formatting
      paths.js             # ~/.claude-hub/ paths
  package.json
```

## Roadmap

| Phase       | Content                                    | Status      |
| ----------- | ------------------------------------------ | ----------- |
| **Phase 1** | `log`, `digest`, `schedule`, `config`      | done        |
| **Phase 2** | `ask` via OpenRouter                       | done        |
| **Phase 3** | `imagine`, `video`, `transcribe`           | done        |
| **Phase 4** | `prompt` (get, list, delete)               | done        |
| **Phase 5** | Turso Cloud sync (multi-machine)           | done        |
| **Phase 6** | `skill`, `command`, `rule`, `agent` (global linking) | done        |
| **Phase 7** | `copilot` via GitHub Copilot CLI           | done        |
| **Phase 8** | `models` registry, `motion` control        | done        |
| **Phase 9** | Full Poyo model catalog, `music generate`  | done        |
| **Phase 10** | `codex` via OpenAI Codex CLI              | done        |

## Usage with Claude Code

cc-hub is designed to be called by AI agents. Example usage in a Claude Code workflow:

```bash
# An agent performs a tech watch and logs the result
cc-hub log add \
  --type tech_watch \
  --title "Next.js tech watch" \
  --status success \
  --details "12 articles analyzed" \
  --file ./result.md \
  --important

# In the morning, the digest is sent automatically
cc-hub digest send
```

## License

MIT
