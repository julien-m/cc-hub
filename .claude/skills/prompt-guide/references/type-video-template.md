# Template: Guide de prompting pour modèles Video

## Sections obligatoires

Chaque guide pour un modèle de type `video` DOIT contenir ces sections dans cet ordre.
Les minimums indiqués sont des **planchers** — en faire plus est toujours mieux.

---

### 1. Model Overview

**Contenu requis :**
- Durée(s) de vidéo supportée(s) (exactes)
- Résolution(s) et FPS
- Pricing (si applicable)
- Styles et types de contenu supportés
- Limites connues (durée max, sujets, cohérence)
- Input accepté (texte seul, image + texte, vidéo + texte)
- Provider réel

**Critères qualité :**
- Specs vérifiées via doc officielle
- Ne pas inventer de durées ou résolutions

---

### 2. Key Principles

**Contenu requis :**
- Philosophie du prompting vidéo pour CE modèle
- Comment décrire le mouvement efficacement
- Flow temporel : début → milieu → fin
- Gestion de la caméra
- Cohérence temporelle (comment maintenir la consistance)

**Critères qualité :**
- Spécifique au modèle, pas des conseils génériques de vidéo
- Basé sur la doc et les retours communauté

---

### 3. Prompt Structure

**Contenu requis :**
- Ordre recommandé des éléments :
  1. Sujet principal
  2. Mouvement / action (CRUCIAL pour la vidéo)
  3. Setting / environnement
  4. Mouvement de caméra
  5. Style visuel
  6. Durée souhaitée (si applicable)
- Syntaxe spécifique au modèle

**Critères qualité :**
- L'ordre doit être validé par la doc ou l'expérience
- Inclure un exemple complet

---

### 4. Motion & Camera Keywords

**Contenu requis :**
- Keywords de mouvement vérifiés pour ce modèle :
  - Mouvements de caméra (pan, tilt, dolly, tracking, crane, orbit)
  - Mouvements de sujet (walk, run, turn, gesture)
  - Transitions (fade, cut, morph)
  - Vitesse (slow motion, time-lapse, speed ramp)
- Impact de chaque keyword

**Critères qualité :**
- UNIQUEMENT des keywords vérifiés pour ce modèle
- Ne PAS copier une liste générique
- Si les keywords ne sont pas documentés, le mentionner

---

### 5. Best Practices

**Contenu requis :**
- 5+ pratiques actionnables
- Consistency entre frames
- Gestion des transitions
- Durée optimale vs qualité
- Aspect ratios supportés
- Techniques de raffinement

**Critères qualité :**
- Spécifique au modèle
- Actionnable avec exemples

---

### 6. Common Mistakes

**Contenu requis :**
- 5+ erreurs spécifiques à la génération vidéo avec avant/après
- Exemples : trop de sujets, mouvements contradictoires, descriptions statiques
- Correction pour chaque erreur

**Critères qualité :**
- Basé sur des retours réels

---

### 7. Examples

**Contenu requis :**
- 5+ exemples avant/après
- Prompt faible → prompt optimisé → explication
- Montrer l'impact sur le mouvement et la cohérence

**Critères qualité :**
- Illustrer les techniques du guide
- Couvrir différents types de contenu vidéo

---

### 8. Sources

**Contenu requis :**
- 5+ URLs consultées
- Format : `- [Titre descriptif](URL)`

**Critères qualité :**
- UNIQUEMENT des URLs réellement consultées
- Ne JAMAIS inventer une URL
