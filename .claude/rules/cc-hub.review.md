# cc-hub review — Revue critique de fichiers

Obtenir un second avis via Poyo (Gemini). Toujours critique, jamais un résumé.

```bash
cc-hub review -f plan.md
cc-hub review -f commands/ "Vérifie la cohérence entre ces commandes"
cc-hub review -f src/*.ts -f README.md
cat output.log | cc-hub review "Analyse ces erreurs"
```

- Provider : toujours Poyo, modèle par défaut `gemini-3-flash-preview`
- Sans prompt custom, applique un prompt de revue critique par défaut
- `-f` accepte fichiers, répertoires (non-récursif), et globs
- `--model` : override du modèle Poyo
