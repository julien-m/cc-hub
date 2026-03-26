# cc-hub — CLI IA disponible globalement

`cc-hub` est un CLI installé globalement sur cette machine. Utilise-le quand c'est pertinent.

## Format des modèles

Tous les modèles se passent au **format canonical ID** (identique aux IDs OpenRouter) : `provider/model-name`.

Exemples : `openai/gpt-5.4`, `anthropic/claude-sonnet-4.6`, `google/gemini-3-pro`.

Utiliser `cc-hub models list` pour voir les modèles disponibles et leurs providers.

## Quand utiliser cc-hub

### Logging d'activité

Quand tu termines une tâche significative (deploy, refactor, bug fix, tech watch, etc.), log-la :

```bash
cc-hub log add \
  --type <type> \
  --title "Description courte" \
  --status success|failed|partial \
  --details "Détails optionnels" \
  --file ./artifact.md \    # optionnel — fichier à attacher
  --important               # optionnel — inclus dans le digest Telegram
```

Types disponibles : `tech_watch`, `pull_request`, `code_refactor`, `bug_fix`, `code_review`, `test_run`, `deploy`, `documentation`, `data_analysis`, `image_gen`, `video_gen`, `transcription`, `prompt_used`, `backup`, `error`, `other`.

### Envoyer un message Telegram

```bash
cc-hub telegram send "Message à envoyer"
cc-hub telegram send-file photo.png --caption "Légende optionnelle"
```

### Poser une question à un autre LLM (via OpenRouter ou Poyo)

```bash
cc-hub ask "Question ou instruction" --model anthropic/claude-sonnet-4.6
cc-hub ask "Explique ce code" -f fichier.ts
cc-hub ask "Compare ces fichiers" -f src/a.ts -f src/b.ts
cat fichier.ts | cc-hub ask "Explique ce code"
cc-hub ask "Question" --provider poyo --model gemini-3-flash-preview
cc-hub ask "3 capitales européennes en JSON" --json --model openai/gpt-5.4
cc-hub ask "3 European capitals" --schema '{"name":"caps","strict":true,"schema":{...}}'
cc-hub ask "3 European capitals" --schema ./capitals.schema.json
```

- `--json` : sortie JSON libre (le modèle choisit la structure)
- `--schema <json_or_file>` : sortie JSON contrainte par un JSON Schema (inline ou chemin vers fichier `.json`). Implique `--json`

### Générer une image (via Poyo)

```bash
cc-hub imagine "Description" -o /tmp/mon-image.png       # chemin complet → respecté
cc-hub imagine "Description" -o ./local/image.png         # chemin relatif → respecté
cc-hub imagine "Description" -o mon-image.png             # nom seul → dans ~/.claude-hub/artifacts/
cc-hub imagine "Description" --size 16:9 --resolution 2K -o rendu.png
cc-hub imagine "Transform into watercolor" -i ./photo.png -o result.png  # avec image de référence locale
cc-hub imagine "Stylize this" -i https://example.com/img.jpg -o out.png  # avec URL de référence
```

- Modèle par défaut : `google/gemini-3.1-flash-image`
- Sizes : `1:1`, `16:9`, `9:16`, `3:2`, `2:3`, `4:3`, `3:4`, `4:5`, `5:4`, `21:9`
- Résolutions : `1K` (défaut), `2K`, `4K`
- `-o, --output <path>` (**obligatoire**) : chemin complet → respecté tel quel, nom seul → dans `~/.claude-hub/artifacts/`
- `-i, --image <path>` (optionnel) : image de référence (chemin local ou URL). Formats supportés : png, jpg, jpeg, webp

### Générer une vidéo (via Poyo)

```bash
cc-hub video "Description" -o /tmp/clip.mp4               # chemin complet → respecté
cc-hub video "Description" -o ./local/clip.mp4             # chemin relatif → respecté
cc-hub video "Description" -o clip.mp4                     # nom seul → dans ~/.claude-hub/artifacts/
cc-hub video "Description" --duration 10 --aspect-ratio 9:16 -o short.mp4
cc-hub video "The person starts walking" -i ./portrait.jpg -o animated.mp4  # image-to-video
cc-hub video "Zoom out slowly" -i https://example.com/scene.png -o out.mp4  # avec URL de référence
```

