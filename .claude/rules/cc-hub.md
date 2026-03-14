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
```

### Poser une question à un autre LLM (via OpenRouter)

```bash
cc-hub ask "Question ou instruction" --model anthropic/claude-sonnet-4-20250514
cat fichier.ts | cc-hub ask "Explique ce code"
```

### Générer une image

```bash
cc-hub imagine "Description de l'image"
# → télécharge dans ~/.claude-hub/artifacts/ et affiche le chemin
```

### Générer une vidéo

```bash
cc-hub video "Description de la vidéo"
```

### Transcrire un fichier audio

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
- Le stdout de `ask`, `imagine`, `video`, `transcribe` est exploitable en pipe
- Toujours utiliser `creds` pour les secrets (jamais de clés en dur)
