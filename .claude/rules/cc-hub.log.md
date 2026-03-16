# cc-hub log — Logging d'activité

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