- Modèle par défaut : `kuaishou/kling-3.0-pro`
- Modèles disponibles : `kuaishou/kling-3.0-pro`, `kuaishou/kling-3.0-standard`, `google/veo-3.1-fast`, `google/veo-3.1-quality`, `openai/sora-2-pro`
- Durée : 3-15 secondes (défaut : 5)
- Ratios : `16:9` (défaut), `1:1`, `9:16`
- `-o, --output <path>` (**obligatoire**) : chemin complet → respecté tel quel, nom seul → dans `~/.claude-hub/artifacts/`
- `-i, --image <path>` (optionnel) : image de départ pour animation (chemin local ou URL). Formats supportés : png, jpg, jpeg, webp

### Générer une vidéo par transfert de mouvement (Motion Control)

```bash
cc-hub motion "Dance animation" -i ./character.png -v ./dance.mp4 -o result.mp4
cc-hub motion "Walking scene" -i https://example.com/person.jpg -v ./walk.mp4 -o walk.mp4
cc-hub motion "Gesture transfer" -i ./avatar.png -v ./gesture.mp4 --character-orientation video -o out.mp4
```

- Modèle : `kling-3.0-motion-control` (fixe)
- `-i, --image <path>` (**obligatoire**) : image du personnage à animer (chemin local ou URL). Formats : png, jpg, jpeg, webp
- `-v, --video <path>` (**obligatoire**) : vidéo de référence pour le mouvement (chemin local ou URL). Formats : mp4, webm, mov
- `--character-orientation <value>` (optionnel) : `character` (défaut) ou `video`
- `-o, --output <path>` (**obligatoire**) : chemin complet → respecté tel quel, nom seul → dans `~/.claude-hub/artifacts/`

### Poser une question via GitHub Copilot CLI

```bash
cc-hub copilot "Explique ce code"
cc-hub copilot "Compare ces fichiers" -f src/a.ts -f src/b.ts
cat fichier.ts | cc-hub copilot "Analyse"
cc-hub copilot "Question" --model anthropic/claude-sonnet-4.6
```

- Provider : GitHub Copilot CLI (`gh copilot -p`)
- Modèle par défaut : `openai/gpt-5.4`
- Les modèles se passent au format canonical ID (ex: `openai/gpt-5.4`, `anthropic/claude-sonnet-4.6`)
- Contrairement à `ask`, `copilot` tourne localement via `gh copilot` et a accès au filesystem. On peut référencer des chemins locaux directement dans le prompt sans `-f` (ex: `"Analyse le projet dans ~/projects/my-app"`). `-f` reste utile pour injecter le contenu d'un fichier dans le contexte du prompt.
- Idéal pour les tâches non urgentes (cron de nuit, batch)

### Lister les modèles disponibles

```bash
cc-hub models list                          # tous les modèles
cc-hub models list --provider copilot       # modèles disponibles sur Copilot
cc-hub models list --provider openrouter    # modèles disponibles sur OpenRouter
cc-hub models list --provider poyo          # modèles disponibles sur Poyo
cc-hub models list --type text              # modèles texte uniquement
cc-hub models list --type image             # modèles image uniquement
cc-hub models list --type video             # modèles vidéo uniquement
```

- Providers : `openrouter`, `copilot`, `poyo`
- Types : `text`, `image`, `video`, `audio`
- Combinable : `--provider copilot --type text`

### Transcrire un fichier audio (via Soniox)

```bash
cc-hub transcribe ./fichier.mp3
# → transcription sur stdout
```

### Gérer les skills/commands/rules/agents Claude Code

```bash
cc-hub skill link <path|name>                    # installer un skill globalement (symlink)
cc-hub skill link <path> --name <custom-name>    # avec un nom personnalisé
cc-hub skill list                                # lister les skills globaux
cc-hub skill unlink <name>                       # désinstaller

cc-hub command link <path>                       # idem pour les commandes
cc-hub command link <path> --name <custom-name>  # nom personnalisé (.md ajouté auto)
cc-hub rule link <path>                          # idem pour les rules
cc-hub rule link <path> --name <custom-name>     # nom personnalisé (.md ajouté auto)
cc-hub agent link <path>                         # idem pour les agents
cc-hub agent link <path> --name <custom-name>    # nom personnalisé (.md ajouté auto)
cc-hub agent list                                # lister les agents globaux
cc-hub agent unlink <name>                       # désinstaller
```

