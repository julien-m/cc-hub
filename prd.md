# PRD — cc-hub CLI

---

## Vision

Un CLI couteau suisse IA, appelable depuis n'importe où, qui centralise :
1. Les logs d'exécution des workflows IA avec pièces jointes (digest quotidien)
2. L'accès multi-modèles (LLM via OpenRouter, image, vidéo, transcription)
3. Les guides de prompting par modèle, consultables par Claude Code

Tous les tokens sont gérés via le Keychain macOS (CLI `creds`). Les préférences de providers et modèles sont dans un fichier `.env` local. Claude Code et les scripts n'ont jamais accès aux clés directement.

---

## Problème

Quand des agents IA tournent en autonomie, il n'existe pas d'endroit unique pour savoir ce qui s'est passé. Par ailleurs, Claude Code ne peut pas nativement appeler OpenRouter, générer des images ou des vidéos. Il faut un middleware local qui centralise ces capacités.

---

## Objectifs

- Centraliser tous les événements d'exécution en un seul endroit
- Recevoir chaque matin un digest condensé et intentionnel sur Telegram
- Pouvoir recevoir directement sur Telegram le contenu long associé à un log
- Exposer des capacités IA à Claude Code et aux scripts
- Permettre à Claude Code de récupérer le guide de prompting d'un modèle donné
- Fonctionne entièrement en local, zéro serveur
- Appelable depuis n'importe quel répertoire sur le système

---

## Utilisateurs cibles

Développeurs utilisant des agents IA ou des workflows automatisés (Claude Code, n8n, GitHub Actions, scripts cron).

---

## Stack technique

- **Langage** : Node.js
- **Base de données** : SQLite local via `better-sqlite3`
- **Fichier DB** : `~/.claude-hub/activity.db`
- **Config providers/modèles** : `~/.claude-hub/.env`
- **Préférences** : `~/.claude-hub/config.json`
- **Artifacts** : `~/.claude-hub/artifacts/`
- **Guides de prompts** : `~/.claude-hub/prompts/`
- **Tokens API** : CLI `creds` (Keychain macOS)

---

## Installation & accès global
```bash
npm install
npm link
```

`package.json` :
```json
{
  "bin": {
    "cc-hub": "./bin/cc-hub.js"
  }
}
```

`bin/cc-hub.js` doit commencer par :
```js
#!/usr/bin/env node
```

---

## Gestion des credentials

### Tokens API — via `creds` (Keychain macOS)

Les clés API sont **stockées et lues exclusivement via le CLI `creds`**. cc-hub ne stocke aucun token en clair.

| Usage | Clé creds |
|---|---|
| Token Telegram Bot | `TELEGRAM_BOT_TOKEN` |
| Chat ID Telegram | `TELEGRAM_CHAT_ID` |
| Clé API OpenRouter | `OPENROUTER_API_KEY` |
| Clé API Replicate | `REPLICATE_API_KEY` |
| Clé API Anthropic (digest) | `ANTHROPIC_API_KEY` |

Lecture au runtime :
```js
const { execSync } = require('child_process');
const token = execSync('creds get OPENROUTER_API_KEY').toString().trim();
```

Si un token est manquant :
```
⚠️  Token manquant : OPENROUTER_API_KEY
   → Enregistre-le avec : creds set OPENROUTER_API_KEY <valeur>
```

---

### Providers & modèles — via `~/.claude-hub/.env`

Les choix de providers et de modèles par défaut pour chaque capacité sont configurés dans un fichier `.env` local. Ce fichier ne contient **aucune clé API**, uniquement des préférences.
```env
# LLM — via OpenRouter
LLM_PROVIDER=openrouter
LLM_MODEL=anthropic/claude-sonnet

# Image
IMAGE_PROVIDER=replicate
IMAGE_MODEL=black-forest-labs/flux-1.1-pro

# Vidéo
VIDEO_PROVIDER=replicate
VIDEO_MODEL=minimax/video-01

# Transcription
TRANSCRIBE_PROVIDER=replicate
TRANSCRIBE_MODEL=openai/whisper
```

Chaque commande utilise ces valeurs par défaut, surchargeable à la volée avec `--model` :
```bash
cc-hub ask "Résume ça"                          # utilise LLM_MODEL du .env
cc-hub ask "Résume ça" --model openai/gpt-4o    # surcharge ponctuelle
```

---

## Artifacts — contenu long

Quand un log est accompagné d'un fichier de contenu (résultat de veille, transcription, etc.), cc-hub le copie dans `~/.claude-hub/artifacts/` avec un nom normalisé. Seul le chemin est stocké en base.

