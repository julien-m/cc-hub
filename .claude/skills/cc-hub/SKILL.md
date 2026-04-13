---
name: cc-hub
description: >
  CLI IA global installé sur cette machine. Auto-invoquer quand : utilisation
  de cc-hub, log d'activité terminée, envoi Telegram, génération image/vidéo/
  musique, requête LLM (ask/copilot/codex), transcription audio, gestion de
  skills/rules/agents Claude Code, ou chargement prompt guide avant appel LLM.
allowed-tools: Bash
---

# cc-hub — CLI IA global

Tous les modèles : **format canonical ID** `provider/model-name` (ex: `openai/gpt-5.4`, `anthropic/claude-sonnet-4.6`).
Lister les modèles : `cc-hub models list [--provider openrouter|copilot|poyo|codex] [--type text|image|video|audio|music]`
**Listes complètes de modèles par commande** : **Read** [`references/models.md`](references/models.md)

## Commandes

### Logging d'activité

Après toute tâche significative (deploy, refactor, bug fix, tech watch, etc.) :

```bash
cc-hub log add \
  --type <type> \
  --title "Description courte" \
  --status success|failed|partial \
  --details "Détails optionnels" \
  --file ./artifact.md \    # optionnel
  --important               # optionnel — inclus dans le digest Telegram
```

Types : `tech_watch`, `pull_request`, `code_refactor`, `bug_fix`, `code_review`, `test_run`, `deploy`, `documentation`, `data_analysis`, `image_gen`, `video_gen`, `transcription`, `prompt_used`, `backup`, `error`, `other`

### Telegram

```bash
cc-hub telegram send "Message"
cc-hub telegram send-file photo.png --caption "Légende"
```

### Ask (OpenRouter / Poyo)

```bash
cc-hub ask "Question" --model anthropic/claude-sonnet-4.6
cc-hub ask "Explique ce code" -f fichier.ts
cc-hub ask "Compare" -f src/a.ts -f src/b.ts
cat fichier.ts | cc-hub ask "Explique"
cc-hub ask "JSON" --json --model openai/gpt-5.4
cc-hub ask "Structured" --schema ./schema.json
cc-hub ask "Deep" --effort high --model openai/gpt-5.4
cc-hub ask "Question" --provider poyo --model gemini-3-flash-preview
```

Options : `--json` (libre), `--schema <json_or_file>` (contraint), `--effort low|medium|high`

### Image (Poyo)

```bash
cc-hub imagine "Description" -o /tmp/image.png
cc-hub imagine "Description" --size 16:9 --resolution 2K -o rendu.png
cc-hub imagine "Watercolor" -i ./photo.png -o result.png   # image de référence
```

`-o` obligatoire. Chemin relatif/absolu respecté ; nom seul → `~/.claude-hub/artifacts/`.
Modèles : **Read** [`references/models.md`](references/models.md)

### Vidéo (Poyo)

```bash
cc-hub video "Description" -o clip.mp4
cc-hub video "Description" --duration 10 --aspect-ratio 9:16 -o short.mp4
cc-hub video "Walking" -i ./portrait.jpg -o animated.mp4   # image-to-video
```

`-o` obligatoire. Durée 3-15s (défaut 5). Ratios : `16:9`, `1:1`, `9:16`.
Modèles : **Read** [`references/models.md`](references/models.md)

### Motion Control

```bash
cc-hub motion "Dance" -i ./character.png -v ./dance.mp4 -o result.mp4
```

`-i` (image) et `-v` (vidéo de mouvement) obligatoires. `--character-orientation character|video`.

### Codex CLI (OpenAI)

```bash
cc-hub codex "Question"
cc-hub codex "Analyse" -f src/api.ts
cc-hub codex "Deep" --effort high
cc-hub codex --interactive            # interactive REPL session
cc-hub codex --interactive "prompt"   # start session with initial prompt
cc-hub codex --interactive --persist  # create a non-ephemeral thread (no automatic resume of prior sessions)
cc-hub codex review                  # review uncommitted changes
cc-hub codex review --base main
```

Auth via `codex login`. Options : `--effort low|medium|high`, `--sandbox read-only|workspace-write`, `--schema <path>`, `--interactive`, `--persist` (create a non-ephemeral thread; no automatic resume).
Modèles : **Read** [`references/models.md`](references/models.md)

### Copilot CLI (GitHub)

```bash
cc-hub copilot "Question" --model anthropic/claude-sonnet-4.6
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
cc-hub skill link <path> [--name <name>]   # installer globalement
cc-hub skill list / unlink <name>
cc-hub command link <path> [--name <name>]
cc-hub rule link <path> [--name <name>]
cc-hub agent link <path> [--name <name>]
cc-hub agent list / unlink <name>
```

### Digest

```bash
cc-hub digest preview [--since 2026-03-20]
cc-hub digest files [--important]
cc-hub schedule set 08:00 / show / unset
```

### Config / Sync / Prompts

```bash
cc-hub config show
cc-hub config set prompt.default.text "openai/gpt-5.4"
cc-hub sync run / status
cc-hub prompt get --model openai/gpt-5.4
cc-hub prompt get --type image|video|audio|music
cc-hub prompt list
cc-hub prompt delete --model openai/gpt-5.4
```

## Chargement du prompt guide avant appel LLM

Avant chaque commande contactant un LLM, charger le guide du modèle :

1. `cc-hub prompt get --model <model>` (ou `--type <type>`)
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
