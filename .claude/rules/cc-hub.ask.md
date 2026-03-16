# cc-hub ask — Poser une question à un LLM

Via OpenRouter (défaut) ou Poyo. Supporte fichiers en contexte et stdin.

```bash
cc-hub ask "Question ou instruction" --model anthropic/claude-sonnet-4-20250514
cc-hub ask "Explique ce code" -f fichier.ts
cc-hub ask "Compare ces fichiers" -f src/a.ts -f src/b.ts
cat fichier.ts | cc-hub ask "Explique ce code"
cc-hub ask "Question" --provider poyo --model gemini-3-flash-preview
```

- `-f` : fichier ou glob à inclure comme contexte (repeatable)
- `--provider` : `openrouter` (défaut) ou `poyo`
- `--model` : override du modèle