### Digest quotidien

```bash
cc-hub digest preview                       # afficher les événements bruts
cc-hub digest preview --since 2026-03-20    # depuis une date
cc-hub digest files                         # lister les fichiers artifacts
cc-hub digest files --important             # uniquement les artifacts importants
```

### Planifier le digest

```bash
cc-hub schedule set 08:00                   # planifier le digest à 08h00 (cron)
cc-hub schedule show                        # afficher la planification actuelle
cc-hub schedule unset                       # supprimer la planification
```

### Configuration

```bash
cc-hub config show                          # afficher toutes les préférences
cc-hub config set <key> <value>             # définir une préférence
cc-hub config set prompt.default.text "openai/gpt-5.4"
```

### Synchroniser la base de données

```bash
cc-hub sync run                             # lancer une synchronisation Turso
cc-hub sync status                          # afficher le statut de synchronisation
```

### Gérer les guides de prompting

```bash
cc-hub prompt get --model openai/gpt-5.4   # récupérer le guide d'un modèle
cc-hub prompt get --type image              # récupérer le guide par type
cc-hub prompt list                          # lister les guides disponibles
cc-hub prompt delete --model openai/gpt-5.4 # supprimer un guide
```

## Chargement du prompt guide avant appel LLM

Avant chaque commande cc-hub qui contacte un LLM, **charger le guide de prompting** du modèle utilisé. Cela permet d'optimiser le prompt envoyé au modèle.

### Procédure

1. Identifier le modèle utilisé (explicite via `--model`, ou le modèle par défaut de la commande)
2. Exécuter `cc-hub prompt get --model <model>` (ou `cc-hub prompt get --type <type>`)
3. **Lire le contenu retourné** et l'utiliser pour optimiser le prompt avant de l'envoyer
4. Si le guide n'existe pas (exit code 2), **le générer d'abord** avec le skill `/prompt-guide --model <model>`, puis recommencer

### Mapping commande → type / modèle par défaut

| Commande | Type | Commande prompt |
|----------|------|-----------------|
| `cc-hub imagine` | image | `cc-hub prompt get --type image` |
| `cc-hub video` | video | `cc-hub prompt get --type video` |
| `cc-hub ask --model X` | text | `cc-hub prompt get --model X` |
| `cc-hub copilot --model X` | text | `cc-hub prompt get --model X` |
| `cc-hub transcribe` | audio | `cc-hub prompt get --type audio` |

Pour `ask` et `copilot`, utiliser le modèle exact passé en `--model`. Pour les autres, `--type` résout automatiquement vers le modèle par défaut configuré (modifiable via `cc-hub config set prompt.default.<type> "model"`).

### Cache de session

- Charger le guide **une seule fois par modèle** dans la conversation
- Réutiliser le guide déjà chargé pour les appels suivants au même modèle
- Si le modèle change (ex: `--model` différent), charger le nouveau guide

### Exemple de workflow

```bash
# 1. Charger le guide (une fois)
cc-hub prompt get --type image
# → lit le guide, l'utilise pour les prompts suivants

# 2. Générer l'image avec un prompt optimisé selon le guide
cc-hub imagine "prompt optimisé selon les recommandations du guide" -o image.png
```

Si le guide n'existe pas :

```bash
# 1. Générer le guide
/prompt-guide --type image

# 2. Charger le guide
cc-hub prompt get --type image

# 3. Utiliser
cc-hub imagine "prompt optimisé" -o image.png
```

## Règles

- Ne jamais logger de secrets dans `--details` ou `--title`
- Utiliser `--important` avec parcimonie — ces artifacts sont envoyés sur Telegram
- Le stdout de `ask`, `copilot`, `imagine`, `video`, `transcribe` est exploitable en pipe
- Toujours utiliser `creds` pour les secrets (jamais de clés en dur)
