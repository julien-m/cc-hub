---
name: cc-hub
description: >
  CLI IA global installé sur cette machine. Auto-invoquer quand : utilisation
  de cc-hub, log d'activité terminée, envoi Telegram, génération image/vidéo/
  musique, requête LLM (ask/copilot/codex), transcription audio, gestion de
  skills/rules/agents Claude Code et Codex, ou chargement prompt guide avant
  appel LLM.
allowed-tools: Bash
---

# cc-hub — CLI IA global

Tous les modèles : **format canonical ID** `provider/model-name` (ex: `openai/gpt-5.4`, `anthropic/claude-sonnet-4.6`).
Lister les modèles : `cc-hub models list [-p openrouter|copilot|poyo|codex] [-t text|image|video|audio|music]`
**Listes complètes de modèles par commande** : **Read** [`references/models.md`](references/models.md)

## Commandes

### Logging d'activité

Après toute tâche significative (deploy, refactor, bug fix, tech watch, etc.) :

```bash
cc-hub log add \
  -t <type> \
  -n "Description courte" \
  -s success|failed|partial \
  -d "Détails optionnels" \  # optionnel
  -f ./artifact.md \         # optionnel
  -i                         # optionnel — inclus dans le digest Telegram
```

Types : `tech_watch`, `pull_request`, `code_refactor`, `bug_fix`, `code_review`, `test_run`, `deploy`, `documentation`, `data_analysis`, `image_gen`, `video_gen`, `transcription`, `prompt_used`, `backup`, `error`, `other`

### Telegram

```bash
cc-hub telegram send "Message"
cc-hub telegram send-file photo.png -c "Légende"
```

### Ask (OpenRouter / Poyo)

```bash
cc-hub ask "Question" -m anthropic/claude-sonnet-4.6
cc-hub ask "Question" -m openai/gpt-oss-120b
cc-hub ask "Question" -m z-ai/glm-5.2
cc-hub ask "Explique ce code" -f fichier.ts
cc-hub ask "Compare" -f src/a.ts -f src/b.ts
cat fichier.ts | cc-hub ask "Explique"
cc-hub ask "JSON" -j -m openai/gpt-5.4
cc-hub ask "Structured" -s ./schema.json
cc-hub ask "Deep" -e high -m openai/gpt-5.4
cc-hub ask "Max effort" -e max -m z-ai/glm-5.2
cc-hub ask "Question" -p poyo -m gemini-3-flash-preview
```

Options : `-j/--json` (libre), `-s/--schema <json_or_file>` (contraint), `-e/--effort minimal|low|medium|high|xhigh|max`. L'effort est mappé vers l'effort OpenRouter supporté le plus proche pour le modèle choisi.

### Image (Poyo)

```bash
cc-hub imagine "Description" -o /tmp/image.png
cc-hub imagine "Description" --size 16:9 --resolution 2K -o rendu.png
cc-hub imagine "Watercolor" -i ./photo.png -o result.png   # image de référence
cc-hub imagine "Blend" -i ref1.png -i ref2.png -o blend.png # `-i` répétable → `image_urls` ordonné
```

`-o` obligatoire. Chemin relatif/absolu respecté ; nom seul → `~/.claude-hub/artifacts/`.
Modèles : **Read** [`references/models.md`](references/models.md)

### Vidéo (Poyo)

```bash
cc-hub video "Description" -o clip.mp4
cc-hub video "Description" -d 10 -a 9:16 -o short.mp4
cc-hub video "Walking" -i ./portrait.jpg -o animated.mp4   # image-to-video
cc-hub video "Fusion" -i a.png -i b.png -o fusion.mp4      # `-i` répétable
```

`-o` obligatoire. Durée 3-15s (défaut 5). Ratios : `16:9`, `1:1`, `9:16`.
Modèles : **Read** [`references/models.md`](references/models.md)

### Motion Control

```bash
cc-hub motion "Dance" -i ./character.png -v ./dance.mp4 -o result.mp4
cc-hub motion "Walk" -i front.png -i side.png -v ref.mp4 -o walk.mp4  # `-i` répétable (≥1 requis)
```

`-i` (image, répétable, ≥1 requis) et `-v` (vidéo de mouvement, scalaire) obligatoires. `-c/--character-orientation character|video`.

### Codex CLI (OpenAI)

```bash
cc-hub codex "Question"
cc-hub codex "Analyse" -f src/api.ts
cc-hub codex "Deep" -e high
cc-hub codex "Max reasoning" -e max
cc-hub codex review                   # review uncommitted changes
cc-hub codex review -b main
```

