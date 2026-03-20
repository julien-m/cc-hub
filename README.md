# cc-hub

AI Swiss-army knife CLI — centralizes execution logs from your AI agents, sends a daily digest to Telegram, and exposes multi-model capabilities.

Runs entirely locally, zero server. Callable from any directory.

## Installation

```bash
npm install
npm link
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
LLM_MODEL=anthropic/claude-sonnet-4-20250514

# Image — via Replicate
IMAGE_PROVIDER=replicate
IMAGE_MODEL=black-forest-labs/flux-1.1-pro

# Video — via Replicate
VIDEO_PROVIDER=replicate
VIDEO_MODEL=minimax/video-01

# Transcription — via Replicate
TRANSCRIBE_PROVIDER=replicate
TRANSCRIBE_MODEL=openai/whisper
```

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
cc-hub ask "Explain this bug" --model openai/gpt-4o
cc-hub ask "Translate to English" --model google/gemini-2.5-pro
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

Output goes to stdout. Silent by default (no auto-logging).

### `imagine` — Image generation

```bash
cc-hub imagine "Dashboard dark mode minimal"
cc-hub imagine "Logo for project X" --model stability-ai/sdxl
cc-hub imagine "Hero banner" -o banner.png
```

Downloads the image to `~/.claude-hub/artifacts/` and prints the path to stdout. Filenames are unique by default (include timestamp). Use `-o, --output <filename>` to specify a custom filename.

### `video` — Video generation

```bash
cc-hub video "Product demo 10 seconds"
cc-hub video "Animated logo loop" --model minimax/video-01
cc-hub video "Intro clip" -o intro.mp4
```

Downloads the video to `~/.claude-hub/artifacts/` and prints the path to stdout. Filenames are unique by default (include timestamp). Use `-o, --output <filename>` to specify a custom filename.

### `transcribe` — Audio to text

```bash
cc-hub transcribe ./meeting.mp3
cc-hub transcribe ./meeting.mp3 --model openai/whisper
```

Outputs the transcription to stdout.

### `copilot` — LLM via GitHub Models (Copilot)

LLM access via GitHub Models REST API. Ideal for background/cron tasks.

```bash
cc-hub copilot "Summarize this text"
cc-hub copilot "Explain this code" -f src/cli.ts
cc-hub copilot "Compare these files" -f src/a.ts -f src/b.ts
cat file.ts | cc-hub copilot "Analyze"
cc-hub copilot "Question" --model openai/gpt-4.1
```

Default model: `gpt-4.1-mini`. Token is retrieved automatically via `gh auth token`.

Advanced options:

```bash
# Control creativity and length
cc-hub copilot "Summarize" --temperature 0.2 --max-tokens 200

# Free-form JSON response
cc-hub copilot "3 European capitals in JSON" --response-format '{"type":"json_object"}'

# Structured output with strict JSON schema
cc-hub copilot "3 European capitals" --response-format '{
  "type": "json_schema",
  "json_schema": {
    "name": "capitals",
    "strict": true,
    "schema": {
      "type": "object",
      "properties": {
        "capitals": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "country": { "type": "string" },
              "city": { "type": "string" }
            },
            "required": ["country", "city"],
            "additionalProperties": false
          }
        }
      },
      "required": ["capitals"],
      "additionalProperties": false
    }
  }
}'
# → {"capitals":[{"country":"France","city":"Paris"},{"country":"Germany","city":"Berlin"},...]}

# Reproducible output
cc-hub copilot "Translate to English" --seed 42
```

| Option | Description |
| --- | --- |
| `--model <model>` | Model ID in `publisher/name` format (default: `gpt-4.1-mini`) |
| `-f, --file <path>` | File or glob as context (repeatable) |
| `--temperature <0-1>` | Creativity (0 = deterministic, 1 = creative) |
| `--top-p <0-1>` | Nucleus sampling (alternative to temperature) |
| `--max-tokens <n>` | Max tokens in response |
| `--frequency-penalty <-2,2>` | Penalize repeated tokens |
| `--presence-penalty <-2,2>` | Encourage new topics |
| `--seed <n>` | Reproducible output |
| `--stop <seq>` | Stop sequence (repeatable) |
| `--response-format <json>` | `json_object` or `json_schema` with strict schema |
| `--tools <json>` | Function calling definitions |
| `--tool-choice <mode>` | `auto`, `required`, or `none` |

### `prompt` — Per-model prompting guides

Maintains a local collection of prompting guides (Markdown files). Claude Code calls `prompt get` at runtime to fetch the guide and craft optimal prompts autonomously.

```bash
cc-hub prompt get --model openai/gpt-4o         # display guide
cc-hub prompt init --model openai/gpt-4o        # generate guide via LLM
cc-hub prompt list                               # list available guides
cc-hub prompt update --model openai/gpt-4o      # refresh an existing guide
```

Guides are stored in `~/.claude-hub/prompts/<model-slug>.md`.

### `sync` — Turso Cloud sync

Sync your local SQLite database to Turso Cloud for multi-machine access. Without Turso credentials, cc-hub works in local-only mode — no data is lost.

```bash
cc-hub sync status    # check if Turso is configured
cc-hub sync run       # trigger a manual sync
```

When Turso is configured, an initial sync happens automatically on startup.

### `skill` / `command` / `rule` — Claude Code global linking

Install Claude Code skills, commands, and rules globally via symlinks.

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
```

Use `--name` to give the symlink a different name than the source:

```bash
cc-hub command link ./test.md --name my-command.md    # ~/.claude/commands/my-command.md
cc-hub rule link ./local-rule.md --name project-rules.md
cc-hub skill link ./my-skill --name custom-skill-name
```

For commands and rules, the `.md` extension is added automatically if omitted.

All installs use symlinks — the source stays in your project and updates are reflected immediately.

### `config` — Preferences

```bash
cc-hub config set purge.days 30       # retention period
cc-hub config set digest.channel telegram
cc-hub config show                    # display config
```

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
      imagine.js           # image generation via Replicate
      video.js             # video generation via Replicate
      transcribe.js        # audio transcription via Replicate
      prompt.js            # prompting guides (get, init, list, update)
      sync.js              # Turso Cloud sync (run, status)
      skill.js             # skill link, list, unlink
      command.js           # command link, list, unlink
      rule.js              # rule link, list, unlink
      claude-link.js       # shared linking logic
    db/
      index.js             # libsql client + Turso embedded replicas
    services/
      artifacts.js         # artifact file management
      creds.js             # credential reading via creds CLI
      digest-generator.js  # digest generation via Claude
      env.js               # .env file parser (provider/model defaults)
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
| **Phase 4** | `prompt` (init, get, list, update)         | done        |
| **Phase 5** | Turso Cloud sync (multi-machine)           | done        |
| **Phase 6** | `skill`, `command`, `rule` (global linking) | done        |

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
