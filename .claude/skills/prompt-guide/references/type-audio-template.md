# Template: Guide de prompting pour modèles Audio

## Sections obligatoires

Chaque guide pour un modèle de type `audio` DOIT contenir ces sections dans cet ordre.
Les minimums indiqués sont des **planchers** — en faire plus est toujours mieux.

---

### 1. Model Overview

**Contenu requis :**
- Tâches supportées (transcription, TTS, music generation, sound effects, etc.)
- Formats audio supportés (entrée et sortie)
- Langues supportées (avec liste si disponible)
- Qualité / précision (WER si disponible)
- Pricing (si applicable)
- Limites connues (durée max, bruit, accents)
- Provider réel

**Critères qualité :**
- Specs vérifiées via doc officielle
- Distinguer clairement les tâches supportées vs non supportées

---

### 2. Key Principles

**Contenu requis :**
- Philosophie d'utilisation pour CE modèle
- Préparation optimale de l'input audio
- Importance de la qualité audio source
- Comment le modèle gère le multilingual

**Critères qualité :**
- Spécifique au modèle et à ses tâches
- Basé sur la doc officielle

---

### 3. Configuration

**Contenu requis :**
- Paramètres API spécifiques au modèle
- Format d'entrée recommandé (sample rate, encoding, channels)
- Options de sortie (format, langue, timestamps)
- Paramètres de qualité/vitesse

**Critères qualité :**
- Paramètres exacts avec valeurs par défaut
- Syntaxe d'appel API si applicable

---

### 4. Best Practices

**Contenu requis :**
- 5+ pratiques actionnables
- Preprocessing audio (normalisation, débruitage, format)
- Chunking pour les fichiers longs
- Gestion du multilingual
- Optimisation latence vs qualité
- Post-processing des résultats

**Critères qualité :**
- Techniques actionnables avec exemples
- Spécifique au modèle

---

### 5. Common Mistakes

**Contenu requis :**
- 5+ erreurs spécifiques avec avant/après
- Exemples : mauvais format, input bruité, mauvais paramètres de langue
- Correction pour chaque erreur

**Critères qualité :**
- Basé sur des retours réels
- Inclure la solution pour chaque erreur

---

### 6. Examples

**Contenu requis :**
- 3+ exemples concrets d'utilisation
- Configuration optimale vs configuration par défaut
- Montrer l'impact sur la qualité/précision

**Critères qualité :**
- Exemples copy-paste ready (code ou config)
- Couvrir les cas d'usage principaux du modèle

---

### 7. Sources

**Contenu requis :**
- 5+ URLs consultées
- Format : `- [Titre descriptif](URL)`

**Critères qualité :**
- UNIQUEMENT des URLs réellement consultées
- Ne JAMAIS inventer une URL