### Nommage des artifacts
```
~/.claude-hub/artifacts/
  2026-03-12_001_tech-watch-nextjs.md
  2026-03-12_002_pr-summary.md
  2026-03-12_003_transcription-meeting.md
```

Format : `YYYY-MM-DD_<id>_<slug>.md`

### Envoi avec log
```bash
cc-hub log add \
  --type tech_watch \
  --title "Veille Next.js" \
  --status success \
  --file /chemin/vers/resultat.md \
  --important
```

cc-hub copie le fichier dans `artifacts/`, génère le nom normalisé, et stocke le chemin en base.

---

## Principe du digest — intentionnel uniquement

Le digest du matin **ne contient que les événements explicitement pushés** via `cc-hub log add`.

Les commandes `cc-hub ask`, `cc-hub imagine`, `cc-hub video`, etc. sont **muettes par défaut**. C'est à l'agent ou au script appelant de décider si une action mérite d'être loggée :
```bash
# L'agent génère une image
cc-hub imagine "Logo for project X"

# Si l'agent juge que c'est digne d'être rapporté, il logue explicitement
cc-hub log add --type image_gen --title "Logo projet X généré" --status success
```

---

## Notifications Telegram

### Message court

Pour chaque événement du digest ou log `--important`, Telegram reçoit un message condensé :
```
✅ Veille Next.js — 12 articles analysés
📅 12/03/2026 03:12 · source: claude-code
```

### Pièce jointe MD

Si le log est accompagné d'un artifact, le fichier MD est envoyé **en pièce jointe** dans le même message Telegram via l'API `sendDocument`. L'utilisateur ouvre directement le fichier depuis Telegram, sans aller sur la machine.

### Digest quotidien

Le digest du matin envoie :
1. Un message résumé généré par Claude (condensé de la nuit)
2. Les fichiers MD des logs `--important` en pièces jointes

---

## Modules & commandes

---

### Module `log`

#### `cc-hub log add`
```bash
cc-hub log add \
  --type tech_watch \
  --title "Veille Next.js" \
  --status success \
  --details "12 articles analysés" \
  --file ./resultat.md \
  --important
```

**Types disponibles :**

| Type | Description |
|---|---|
| `tech_watch` | Veille technologique |
| `pull_request` | Création ou merge d'une PR |
| `code_refactor` | Refactorisation de code |
| `bug_fix` | Correction de bug |
| `code_review` | Revue de code |
| `test_run` | Exécution de tests |
| `deploy` | Déploiement |
| `documentation` | Génération ou mise à jour de docs |
| `summary_sent` | Résumé envoyé |
| `data_analysis` | Analyse de données |
| `image_gen` | Génération d'image |
| `video_gen` | Génération de vidéo |
| `transcription` | Transcription audio |
| `prompt_used` | Prompt optimisé utilisé |
| `backup` | Sauvegarde effectuée |
| `notification_sent` | Notification envoyée |
| `task_scheduled` | Tâche planifiée ou modifiée |
| `error` | Erreur critique |
| `other` | Autre |

**Statuts :** `success`, `failed`, `partial`

---

#### `cc-hub log list`
```bash
cc-hub log list
cc-hub log list --today
cc-hub log list --failed
cc-hub log list --type deploy
```

---

#### `cc-hub log get <id>`

Affiche le détail d'un log et le contenu de son artifact si présent.
```bash
cc-hub log get 42
```

---

#### `cc-hub digest preview`
```bash
cc-hub digest preview
cc-hub digest preview --since 2026-03-10
```

Exemple de sortie :
```
📋 Digest du 12/03/2026
─────────────────────
✅ Veille techno Next.js (03:12) 📎 artifact
✅ 2 PRs mergées sur projet-x (04:30, 05:01)
⚠️  Refacto auth.ts — erreur de lint (02:45)

1 point d'attention : la tâche de refacto a échoué.
```

---

#### `cc-hub digest send`
```bash
cc-hub digest send
cc-hub digest send --telegram
```

---

#### `cc-hub schedule`
```bash
cc-hub schedule set 08:00
cc-hub schedule remove
cc-hub schedule status
```

---

### Module `ask` — LLM via OpenRouter
```bash
cc-hub ask "Résume ce texte"
cc-hub ask "Explique ce bug" --model openai/gpt-4o
cc-hub ask "Traduis en anglais" --model google/gemini-2.5-pro
```

Compatible piping :
```bash
cat fichier.ts | cc-hub ask "Explique ce code"
```

---

### Module `imagine` — Génération d'image
```bash
cc-hub imagine "Dashboard dark mode minimal"
cc-hub imagine "Logo for project X" --model stability-ai/sdxl
cc-hub imagine "Hero banner" -o banner.png
```

