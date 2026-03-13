# Template: Guide de prompting pour modèles Image

## Sections obligatoires

Chaque guide pour un modèle de type `image` DOIT contenir ces sections dans cet ordre.
Les minimums indiqués sont des **planchers** — en faire plus est toujours mieux.

---

### 1. Model Overview

**Contenu requis :**
- Résolution(s) supportée(s) (exactes, pas "high resolution")
- Aspect ratios supportés
- Styles visuels dans lesquels le modèle excelle
- Vitesse de génération (si connue)
- Pricing (si applicable)
- Limites connues (sujets, styles, résolution)
- API ou interface utilisée
- Provider réel (pas "PlaceholderAI")

**Critères qualité :**
- Les specs doivent venir de la doc officielle
- Ne pas inventer de résolutions ou de capabilities

---

### 2. Key Principles

**Contenu requis :**
- Philosophie de prompting pour CE modèle spécifiquement
- Comment le modèle interprète les prompts (littéral vs créatif)
- Longueur de prompt optimale
- Langue(s) supportée(s)
- Ce qui distingue ce modèle des autres (Midjourney, DALL-E, Stable Diffusion)

**Critères qualité :**
- Basé sur la doc et les retours communauté, pas sur des suppositions
- Spécifique au modèle (pas de "soyez descriptif" générique)

---

### 3. Prompt Structure

**Contenu requis :**
- Ordre recommandé des éléments dans le prompt :
  1. Sujet principal
  2. Action / pose
  3. Setting / environnement
  4. Style artistique
  5. Éclairage
  6. Angle caméra
  7. Mood / atmosphère
- Syntaxe spécifique si applicable (poids, séparateurs, parenthèses)

**Critères qualité :**
- L'ordre doit être validé par la doc ou l'expérience communauté
- Inclure un exemple complet structuré

---

### 4. Style Keywords

**Contenu requis :**
- Keywords VÉRIFIÉS qui fonctionnent avec ce modèle
- Classés par catégorie : style artistique, éclairage, caméra, mood, medium
- Impact de chaque keyword sur le résultat

**Critères qualité :**
- UNIQUEMENT des keywords vérifiés pour ce modèle
- Ne PAS copier une liste générique de Stable Diffusion/Midjourney
- Si les keywords ne sont pas documentés, le mentionner et suggérer des tests

---

### 5. Best Practices

**Contenu requis :**
- 5+ pratiques actionnables
- Negative prompts (si supportés par le modèle)
- Syntaxe de poids (si supportée)
- Aspect ratios supportés
- Seeds / reproductibilité
- Techniques de raffinement itératif

**Critères qualité :**
- Ne mentionner que les fonctionnalités réellement supportées
- Inclure la syntaxe exacte (pas de pseudo-code)

---

### 6. Common Mistakes

**Contenu requis :**
- 5+ erreurs spécifiques à ce modèle avec avant/après
- Exemples de prompts problématiques → corrigés

**Critères qualité :**
- Basé sur des retours réels, pas théoriques
- Inclure le prompt corrigé pour chaque erreur

---

### 7. Examples

**Contenu requis :**
- 5+ exemples avant/après
- Prompt vague → prompt optimisé → explication du changement
- Couvrir des styles différents (photo, illustration, concept art, etc.)

**Critères qualité :**
- Les exemples doivent illustrer les techniques du guide
- Montrer l'impact concret de chaque amélioration

---

### 8. Sources

**Contenu requis :**
- 5+ URLs consultées
- Format : `- [Titre descriptif](URL)`

**Critères qualité :**
- UNIQUEMENT des URLs réellement consultées
- Ne JAMAIS inventer une URL
