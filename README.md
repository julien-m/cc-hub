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
- macOS (Keychain via [`creds`](https://github.com/anthropics/keychain-creds))

### Credentials setup

API keys are stored and read exclusively via the `creds` CLI. No token is ever stored in plaintext.

```bash
creds set TELEGRAM_BOT_TOKEN
creds set TELEGRAM_CHAT_ID
creds set ANTHROPIC_API_KEY
creds set OPENROUTER_API_KEY
creds set REPLICATE_API_KEY

# Optional — Turso Cloud sync (multi-machine)
creds set TURSO_DATABASE_URL
creds set TURSO_AUTH_TOKEN
```

| Usage                        | Creds key              | Required |
| ---------------------------- | ---------------------- | -------- |
| Telegram Bot Token           | `TELEGRAM_BOT_TOKEN`   | yes      |
| Telegram Chat ID             | `TELEGRAM_CHAT_ID`     | yes      |
| Anthropic API Key (digest)   | `ANTHROPIC_API_KEY`    | yes      |
| OpenRouter API Key (ask)     | `OPENROUTER_API_KEY`   | yes      |
| Replicate API Key (media)    | `REPLICATE_API_KEY`    | yes      |
| Turso Database URL           | `TURSO_DATABASE_URL`   | no       |
| Turso Auth Token             | `TURSO_AUTH_TOKEN`     | no       |

### Provider & model defaults

Create `~/.claude-hub/.env` to set default providers and models (no secrets here):

```env
# LLM — via OpenRouter
LLM_PROVIDER=openrouter
LLM_MODEL=anthropic/claude-sonnet-4.6

# Copilot — via GitHub Copilot CLI
COPILOT_MODEL=openai/gpt-5.4

# Codex — via OpenAI Codex CLI
CODEX_MODEL=openai/gpt-5.5

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
| `--effort <level>` | Reasoning effort level (models with extended thinking): `low`, `medium`, `high` |

Output goes to stdout. Silent by default (no auto-logging).

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
```

Default model: `openai/gpt-5.5`. Authentication is managed by the Codex CLI itself (`codex login`).

| Option | Description |
| --- | --- |
| `--model <model>` | Model canonical ID (default: `openai/gpt-5.4`) |
| `-f, --file <path>` | File or glob to inject as context in the prompt (repeatable) |
| `--effort <level>` | Reasoning effort level: `low`, `medium`, `high` |
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

Available Codex models: `openai/gpt-5.5`, `openai/gpt-5.4` (default), `openai/gpt-5.4-mini`, `openai/gpt-53-codex`, `openai/gpt-53-codex-spark`.

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

Sync your local SQLite database to Turso Cloud for multi-machine access. Without Turso credentials, cc-hub works in local-only mode — no data is lost.

```bash
cc-hub sync status    # check if Turso is configured
cc-hub sync run       # trigger a manual sync
```

When Turso is configured, an initial sync happens automatically on startup.

### `skill` / `command` / `rule` / `agent` — Claude Code global linking

Install Claude Code skills, commands, rules, and agents globally via symlinks.

```bash
# Skills (source = directory with SKILL.md)
cc-hub skill link .claude/skills/prompt-guide     # by path
cc-hub skill link prompt-guide                     # by name (resolved in .claude/skills/)
cc-hub skill list                                  # list global skills
cc-hub skill unlink prompt-guide                   # remove

# Commands (source = .md file)
cc-hub command link /path/to/project/.claude/commands/deploy.md
cc-hub command list
cc-hub command unlink deploy.md

# Rules (source = .md file)
cc-hub rule link /path/to/project/.claude/rules/no-console.md
cc-hub rule list
cc-hub rule unlink no-console.md

# Agents (source = .md file)
cc-hub agent link /path/to/project/.claude/agents/my-agent.md
cc-hub agent list
cc-hub agent unlink my-agent.md
```

Use `--name` to give the symlink a different name than the source:

```bash
cc-hub command link ./test.md --name my-command.md    # ~/.claude/commands/my-command.md
cc-hub rule link ./local-rule.md --name project-rules.md
cc-hub skill link ./my-skill --name custom-skill-name
cc-hub agent link ./agent.md --name custom-agent.md   # ~/.claude/agents/custom-agent.md
```

For commands, rules, and agents, the `.md` extension is added automatically if omitted.

All installs use symlinks — the source stays in your project and updates are reflected immediately.

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
cc-hub models list --type text              # text models only
cc-hub models list --type image             # image models only
cc-hub models list --type video             # video models only
cc-hub models list --provider copilot --type text  # combine filters
```

Providers: `openrouter`, `copilot`, `poyo`, `codex`. Types: `text`, `image`, `video`, `audio`, `music`.

All models across cc-hub use **canonical IDs** (OpenRouter format): `provider/model-name` (e.g. `openai/gpt-5.4`, `anthropic/claude-sonnet-4.6`).

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
      transcribe.js        # audio transcription via Replicate
      prompt.js            # prompting guides (get, init, list, update)
      sync.js              # Turso Cloud sync (run, status)
      skill.js             # skill link, list, unlink
      command.js           # command link, list, unlink
      rule.js              # rule link, list, unlink
      agent.js             # agent link, list, unlink
      claude-link.js       # shared linking logic
    db/
      index.js             # libsql client + Turso embedded replicas
    services/
      artifacts.js         # artifact file management
      creds.js             # credential reading via creds CLI
      digest-generator.js  # digest generation via Claude
      env.js               # .env file parser (provider/model defaults)
      image-input.ts       # resolve local image path or URL for Poyo API
      openrouter.js        # OpenRouter API client
      replicate.js         # Replicate API client (predict + poll + download)
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
