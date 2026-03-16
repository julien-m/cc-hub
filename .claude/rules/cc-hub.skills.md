# cc-hub skill/command/rule — Gérer les extensions Claude Code

Installer, lister ou désinstaller des skills, commandes et rules Claude Code globalement (via symlinks).

```bash
cc-hub skill link <path|name>                    # installer un skill globalement
cc-hub skill link <path> --name <custom-name>    # avec un nom personnalisé
cc-hub skill list                                # lister les skills globaux
cc-hub skill unlink <name>                       # désinstaller

cc-hub command link <path>                       # idem pour les commandes
cc-hub command link <path> --name <custom-name>  # nom personnalisé (.md ajouté auto)
cc-hub rule link <path>                          # idem pour les rules
cc-hub rule link <path> --name <custom-name>     # nom personnalisé (.md ajouté auto)
```
