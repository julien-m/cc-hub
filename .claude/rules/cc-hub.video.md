# cc-hub video — Générer une vidéo

Via Poyo. Télécharge le résultat dans `~/.claude-hub/artifacts/` et affiche le chemin sur stdout.

```bash
cc-hub video "Description de la vidéo"
cc-hub video "Description" --duration 10 --aspect-ratio 9:16
```

- Modèle par défaut : `kling-3.0/pro`
- `--duration` : 3-15 secondes (défaut : 5)
- `--aspect-ratio` : `16:9` (défaut), `1:1`, `9:16`
