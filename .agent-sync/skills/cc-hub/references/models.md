# cc-hub — Modèles disponibles par commande

## Image (`cc-hub imagine`)

- Modèle par défaut : `google/gemini-3.1-flash-image`
- Disponibles : `google/gemini-3.1-flash-image`, `google/gemini-3.1-flash-image-edit`, `google/nano-banana-2` (pro), `google/nano-banana-2-edit`, `google/nano-banana`, `google/nano-banana-edit`, `bytedance/seedream-5.0-lite`, `bytedance/seedream-5.0-lite-edit`, `bytedance/seedream-4.5`, `bytedance/seedream-4.5-edit`, `openai/gpt-5.4-image-2`, `openai/gpt-5.4-image-2-edit`, `openai/gpt-image-1.5`, `openai/gpt-image-1.5-edit`, `openai/gpt-4o-image`, `openai/gpt-4o-image-edit`, `openai/z-image`, `bfl/flux-2-pro`, `bfl/flux-2-pro-edit`, `bfl/flux-2-flex`, `bfl/flux-2-flex-edit`, `xai/grok-imagine`
- Sizes : `1:1`, `16:9`, `9:16`, `3:2`, `2:3`, `4:3`, `3:4`, `4:5`, `5:4`, `21:9`
- Résolutions : `1K` (défaut), `2K`, `4K`

## Vidéo (`cc-hub video`)

- Modèle par défaut : `kuaishou/kling-3.0-pro`
- Disponibles : `kuaishou/kling-3.0-pro`, `kuaishou/kling-3.0-standard`, `kuaishou/kling-2.6`, `kuaishou/kling-2.6-motion-control`, `kuaishou/kling-2.5-turbo-pro`, `kuaishou/kling-2.1-standard`, `kuaishou/kling-2.1-pro`, `minimax/hailuo-2.3`, `minimax/hailuo-02`, `minimax/hailuo-02-pro`, `alibaba/wan-2.2-text-to-video-fast`, `alibaba/wan-2.2-image-to-video-fast`, `alibaba/wan-2.5-text-to-video`, `alibaba/wan-2.5-image-to-video`, `alibaba/wan-2.6-text-to-video`, `alibaba/wan-2.6-image-to-video`, `alibaba/wan-2.6-video-to-video`, `alibaba/wan-animate-move`, `alibaba/wan-animate-replace`, `bytedance/seedance-1.0-pro`, `bytedance/seedance-1.5-pro`, `runway/gen-4.5`, `google/veo-3.1-fast`, `google/veo-3.1-quality`, `openai/sora-2-official`, `openai/sora-2`, `openai/sora-2-pro`, `openai/sora-2-stable`, `xai/grok-imagine-video`
- Durée : 3-15 secondes (défaut : 5)
- Ratios : `16:9` (défaut), `1:1`, `9:16`

## Codex (`cc-hub codex`)

- Modèle par défaut : `openai/gpt-5.6-sol`
- Disponibles : `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra`, `openai/gpt-5.6-luna`, `openai/gpt-5.5`, `openai/gpt-5.4`, `openai/gpt-5.4-mini`, `openai/gpt-53-codex`, `openai/gpt-53-codex-spark`
- Effort `codex` : `minimal`, `low`, `medium`, `high`, `xhigh`, `max`, `ultra`; cc-hub mappe vers l'effort connu par modèle avant d'appeler le CLI Codex

## Ask / Copilot (`cc-hub ask` / `cc-hub copilot`)

- Modèle par défaut : `openai/gpt-5.4` (copilot), configurable (ask)
- Format : canonical ID OpenRouter (`provider/model-name`)
- Exemples OpenRouter text : `openai/gpt-oss-120b`, `z-ai/glm-5.2`
- Effort `ask` : `minimal`, `low`, `medium`, `high`, `xhigh`, `max`, `ultra`; cc-hub mappe vers l'effort OpenRouter supporté par modèle
- Voir `cc-hub models list --provider <provider>` pour la liste complète

