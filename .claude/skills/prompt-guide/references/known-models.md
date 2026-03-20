# Known Models Registry

Registre des modèles connus avec leurs traits clés pour accélérer la recherche et garantir la précision des guides.

> Ce registre est un **point de départ**. La recherche web reste obligatoire pour chaque guide — les informations ici peuvent être obsolètes.

> **Source of truth:** The canonical model registry is in `src/data/models.ts`. This file provides additional metadata (traits, documentation URLs, must-mention items) for guide generation, but model IDs and provider mappings should always match the code registry.

---

## Anthropic

### claude-opus-4.6 / anthropic/claude-opus-4.6
- **Provider:** Anthropic
- **Type:** text
- **Context window:** 200K tokens
- **Traits clés:**
  - XML tags pour structurer les prompts (`<context>`, `<instructions>`, `<examples>`)
  - Extended thinking (chain-of-thought interne)
  - Prefilling (pré-remplir la réponse de l'assistant)
  - Tool use / function calling
  - Vision (analyse d'images)
  - System prompts
- **Le guide DOIT mentionner:** XML tags, extended thinking, prefilling, tool use, vision
- **Doc officielle:** https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering

### claude-sonnet-4.6 / anthropic/claude-sonnet-4.6
- **Provider:** Anthropic
- **Type:** text
- **Context window:** 200K tokens
- **Traits clés:** Mêmes que Opus mais optimisé vitesse/coût. Meilleur rapport qualité/prix.
- **Le guide DOIT mentionner:** XML tags, extended thinking, prefilling, tool use, positionnement mid-tier
- **Doc officielle:** https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering

### claude-haiku-4.5 / anthropic/claude-haiku-4.5
- **Provider:** Anthropic
- **Type:** text
- **Context window:** 200K tokens
- **Traits clés:** Modèle le plus rapide et le moins cher. Idéal pour tâches simples, classification, extraction.
- **Le guide DOIT mentionner:** XML tags, cas d'usage speed-first, limites sur le raisonnement complexe
- **Doc officielle:** https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering

---

## OpenAI

### gpt-5.x / openai/gpt-5.x (gpt-52, gpt-53-codex, gpt-54, gpt-5-mini)
- **Provider:** OpenAI
- **Type:** text
- **Context window:** Varie selon le modèle (128K-1M+)
- **Traits clés:**
  - JSON mode / structured outputs
  - Function calling / tool use
  - System / user / assistant roles
  - Temperature, top_p, frequency/presence penalty
  - Instruction following fort
- **Le guide DOIT mentionner:** JSON mode, function calling, structured outputs, system prompts
- **Doc officielle:** https://platform.openai.com/docs/guides/prompt-engineering

### gpt-5-mini / openai/gpt-5-mini
- **Provider:** OpenAI
- **Type:** text
- **Traits clés:** Version compacte de GPT-5. Rapide, moins cher. Bon pour tâches simples.
- **Le guide DOIT mentionner:** Positionnement speed/cost, limites vs GPT-5 full
- **Doc officielle:** https://platform.openai.com/docs/guides/prompt-engineering

---

## Google

### gemini-2.5-flash / google/gemini-2.5-flash
- **Provider:** Google
- **Type:** text
- **Context window:** 1M tokens
- **Traits clés:**
  - Grounding avec Google Search
  - Code execution
  - System instructions
  - Multimodal (text, image, video, audio)
  - Très grande fenêtre de contexte
- **Le guide DOIT mentionner:** Grounding, 1M context, multimodal, system instructions
- **Doc officielle:** https://ai.google.dev/gemini-api/docs/prompting-strategies

### gemini-2.5-flash-lite / google/gemini-2.5-flash-lite
- **Provider:** Google
- **Type:** text
- **Traits clés:** Version allégée de Flash. Ultra rapide, très bon marché.
- **Doc officielle:** https://ai.google.dev/gemini-api/docs/prompting-strategies

### gemini-3.x / google/gemini-3.x (gemini-3-flash-preview, gemini-31-flash-lite-preview, gemini-31-pro-preview)
- **Provider:** Google
- **Type:** text
- **Context window:** 1M+ tokens
- **Traits clés:** Dernière génération. Capabilities à vérifier via recherche web.
- **Doc officielle:** https://ai.google.dev/gemini-api/docs/prompting-strategies

---

## Poyo

### nano-banana-2-new
- **Provider:** Poyo
- **Type:** image
- **Traits clés:**
  - Modèle de génération d'images
  - Style keywords à découvrir via recherche web
  - Capabilities spécifiques à vérifier
- **Le guide DOIT mentionner:** C'est un modèle IMAGE, pas un LLM texte
- **Doc officielle:** À rechercher (poyo.ai)

### kling-30-pro / kling-3.0-pro
- **Provider:** Poyo (via OpenRouter) / Kuaishou (créateur original)
- **Type:** video
- **Traits clés:**
  - Génération vidéo
  - Contrôle caméra
  - Durée variable
  - Capabilities spécifiques à vérifier via recherche web
- **Le guide DOIT mentionner:** C'est un modèle VIDEO. Camera control, durée, résolution.
- **Doc officielle:** À rechercher

---

## Soniox

### soniox
- **Provider:** Soniox
- **Type:** audio
- **Traits clés:**
  - Transcription temps réel
  - Multilingual
  - Speaker diarization
  - Capabilities spécifiques à vérifier via recherche web
- **Le guide DOIT mentionner:** C'est un modèle AUDIO de transcription, pas un générateur.
- **Doc officielle:** À rechercher (soniox.ai)
