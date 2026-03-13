---
name: prompt-guide
description: >
  Générer un guide de prompt engineering sourcé pour un modèle IA.
  Recherche web sur la doc officielle, benchmarks et best practices,
  puis rédige un guide précis sauvegardé dans ~/.claude-hub/prompts/.
argument-hint: --model "provider/model" --type text|image|video|audio
---

# Skill: prompt-guide

Tu es un expert en prompt engineering. Ta mission est de générer un guide de prompting **précis, sourcé et spécifique** pour un modèle IA donné, en t'appuyant sur de la recherche web réelle.

## Workflow

### Étape 1 — Parsing des arguments

Extraire les arguments depuis la ligne de commande :
- `--model <model>` (REQUIS) — identifiant du modèle (ex: `anthropic/claude-sonnet-4.6`, `nano-banana-2-new`)
- `--type <type>` (optionnel, défaut: `text`) — type parmi : `text`, `image`, `video`, `audio`

Valider que `--type` est l'une des 4 valeurs acceptées. Si invalide, afficher l'erreur et arrêter.

Calculer le slug pour le nom de fichier :
- Remplacer `/` par `-`
- Supprimer tout caractère qui n'est pas `[a-z0-9-]`
- Tout en minuscules
- Exemple : `anthropic/claude-sonnet-4.6` → `anthropic-claude-sonnet-46`

Le chemin de sortie est : `~/.claude-hub/prompts/{slug}.md`

### Étape 2 — Protection contre l'écrasement

Vérifier si le fichier `~/.claude-hub/prompts/{slug}.md` existe déjà.

Si oui :
1. Lire le fichier existant
2. Extraire `last_updated` du frontmatter
3. Afficher : "Un guide existe déjà pour {model} (dernière MAJ: {date}). Voulez-vous le remplacer ?"
4. Attendre la confirmation de l'utilisateur avant de continuer
5. Si refus, arrêter proprement

### Étape 3 — Identification du modèle

Lire le fichier `references/known-models.md` (relatif à ce skill).

**Si le modèle est dans le registre :**
- Récupérer : provider, type par défaut, URLs de doc officielle, traits clés
- Utiliser ces informations comme point de départ pour la recherche

**Si le modèle n'est PAS dans le registre :**
- Inférer le provider depuis le préfixe si présent :
  - `anthropic/` → Anthropic
  - `openai/` → OpenAI
  - `google/` → Google
  - `meta/` → Meta
  - Pas de préfixe → provider inconnu, la recherche web devra le déterminer
- Continuer avec la recherche web pour découvrir les informations

### Étape 4 — Phase de recherche web

C'est le coeur du skill. Tu DOIS faire des recherches web réelles pour chaque guide.

**Recherches obligatoires (utiliser WebSearch) :**

1. **Documentation officielle** — Chercher la doc officielle du provider pour ce modèle spécifique
   - Query exemple : `"{model name}" official documentation prompting guide site:{provider_domain}`

2. **Best practices de prompting** — Chercher les techniques de prompting recommandées
   - Query exemple : `"{model name}" prompt engineering best practices`

3. **Capabilities et specs** — Chercher les specs techniques (context window, paramètres, limites)
   - Query exemple : `"{model name}" context window parameters capabilities`

4. **Retours communauté** — Chercher les gotchas et astuces de la communauté
   - Query exemple : `"{model name}" prompting tips tricks common mistakes`

5. **Features API** — Chercher les features API natives du provider (structured outputs, tool use, vision, compaction, etc.)
   - Query exemple : `"{provider}" API structured outputs tool use features`

**Extraction détaillée (utiliser WebFetch) :**
- Récupérer le contenu des 3-5 pages les plus pertinentes trouvées
- Extraire les informations concrètes : techniques, exemples, paramètres
- **Attention aux redirections** : docs.anthropic.com redirige vers platform.claude.com — suivre la redirection

**Consulter aussi** le fichier `references/research-sources.md` pour les URLs de doc connues par provider.

**IMPORTANT :**
- Tracker TOUTES les URLs consultées pour la section Sources du guide
- Ne jamais inventer d'information — tout doit venir de la recherche ou du registre
- Si une information ne peut pas être vérifiée, le mentionner explicitement
- Lancer les 4-5 WebSearch en PARALLÈLE pour gagner du temps

### Étape 5 — Chargement du template de type

Lire le fichier `references/type-{type}-template.md` correspondant au type demandé.

Ce fichier contient :
- Les sections obligatoires du guide
- Les critères de qualité pour chaque section
- Les minimums à respecter (nombre d'exemples, d'erreurs, etc.)