Défaut : `openai/gpt-5.5`. Auth via `codex login`. Options : `-e/--effort minimal|low|medium|high|xhigh|max` (mappé vers l'effort connu du modèle), `-s/--sandbox read-only|workspace-write`, `-x/--schema <path>`, `-p/--persist` (create a non-ephemeral thread; no automatic resume).
Modèles : **Read** [`references/models.md`](references/models.md)

#### Mode interactif machine (`-i`)

Protocol JSON lines pour scripts et agents IA. **Jamais utilisé directement par un humain.**

- stdin : une ligne par prompt ; `exit`/`quit`/`q` ou EOF (Ctrl-D) ferme la session
- stdout : une ligne JSON par événement

| Événement | JSON stdout |
|-----------|-------------|
| Session prête | `{"ready":true}` |
| Réponse | `{"response":"..."}` |
| Erreur (fatale, session terminée) | `{"error":"..."}` |

- stderr : vide en fonctionnement normal
- Exit codes : 0 (OK), 1 (erreur générale), 3 (auth/non trouvé), 4 (timeout)

**Exemple Python :**

```python
import subprocess, json

proc = subprocess.Popen(
    ['cc-hub', 'codex', '-i'],
    stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True,
)

# Attendre le signal ready avant d'envoyer le premier prompt
json.loads(proc.stdout.readline())  # {"ready": true}

proc.stdin.write('Explain quicksort\n')
proc.stdin.flush()
result = json.loads(proc.stdout.readline())  # {"response": "..."}
print(result['response'])

proc.stdin.write('exit\n')
proc.stdin.flush()
proc.wait()
```

Avec prompt initial : `cc-hub codex -i "first prompt"` → `{"ready":true}` puis `{"response":"..."}` avant la boucle.
Avec thread persistant : `cc-hub codex -i -p`

### Copilot CLI (GitHub)

```bash
cc-hub copilot "Question" -m anthropic/claude-sonnet-4.6
cc-hub copilot "Analyse" -f src/a.ts
```

Accès filesystem local. Idéal pour tâches non urgentes (cron, batch).

### Musique (Poyo)

```bash
cc-hub music generate "Upbeat jazz" -o jazz.mp3
```

### Transcription (Soniox)

```bash
cc-hub transcribe ./fichier.mp3   # → stdout
```

### Skills / Commands / Rules / Agents

```bash
cc-hub migrate <folder> --from claude|codex [--scope project|global|all] [--targets claude|codex|all] [--output <dir>] [--force] [--dry-run]
cc-hub migrate skill <path> [--scope project|global|all] [--targets claude|codex|all] [--output <dir>] [--force] [--dry-run]
cc-hub migrate agent <path> --from claude|codex [--scope project|global|all] [--targets claude|codex|all] [--output <dir>] [--force] [--dry-run]
cc-hub migrate command <path> [--scope project|global|all] [--targets claude|codex|all] [--output <dir>] [--force] [--dry-run]
cc-hub migrate rule <path> [--scope project|global|all] [--targets claude|codex|all] [--output <dir>] [--force] [--dry-run]
cc-hub migrate rules <folder> [--scope project|global|all] [--targets claude|codex|all] [--output <dir>] [--force] [--dry-run]
cc-hub skill link <path> [--scope project|global|all] [--targets claude|codex|all] [-n <name>]
cc-hub skill list / status / repair / unlink <name>
cc-hub command link <path> [-n <name>]
cc-hub rule link <path> [--scope project|global|all] [--targets claude|codex|all] [-n <name>] [--namespace <ns>] [--force]
cc-hub rule build|list|status|repair [--scope project|global|all] [--targets claude|codex|all]
cc-hub rule unlink <name> [--scope project|global|all] [--targets claude|codex|all]
cc-hub hook link <path> [--scope project|global|all] [--targets claude|codex|all] [-n <name>] [--force]
cc-hub hook list [--scope project|global|all]
cc-hub hook status [--scope project|global|all] [--targets claude|codex|all]
cc-hub hook repair [--scope project|global|all] [--targets claude|codex|all] [--dry-run]
cc-hub hook unlink <name> [--scope project|global|all] [--targets claude|codex|all]
cc-hub agent create <name> [--scope project|global] [--targets claude|codex|all]
cc-hub agent build <name> [--scope project|global|all] [--targets claude|codex|all]
cc-hub agent link <name> [--scope project|global|all] [--targets claude|codex|all]
cc-hub agent list / status / repair / unlink <name>
```

`agent create` writes `.agent-sync/agents/<name>`, builds selected provider files, and links them immediately. Project-scoped Codex agents go to `.codex/agents/<name>.toml`; global Codex agents go to `~/.codex/agents/<name>.toml`.

Agent-sync paths:

- skills: `.agent-sync/skills/<name>` or `~/.agent-sync/skills/<name>`
- rules: `.agent-sync/rules/<name>.md` or `~/.agent-sync/rules/<namespace>/<name>.md`
- hooks: `.agent-sync/hooks/<name>/session-start.sh` or `~/.agent-sync/hooks/<name>/session-start.sh`
- agents: `.agent-sync/agents/<name>/{agent.yaml,prompt.md,dist/}` or `~/.agent-sync/agents/<name>/...`
- Claude skills: `.claude/skills` / `~/.claude/skills`
- Codex skills: `.agents/skills` / `~/.agents/skills`
- Claude rules: symlinked `.claude/rules/**/*.md` / `~/.claude/rules/**/*.md` pointing to canonical rules
- Codex rules: generated managed blocks in `AGENTS.md` / `~/.codex/AGENTS.md`
- Claude agents: `.claude/agents/*.md` / `~/.claude/agents/*.md`
- Codex agents: `.codex/agents/*.toml` / `~/.codex/agents/*.toml`
- Claude hooks: merged `hooks.SessionStart` command entries in `~/.claude/settings.json`
- Codex hooks: merged `hooks.SessionStart` command entries in `~/.codex/hooks.json`

Agent `model` behavior: `haiku`, `sonnet`, `opus`, and Claude model IDs are Claude-only and omitted from generated Codex TOML. OpenAI canonical IDs with Codex support render as Codex-native names.

Migration behavior:

- `cc-hub migrate .claude --from claude` imports Claude skills, agents, commands, and rules into `.agent-sync`.
- `cc-hub migrate .codex --from codex` imports Codex TOML agents into `.agent-sync`.
- Claude commands (`.claude/commands/*.md`) become skills (`.agent-sync/skills/<name>/SKILL.md`) because Codex has no command artifact.
- Claude rules (`.claude/rules/**/*.md`) become canonical rules (`.agent-sync/rules/**/*.md`), then create Claude `.claude/rules` symlinks and Codex `AGENTS.md` blocks.
- `--output <dir>` writes canonical migrated assets to a custom agent-sync root (`<dir>/skills`, `<dir>/rules`, `<dir>/agents`). Relative paths resolve from the project directory. `--scope` still controls project/global provider outputs, which point to or are generated from the custom root.
- `--dry-run` reports planned writes without changing files.
- Existing real provider files/directories are preserved unless `--force` is passed.
- For rules, run `cc-hub rule repair --dry-run` first. `rule build` and `rule link` without `--force` preserve conflicting local Claude rule files, but non-dry-run `rule repair` may replace conflicting Claude rule files or symlinks while converting legacy copies to canonical agent-sync symlinks; inspect [`.claude/rules`](../../../.claude/rules) and [`.agent-sync/rules`](../../rules) before running without `--dry-run`.
- Hook sources are distinct runtime artifacts under `kit/hooks` / `.agent-sync/hooks`, not skills. `hook link` expects `session-start.sh`, `hook.sh`, or `<name>.sh`, then adds a portable `bash '<canonical-script>'` SessionStart command. It preserves existing `PreToolUse`, `Stop`, and unrelated `SessionStart` entries and avoids duplicate commands. Subagents/workers do not automatically inherit parent SessionStart context; briefs must copy the active routing instruction or re-detect the target repo.

### Digest

```bash
cc-hub digest preview [-s 2026-03-20]
cc-hub digest files [-i]
cc-hub schedule set 08:00 / show / unset
```

### Config / Sync / Prompts

```bash
cc-hub config show
cc-hub config set prompt.default.text "openai/gpt-5.4"
cc-hub sync run / status / repair / clean --scope project|global|all --targets claude|codex|all
cc-hub sync db / db-status   # sync DB Turso legacy
cc-hub prompt get -m openai/gpt-5.4
cc-hub prompt get -t image|video|audio|music
cc-hub prompt list [-t image|video|audio|music]
cc-hub prompt delete -m openai/gpt-5.4
```

## Chargement du prompt guide avant appel LLM

Avant chaque commande contactant un LLM, charger le guide du modèle :

1. `cc-hub prompt get -m <model>` (ou `-t <type>`)
2. Lire le contenu et optimiser le prompt
3. Si exit code 2 (inexistant) → générer avec `/prompt-guide --model <model>` puis recommencer

| Commande | Appel prompt |
|----------|-------------|
| `imagine` | `cc-hub prompt get --type image` |
| `video` | `cc-hub prompt get --type video` |
| `ask/copilot --model X` | `cc-hub prompt get --model X` |
| `transcribe` | `cc-hub prompt get --type audio` |
| `music` | `cc-hub prompt get --type music` |

Cache de session : charger une fois par modèle, réutiliser pour les appels suivants.

## Règles

- Pas de secrets dans `--details` ou `--title`
- `--important` avec parcimonie (→ Telegram)
- stdout de `ask/copilot/imagine/video/music/transcribe` exploitable en pipe
- Secrets via `creds` uniquement (jamais de clés en dur)
