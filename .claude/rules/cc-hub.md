# cc-hub — CLI IA disponible globalement

`cc-hub` est un CLI installé globalement sur cette machine. Utilise-le quand c'est pertinent.

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
cc-hub ask "Question ou instruction" --model anthropic/claude-sonnet-4-20250514
cc-hub ask "Explique ce code" -f fichier.ts
cc-hub ask "Compare ces fichiers" -f src/a.ts -f src/b.ts
cat fichier.ts | cc-hub ask "Explique ce code"
cc-hub ask "Question" --provider poyo --model gemini-3-flash-preview
```

### Obtenir une revue critique de fichiers (via Poyo/Gemini)

```bash
cc-hub review -f plan.md
cc-hub review -f commands/ "Vérifie la cohérence entre ces commandes"
cc-hub review -f src/*.ts -f README.md
cat output.log | cc-hub review "Analyse ces erreurs"
```

- Provider : toujours Poyo, modèle par défaut `gemini-3-flash-preview`
- Sans prompt custom, applique un prompt de revue critique par défaut
- `-f` accepte fichiers, répertoires (non-récursif), et globs

### Générer une image (via Poyo)

```bash
cc-hub imagine "Description de l'image"
cc-hub imagine "Description" --size 16:9 --resolution 2K
# → télécharge dans ~/.claude-hub/artifacts/ et affiche le chemin
```

- Modèle par défaut : `nano-banana-2-new`
- Sizes : `1:1`, `16:9`, `9:16`, `3:2`, `2:3`, `4:3`, `3:4`, `4:5`, `5:4`, `21:9`
- Résolutions : `1K` (défaut), `2K`, `4K`

### Générer une vidéo (via Poyo)

```bash
cc-hub video "Description de la vidéo"
cc-hub video "Description" --duration 10 --aspect-ratio 9:16
```

- Modèle par défaut : `kling-3.0/pro`
- Durée : 3-15 secondes (défaut : 5)
- Ratios : `16:9` (défaut), `1:1`, `9:16`

### Transcrire un fichier audio (via Soniox)

```bash
cc-hub transcribe ./fichier.mp3
# → transcription sur stdout
```

### Gérer les skills/commands/rules Claude Code

```bash
cc-hub skill link <path|name>                    # installer un skill globalement (symlink)
cc-hub skill link <path> --name <custom-name>    # avec un nom personnalisé
cc-hub skill list                                # lister les skills globaux
cc-hub skill unlink <name>                       # désinstaller

cc-hub command link <path>                       # idem pour les commandes
cc-hub command link <path> --name <custom-name>  # nom personnalisé (.md ajouté auto)
cc-hub rule link <path>                          # idem pour les rules
cc-hub rule link <path> --name <custom-name>     # nom personnalisé (.md ajouté auto)
```

## Règles

- Ne jamais logger de secrets dans `--details` ou `--title`
- Utiliser `--important` avec parcimonie — ces artifacts sont envoyés sur Telegram
- Le stdout de `ask`, `imagine`, `video`, `transcribe`, `review` est exploitable en pipe
- Toujours utiliser `creds` pour les secrets (jamais de clés en dur)
