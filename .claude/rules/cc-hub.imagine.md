# cc-hub imagine — Générer une image

Via Poyo. Télécharge le résultat dans `~/.claude-hub/artifacts/` et affiche le chemin sur stdout.

```bash
cc-hub imagine "Description de l'image"
cc-hub imagine "Description" --size 16:9 --resolution 2K
```

- Modèle par défaut : `nano-banana-2-new`
- `--size` : `1:1` (défaut), `16:9`, `9:16`, `3:2`, `2:3`, `4:3`, `3:4`, `4:5`, `5:4`, `21:9`
- `--resolution` : `1K` (défaut), `2K`, `4K`