Retourne le chemin du fichier image généré. Noms uniques par défaut (timestamp `HHmmss`). Option `-o, --output <filename>` pour un nom personnalisé.

---

### Module `video` — Génération vidéo
```bash
cc-hub video "Product demo 10 seconds"
cc-hub video "Animated logo loop" --model minimax/video-01
cc-hub video "Intro clip" -o intro.mp4
```

Retourne le chemin du fichier vidéo généré. Noms uniques par défaut (timestamp `HHmmss`). Option `-o, --output <filename>` pour un nom personnalisé.

---

### Module `transcribe` — Audio vers texte
```bash
cc-hub transcribe ./meeting.mp3
cc-hub transcribe ./meeting.mp3 --model openai/whisper
```

Retourne la transcription en stdout.

---

### Module `prompt` — Guides de prompting par modèle

Ce module maintient une base locale de guides de prompting (fichiers MD). Claude Code les consulte pour savoir comment formuler ses requêtes vers un modèle donné.

#### Stockage
```
~/.claude-hub/prompts/
  openai-gpt-4o.md
  anthropic-claude-opus.md
  google-gemini-2.5-pro.md
  black-forest-labs-flux.md
  minimax-video-01.md
  openai-whisper.md
```

---

#### `cc-hub prompt get --model <model>`

Retourne en stdout le contenu du fichier MD du modèle demandé. Claude Code appelle cette commande pour récupérer le guide et construire un prompt optimal de façon autonome.
```bash
cc-hub prompt get --model openai/gpt-4o
cc-hub prompt get --model google/gemini-2.5-pro
cc-hub prompt get --model black-forest-labs/flux-1.1-pro
```

Si le guide n'existe pas :
```
⚠️  Aucun guide trouvé pour ce modèle.
   → Lance : cc-hub prompt init --model openai/gpt-4o
```

---

#### `cc-hub prompt init --model <model>`

Recherche sur Internet les meilleures pratiques de prompting pour le modèle donné et génère le fichier MD correspondant.
```bash
cc-hub prompt init --model openai/gpt-4o
cc-hub prompt init --model google/gemini-2.5-pro
cc-hub prompt init --model minimax/video-01
```

Processus :
1. Recherche web des best practices de prompting pour ce modèle
2. Génère un fichier MD structuré : principes clés, structure recommandée, exemples, erreurs à éviter
3. Sauvegarde dans `~/.claude-hub/prompts/<model-slug>.md`

---

#### `cc-hub prompt list`
```bash
cc-hub prompt list
# openai-gpt-4o            (mis à jour le 10/03/2026)
# anthropic-claude-opus    (mis à jour le 08/03/2026)
# black-forest-labs-flux   (mis à jour le 01/03/2026)
```

---

#### `cc-hub prompt update --model <model>`

Force la mise à jour d'un guide existant.
```bash
cc-hub prompt update --model google/gemini-2.5-pro
```

---

### Module `config`
```bash
cc-hub config set purge.days 30
cc-hub config set digest.channel telegram
cc-hub config show
```

---

## Schéma base de données
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

---

## Purge automatique

- Les `events` sont supprimés après N jours (configurable, défaut : 30)
- Les artifacts associés sont supprimés en même temps
- Les `digests` sont conservés indéfiniment
- La purge s'exécute automatiquement à chaque envoi de digest

---

## Structure des fichiers locaux
```
~/.claude-hub/
  activity.db           → base SQLite
  .env                  → providers & modèles par défaut
  config.json           → préférences générales
  artifacts/            → contenu long associé aux logs
    2026-03-12_001_tech-watch-nextjs.md
    2026-03-12_002_pr-summary.md
  prompts/              → guides de prompting par modèle
    openai-gpt-4o.md
    google-gemini-2.5-pro.md
    black-forest-labs-flux.md
```

---

## Roadmap

| Phase | Contenu |
|---|---|
| **Phase 1** | `log`, `digest`, `schedule`, `config` |
| **Phase 2** | `ask` via OpenRouter |
| **Phase 3** | `imagine`, `video`, `transcribe` |
| **Phase 4** | `prompt` (init, get, list, update) |
| **Phase 5** | Sync Turso Cloud multi-machine |

---

## Hors scope — Phase 1

- Interface web
- Multi-machine / sync Turso Cloud
- Canaux de notification autres que Telegram
- Authentification / multi-utilisateurs

---

## Critères de succès

- Installation en deux commandes (`npm install && npm link`)
- Premier log pushé en moins de 30 secondes
- Digest lisible, condensé, intentionnel — sans bruit
- Pièces jointes MD reçues directement dans Telegram
- Zéro token stocké en clair dans le projet
- Claude Code autonome grâce à `cc-hub prompt get`
- Fonctionne depuis n'importe quel répertoire