# Design: Convertir cc-hub.md rule → skill

**Date:** 2026-04-08
**Statut:** Approved (auto-brainstorm)

## Problème

La rule `~/.claude/rules/cc-hub.md` est symlinkée globalement, ce qui la charge dans chaque conversation (~300 lignes de documentation CLI). C'est du bruit de contexte et un coût token inutile quand on ne travaille pas avec cc-hub.

## Solution

Transformer la rule en skill on-demand. Le skill est chargé uniquement quand Claude en a besoin (invocation cc-hub, logging, génération de médias, etc.).

## Architecture

```
Before:
~/.claude/rules/cc-hub.md → /Users/julienm/projects/cc-hub/.claude/rules/cc-hub.md
(chargé automatiquement dans CHAQUE conversation)

After:
~/.claude/skills/cc-hub/ → /Users/julienm/projects/claude-skills/projects/dev/kit/skills/cc-hub/
(chargé uniquement à la demande)
```

## Composants

### 1. Nouveau skill — `claude-skills/projects/dev/kit/skills/cc-hub/SKILL.md`
- Frontmatter avec `name: cc-hub`, description précise des triggers d'invocation
- Contenu : intégralité de la rule actuelle (aucune perte d'info)
- Trigger : `cc-hub` dans le prompt, commandes log/imagine/video/ask/copilot/codex

### 2. Suppression rule
- Supprimer symlink `~/.claude/rules/cc-hub.md`
- Supprimer source `/Users/julienm/projects/cc-hub/.claude/rules/cc-hub.md`

### 3. Mise à jour CLAUDE.md du projet cc-hub
- Remplacer la référence à la rule par une instruction d'invocation du skill

### 4. Sync
- `cc-hub skill link ~/projects/claude-skills/projects/dev/kit/skills/cc-hub`

### 5. Optimisation
- Invoquer `/meta-skill-creator` pour optimiser le frontmatter et le contenu du skill

## Tests

- Vérifier que `~/.claude/skills/cc-hub/` existe et pointe vers le bon répertoire
- Vérifier que `~/.claude/rules/cc-hub.md` n'existe plus
- Vérifier que le skill est dans `~/.claude/skills/` (via `cc-hub skill list`)
