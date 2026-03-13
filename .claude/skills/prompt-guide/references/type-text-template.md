# Template: Guide de prompting pour modèles Text/LLM

## Sections obligatoires

Chaque guide pour un modèle de type `text` DOIT contenir ces sections dans cet ordre.
Les minimums indiqués sont des **planchers** — en faire plus est toujours mieux.

---

### 1. Model Overview

**Contenu requis :**
- Context window en tokens (nombre exact, pas "large")
- Max output tokens
- Pricing (input/output par million de tokens)
- Model ID(s) (API, Bedrock, Vertex si applicable)
- Knowledge cutoff (reliable + training data)
- Positionnement dans la gamme du provider (vs modèles frères)
- 3+ forces vérifiées du modèle (sourcées)
- Limites connues
- Cas d'usage idéaux
- Disponibilité (API, cloud providers)

**Contenu enrichi (si applicable) :**
- **Behavioral shifts** : ce qui a changé vs le modèle précédent. Ex: "Claude 4.6 takes instructions literally — previous versions would infer and expand." C'est crucial pour les utilisateurs qui migrent.

**Critères qualité :**
- Les specs doivent venir de la doc officielle, pas d'estimation
- Ne pas écrire "typically" ou "usually" pour des specs — être précis ou dire "à vérifier"
- Inclure les IDs exacts du modèle pour chaque plateforme

---

### 2. Key Prompting Techniques

**Contenu requis :**
- Techniques SPÉCIFIQUES au provider/modèle (pas de générique)
- Pour chaque technique : description + exemple de code/prompt
- 8+ techniques minimum

**Exemples de techniques par provider (à adapter selon la recherche) :**

| Provider | Techniques spécifiques |
|----------|----------------------|
| Anthropic | XML tags (`<context>`, `<instructions>`), adaptive thinking, effort parameter, structured outputs API (Pydantic), strict tool use, vision, context compaction, interleaved thinking, system prompt sensitivity |
| OpenAI | JSON mode, structured outputs, function calling, system/user/assistant roles, response format |
| Google | Grounding avec Google Search, system instructions, code execution intégrée, 1M context |

**Critères qualité :**
- INTERDICTION de lister des techniques génériques (ex: "be clear and specific")
- Chaque technique doit être propre au modèle ou au provider
- Inclure un snippet d'exemple pour chaque technique
- Pour les features API (structured outputs, tool use), inclure du code Python SDK — pas seulement du prompt texte

---

### 3. Prompt Structure

**Contenu requis :**
- Structure de messages réelle (system/user/assistant) avec la terminologie du provider
- Rôle de chaque partie du prompt
- Exemple concret et complet d'un prompt bien structuré
- Comment organiser les informations dans le contexte
- Règle d'ordering pour le long contexte (documents en haut, query en bas si applicable)

**Critères qualité :**
- L'exemple doit être copy-paste ready
- Montrer la hiérarchie : system prompt → context → instructions → exemples → contraintes

---

### 4. Advanced Techniques

**Contenu requis :**
- Chain-of-thought / raisonnement étape par étape (avec la syntaxe du modèle)
- Few-shot prompting (avec exemples XML-tagged si Claude)
- Structured output (JSON, XML, markdown) — y compris via API native
- Tool use / function calling (si supporté) — avec strict mode si disponible
- Paramètres de sampling (temperature, top_p, effort, etc.)
- Techniques avancées spécifiques au modèle
- Context management (compaction, multi-window si applicable)
- Vision / multimodal (si supporté)
- Interleaved thinking / tool reflection (si supporté)

**Critères qualité :**
- Chaque technique avec un exemple concret (code ou prompt)
- Indiquer quand utiliser chaque technique (cas d'usage)
- Mentionner les paramètres recommandés avec justification
- Inclure un tableau effort recommandé par type de tâche

---

### 5. Best Practices

**Contenu requis :**
- 6+ pratiques actionnables avec exemples copy-paste
- Chaque pratique avec un avant/après ou un snippet
- Couvrir : explicité, contexte/motivation, formulation positive, contraintes anti-over-engineering, contrôle du thinking, ordering du contexte

**Critères qualité :**
- Spécifique au modèle, pas des conseils universels
- Actionnable immédiatement (pas théorique)

---

### 6. Common Mistakes

**Contenu requis :**
- 8+ erreurs documentées (pas des erreurs universelles)
- Pour chaque erreur : avant (mauvais) → après (corrigé) + explication
- Couvrir : prefilling deprecated, over-prompting, vague instructions, document ordering, temperature misuse, XML tags ignorés, effort parameter ignoré, aggressive language, LaTeX default, subagent overuse

**Critères qualité :**
- Basé sur des retours réels (doc officielle, forums, expérience)
- Chaque erreur avec un snippet avant/après complet
- Format consistant pour chaque erreur

---

### 7. Examples

**Contenu requis :**
- 5+ exemples avant/après
- Chaque exemple avec : prompt faible → prompt optimisé → explication du POURQUOI
- Couvrir des cas d'usage variés :
  - Code review / coding
  - Data analysis / extraction
  - Anti-over-engineering (constraining output)
  - Vision + structured output (si multimodal)
  - Agentic / tool use scoped task

**Critères qualité :**
- Les exemples doivent illustrer des techniques décrites dans le guide
- Le "pourquoi" doit référencer une technique spécifique du modèle
- Exemples variés (simple, intermédiaire, avancé)

---

### 8. Sources

**Contenu requis :**
- 10+ URLs consultées pendant la recherche
- Format : `- [Titre descriptif](URL)`
- Classées par pertinence (doc officielle en premier)

**Critères qualité :**
- UNIQUEMENT des URLs réellement consultées
- Ne JAMAIS inventer une URL
- Inclure les pages de doc officielle, blog posts, et articles communauté