<!-- model-catalog-010:start -->
<!-- @spec FR-005: Document verified text models — .specs/features/010-model-catalog-update/spec.md#fr-005 -->
These four text models are available through `ask` on OpenRouter:

| Canonical ID | OpenRouter native ID | Supported effort |
| --- | --- | --- |
| `openai/gpt-6.1-sol` | `openai/gpt-6.1-sol` | low, medium, high, xhigh, max |
| `anthropic/claude-sonnet-5.5` | `anthropic/claude-sonnet-5.5` | low, medium, high, xhigh, max |
| `anthropic/claude-opus-5.5` | `anthropic/claude-opus-5.5` | low, medium, high, xhigh, max |
| `xai/grok-4.6` | `x-ai/grok-4.6` | low, medium, high, xhigh |

The existing prompt/stdin, files, JSON/schema and effort options apply. `minimal → low`; `ultra → max` for GPT/Claude and `ultra → xhigh` for Grok. Omitting `--effort` preserves the provider default; explicit effort sends `reasoning: {effort, exclude: true}`. `exclude: true` controls reasoning output and does not disable mandatory reasoning. No verified mappings for Copilot, Codex or Poyo are added. Existing defaults and decision-model routes remain unchanged.

```bash
cc-hub ask "Explain this compiler error" -m openai/gpt-6.1-sol -e high
cc-hub ask "Summarize this file" -m anthropic/claude-sonnet-5.5 -f src/index.ts
cc-hub ask "Return JSON" -m anthropic/claude-opus-5.5 -j
cat question.txt | cc-hub ask -m xai/grok-4.6 -e ultra
```
<!-- model-catalog-010:end -->

## Musique (`cc-hub music`)

- Modèle par défaut : `poyo/generate-music`

## Motion Control (`cc-hub motion`)

- Modèle fixe : `kuaishou/kling-2.6-motion-control`

## Decide / Jev (`cc-hub decide` / `cc-hub jev`)

- Type: `decision`; OpenRouter uniquement, endpoint `/api/alpha/decisions`.
- Defaut reproductible: `typesafe/jev-1.13`; alias officiel latest: `~typesafe/jev-latest` (tilde obligatoire).
- Questions choice/score/noul et sortie JSON complete. Aucun effort de raisonnement/chat/prose.
- Lister: `cc-hub models list --provider openrouter --type decision`.

<!-- @spec FR-006: Luna and Jev Decisions metadata — .specs/features/009-decision-models/spec.md#fr-006 -->
- Luna Decisions: `openai/gpt-6-luna-decisions`, alias `luna-decisions`; OpenRouter, type `decision`, 1–200 questions. Jev seul conserve choice1–255/score1–10; aucune borne choice/score non documentee pour Luna/inconnus.
- Selection: flag `-m` > body `model` > Jev pinned; aliases normalises, IDs natifs inconnus preserves. `jev` reste alias de commande et accepte `-m luna-decisions`.
- State texte/JSON/images natives, questions choice/score/noul et extensions imbriquees preserves; reponse JSON complete (decimales/metadata/extensions), options pretty/answers-only/file conservees. Pas upload/conversion; parametres Decisions distincts de chat `supported_parameters`; support provider non garanti par passthrough.
- `ask` refuse Luna/Jev avec leurs aliases et indique `decide`; validation/dry-run sans credentials/reseau, timeout10000ms et aucune substitution/retry automatique.
- Exemple offline: `cc-hub decide -m luna-decisions --input '{"state":"Compiler tutorial","questions":{"useful":{"type":"noul","instructions":"Is this useful?"}}}' --dry-run`.
- **Read** [Luna Decisions](https://openrouter.ai/openai/gpt-6-luna-decisions) et [reference Decisions](https://openrouter.ai/docs/api/api-reference/alphadecisions/submit-a-decisions-request) pour les metadonnees et le contrat natif (sources verifiees2026-10-07).
