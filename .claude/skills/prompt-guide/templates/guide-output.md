# Template de sortie pour les guides de prompting

Le guide généré DOIT suivre exactement ce format.

## Format

```
---
model: {model_id}
type: {type}
provider: {provider_name}
last_updated: {YYYY-MM-DD}
---

# Prompt Engineering Guide: {Model Display Name}

## 1. Model Overview

{Specs techniques vérifiées : context window, max output, pricing, model IDs, knowledge cutoff}
{Forces et limites sourcées}
{Behavioral shifts vs modèle précédent si applicable}

## 2. Key Prompting Techniques

{8+ techniques spécifiques au modèle avec code/snippets}
{Features API natives : structured outputs, tool use, vision, compaction, thinking}

## 3. Prompt Structure

{Structure de messages avec exemple copy-paste}
{Règle d'ordering pour le long contexte}

## 4. Advanced Techniques

{Few-shot, CoT, structured outputs API, tool use strict, vision, compaction}
{Tableau effort recommandé par type de tâche}

## 5. Best Practices

{6+ pratiques avec avant/après}

## 6. Common Mistakes

{8+ erreurs avec avant/après et correction}

## 7. Examples

{5+ exemples variés : coding, data, anti-over-engineering, vision, agentic}

## 8. Sources

- [Titre descriptif](URL)
- [Titre descriptif](URL)
{10+ URLs réelles}
```

## Règles critiques

### Frontmatter

- Délimiteurs : `---` (trois tirets) en début et fin
- **JAMAIS** de code fence ` ```yaml ` autour du frontmatter
- Champs obligatoires : `model`, `type`, `provider`, `last_updated`
- `model` : identifiant exact tel que fourni par l'utilisateur (ex: `anthropic/claude-sonnet-4.6`)
- `type` : l'un de `text`, `image`, `video`, `audio`
- `provider` : nom du provider réel (Anthropic, OpenAI, Google, Poyo, Soniox, etc.) — **JAMAIS "PlaceholderAI"**
- `last_updated` : date du jour au format `YYYY-MM-DD` — **JAMAIS une date inventée**

### Contenu

- Langue : anglais
- Titre H1 : `# Prompt Engineering Guide: {Nom affiché du modèle}`
- Sections numérotées avec H2 : `## 1. Model Overview`, `## 2. ...`
- Dernière section toujours : `## N. Sources`
- Pas de séparateur `---` dans le corps (réservé au frontmatter)
- Exemples de code dans des code fences avec le langage approprié
- Inclure du code API Python SDK (pas seulement du prompt texte) pour les features natives

### Minimums obligatoires (type text)

| Élément | Minimum |
|---|---|
| Techniques spécifiques | 8 |
| Best practices | 6 |
| Common mistakes (avec avant/après) | 8 |
| Exemples avant/après | 5 |
| Sources (URLs réelles) | 10 |

### Minimums obligatoires (types image/video/audio)

| Élément | Minimum |
|---|---|
| Best practices | 5 |
| Common mistakes (avec avant/après) | 5 |
| Exemples avant/après | 5 (image/video), 3 (audio) |
| Sources (URLs réelles) | 5 |

### Slug et chemin de sortie

Le fichier est sauvegardé dans `~/.claude-hub/prompts/{slug}.md` où le slug est calculé :
1. Remplacer `/` par `-`
2. Supprimer tout caractère qui n'est pas `[a-z0-9-]`
3. Tout en minuscules

Exemples :
- `anthropic/claude-sonnet-4.6` → `anthropic-claude-sonnet-46.md`
- `openai/gpt-5.2` → `openai-gpt-52.md`
- `nano-banana-2-new` → `nano-banana-2-new.md`
- `google/gemini-3.1-pro-preview` → `google-gemini-31-pro-preview.md`
