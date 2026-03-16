# cc-hub transcribe — Transcrire un fichier audio

Via Soniox. Transcription sur stdout.

```bash
cc-hub transcribe ./fichier.mp3
cc-hub transcribe ./interview.m4a --model stt-async-preview
```

- Modèle par défaut : `stt-async-preview`
- Formats supportés : mp3, wav, m4a, ogg, flac, webm
- `--model` : override du modèle Soniox
