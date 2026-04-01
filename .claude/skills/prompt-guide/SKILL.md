---
name: prompt-guide
description: >
  Générer un guide de prompt engineering sourcé pour un modèle IA.
  Recherche web sur la doc officielle, benchmarks et best practices,
  puis rédige un guide précis sauvegardé dans ~/.claude-hub/prompts/.
argument-hint: --model "provider/model" --type text|image|video|audio
---

# Skill: prompt-guide

Tu es un expert en prompt engineering. Ta mission est de générer un guide de prompting **opérationnel et actionnable** pour un modèle IA donné. Le guide doit dire **comment prompter** le modèle, pas décrire ce qu'il sait faire. Zéro pricing, zéro benchmarks, zéro specs techniques — uniquement des instructions de prompting.

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

3. **Prompt recipes and patterns** — Chercher les patterns de prompting recommandés par type de tâche
   - Query exemple : `"{model name}" prompt recipe template coding review`

4. **Common mistakes** — Chercher les anti-patterns et erreurs de prompting
   - Query exemple : `"{model name}" prompting mistakes anti-patterns gotchas`

5. **API features that change prompting** — Chercher les features API qui affectent la construction de prompts
   - Query exemple : `"{provider}" structured outputs tool use reasoning effort`

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

**Read** [`references/type-{type}-template.md`](references/type-{type}-template.md) correspondant au type demandé.

Ce fichier définit la structure block-based du guide :
- Pour `text` : Core Prompting Rules → Block Catalog (Prompt Blocks + API Controls) → Task Recipes → Anti-Patterns → Sources
- Pour `image` : Core Prompting Rules → Prompt Structure → Style & Keywords → Anti-Patterns → Sources
- Pour `video` : Core Prompting Rules → Prompt Structure → Motion & Camera Keywords → Anti-Patterns → Sources
- Pour `audio` : Core Prompting Rules → Configuration → Anti-Patterns → Sources

Chaque section a ses critères de qualité et minimums. Suivre le template exactement.

### Étape 6 — Rédaction du guide

Synthétiser toute la recherche en suivant le template de type.

**Philosophie : block-based operator style.** Structure guides as operator references, not personality descriptions. Prompt Blocks go in prompt text, API Controls go in API call envelope — never mix.

**Règles de rédaction :**

1. **Langue** : Anglais
2. **Public cible** : Le guide est consommé par un assistant IA (Claude Code) pour crafter des prompts optimisés. Écrire comme un document de référence parsable, pas une fiche marketing.
3. **Spécificité** : Chaque recommandation DOIT être spécifique au modèle, pas générique
   - MAL : "Use clear instructions"
   - BIEN : "Claude responds best to XML-tagged sections like `<context>...</context>`"
4. **Recipes** : Pour les modèles text, chaque recette référence des blocs du Block Catalog par nom, avec des slots dynamiques (`{user_task}`, `{code_to_review}`) — pas de templates vagues, pas d'exemples concrets sans slots
5. **Block Catalog** : Séparer clairement Prompt Blocks (dans le texte du prompt) et API Controls (dans l'enveloppe API). Chaque contrôle avec un snippet SDK Python.
6. **Anti-Patterns** : Format bad/better/why — chaque entrée doit être spécifique au modèle
7. **Format de sortie** : Suivre le template **Read** [`templates/guide-output.md`](templates/guide-output.md)
8. **Frontmatter** : Utiliser `---` comme délimiteurs (PAS ` ```yaml `). C'est critique pour la compatibilité.
9. **Date** : Utiliser la date du jour pour `last_updated`
10. **Size budget** : Max 200 lignes (text), 120 lignes (non-text)

**Ce que le guide DOIT contenir :**
- Core Prompting Rules : 5-10 règles opérationnelles incluant les shifts de comportement vs modèle précédent
- Block Catalog (text) : 6+ prompt blocks avec exemples + 4+ API controls avec snippets SDK Python
- Task Recipes (text) : 4+ recettes complètes avec slots dynamiques et références aux blocs
- Anti-Patterns : 8+ entrées bad/better/why (text), 5+ (non-text)
- Effort/reasoning level table intégrée dans API Controls

**Ce que le guide NE DOIT PAS contenir :**
- Pricing, benchmarks, release dates, capability lists
- Specs techniques (context window, max output, etc.) sauf si elles changent la stratégie de prompting
- Techniques génériques applicables à tous les LLMs
- Identity/personality descriptions ("you are a world-class expert", "GPT-5.4 is OpenAI's most capable model")
- "Ideal Use Cases", "Strengths", "Limitations" (descriptions de capacités)
- Un provider incorrect (ex: "PlaceholderAI")
- Templates avec placeholders vagues sans sémantique
- API techniques séparées des blocs de prompt (les intégrer dans Block Catalog)

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
| **Core Prompting Rules** | 15% | Règles opérationnelles uniquement, pas d'identity/marketing, shifts de migration |
| **Block Catalog** | 20% | Catalogue complet : prompt blocks + API controls avec snippets SDK Python |
| **Task Recipes** | 25% | 4+ recettes complètes avec slots dynamiques et références aux blocs |
| **Anti-Patterns** | 20% | 8+ entrées bad/better/why spécifiques au modèle |
| **Actionnable / copy-paste** | 10% | Tout code et prompt prêt à utiliser, zéro prose descriptive |
| **Zéro specs inutiles** | 5% | Aucun pricing, benchmark, release date, capability list, identity |
| **Format / compatibilité** | 5% | Frontmatter `---`, slug correct, max 200 lignes (text) / 120 (non-text) |

## Rappels critiques

- **TOUJOURS** faire des recherches web. Ne jamais générer un guide uniquement depuis tes connaissances.
- **JAMAIS** de frontmatter en code fence. Toujours `---` comme délimiteur.
- **JAMAIS** inventer un provider, une date, ou des specs.
- Le slug doit correspondre EXACTEMENT à la logique de `src/commands/prompt.ts` pour que `cc-hub prompt get` fonctionne.
- Si un modèle est totalement inconnu et la recherche web ne donne rien, le dire clairement plutôt que d'inventer.
- **WebFetch redirections** : docs.anthropic.com redirige vers platform.claude.com — suivre la redirection automatiquement.
- **Paralléliser** les WebSearch pour gagner du temps (4-5 recherches en parallèle).
- **Objectif : 5/5** à chaque génération. Se référer au barème ci-dessus.
