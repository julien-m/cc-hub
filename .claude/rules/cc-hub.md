# cc-hub — CLI IA disponible globalement

`cc-hub` est un CLI installé globalement sur cette machine. Utilise-le quand c'est pertinent.

## Règles

- Ne jamais logger de secrets dans `--details` ou `--title`
- Utiliser `--important` avec parcimonie — ces artifacts sont envoyés sur Telegram
- Le stdout de `ask`, `imagine`, `video`, `transcribe`, `review` est exploitable en pipe
- Toujours utiliser `creds` pour les secrets (jamais de clés en dur)