### Étape 6 — Rédaction du guide

Synthétiser toute la recherche en suivant le template de type.

**Règles de rédaction :**

1. **Langue** : Anglais
2. **Spécificité** : Chaque recommandation DOIT être spécifique au modèle, pas générique
   - MAL : "Use clear instructions"
   - BIEN : "Claude responds best to XML-tagged sections like `<context>...</context>`"
3. **Traçabilité** : Chaque technique doit être traçable à une source (doc officielle, benchmark, retour communauté)
4. **Exemples concrets** : Inclure des exemples copy-paste, pas des descriptions abstraites
5. **Format de sortie** : Suivre le template `templates/guide-output.md`
6. **Frontmatter** : Utiliser `---` comme délimiteurs (PAS ` ```yaml `). C'est critique pour la compatibilité.
7. **Date** : Utiliser la date du jour pour `last_updated`
8. **Public cible** : Le guide sera consommé par un assistant IA (Claude Code) pour crafter des prompts optimisés. Écrire comme un document de référence parsable.

**Contenu enrichi — Leçons apprises :**

9. **Behavioral shifts** : Si le modèle est une nouvelle version (ex: Claude 4.6 vs 4.5), documenter explicitement ce qui a changé et comment adapter ses prompts. Les utilisateurs qui migrent ont besoin de comprendre les ruptures.
10. **Features API natives** : Ne pas se limiter au prompting textuel. Documenter aussi les features API qui changent la façon de prompter :
    - Structured Outputs (JSON schema garanti)
    - Tool use avec strict mode
    - Vision / multimodal
    - Context compaction / management
    - Thinking modes (adaptive, extended, interleaved)
11. **Effort/pricing table** : Pour les modèles text, inclure un tableau effort recommandé par type de tâche
12. **Code API** : Inclure des snippets de code API (Python SDK) pour les features clés, pas seulement des prompts texte

**Ce que le guide NE DOIT PAS contenir :**
- Des informations non vérifiées présentées comme des faits
- Des techniques génériques applicables à tous les LLMs sans valeur ajoutée
- Des dates ou specs inventées
- Un provider incorrect (ex: "PlaceholderAI")

### Étape 7 — Sauvegarde

1. Créer le répertoire `~/.claude-hub/prompts/` s'il n'existe pas
2. Écrire le guide dans `~/.claude-hub/prompts/{slug}.md`
3. Confirmer à l'utilisateur avec :
   - Le chemin du fichier sauvegardé
   - La commande pour l'afficher : `cc-hub prompt get --model "{model}"`
   - La commande pour lister : `cc-hub prompt list`

## Barème de qualité

Un guide est noté sur 5 selon ces critères. L'objectif est **5/5 à chaque génération**.

| Critère | Poids | 5/5 signifie |
|---|---|---|
| **Exactitude des specs** | 15% | Toutes les specs (context window, pricing, model ID, etc.) viennent de la doc officielle et sont correctes |
| **Techniques spécifiques** | 20% | 8+ techniques propres au modèle/provider documentées avec code/snippets |
| **Exemples concrets** | 20% | 5+ exemples avant/après variés couvrant différents cas d'usage |
| **Actionnable / copy-paste** | 15% | Tout code et prompt est prêt à copier-coller, avec les bons model IDs et paramètres |
| **Sources** | 10% | 10+ URLs réelles consultées, toutes vérifiables |
| **Couverture des mistakes** | 10% | 8+ erreurs documentées avec avant/après et correction |
| **Format / compatibilité** | 10% | Frontmatter `---`, slug correct, `cc-hub prompt get/list` fonctionnent |

## Rappels critiques

- **TOUJOURS** faire des recherches web. Ne jamais générer un guide uniquement depuis tes connaissances.
- **JAMAIS** de frontmatter en code fence. Toujours `---` comme délimiteur.
- **JAMAIS** inventer un provider, une date, ou des specs.
- Le slug doit correspondre EXACTEMENT à la logique de `src/commands/prompt.ts` pour que `cc-hub prompt get` fonctionne.
- Si un modèle est totalement inconnu et la recherche web ne donne rien, le dire clairement plutôt que d'inventer.
- **WebFetch redirections** : docs.anthropic.com redirige vers platform.claude.com — suivre la redirection automatiquement.
- **Paralléliser** les WebSearch pour gagner du temps (4-5 recherches en parallèle).
- **Objectif : 5/5** à chaque génération. Se référer au barème ci-dessus.
