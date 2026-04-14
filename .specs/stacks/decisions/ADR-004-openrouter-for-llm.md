# ADR-004: OpenRouter as Unified LLM Gateway

- **Date:** 2026-04-14
- **Status:** Observed (from existing codebase)
- **Context:** cc-hub needs to expose LLM access to Claude Code and scripts across multiple model providers (Anthropic, OpenAI, Google, etc.). Managing multiple provider SDKs and API keys would be complex.
- **Decision:** Route all LLM calls through OpenRouter (`src/services/openrouter.ts`). Use canonical model IDs in `provider/model-name` format.
- **Evidence:** `OPENROUTER_API_KEY` credential, `src/services/openrouter.ts`, `src/data/models.ts` (model catalog), `--model openrouter/...` pattern in README.
- **Alternatives considered:**
  - **Direct Anthropic SDK** — Locks to one provider. More reliable for Claude-specific features but no multi-model.
  - **LiteLLM** — More comprehensive proxy, but requires a running server.
  - **Per-provider SDKs** — One SDK per provider, one key per provider. More config overhead, harder to switch models.
- **Consequences:**
  - Single `OPENROUTER_API_KEY` manages access to all LLM providers
  - Canonical model IDs (`anthropic/claude-sonnet-4.6`, `openai/gpt-5.4`) are provider-agnostic
  - `cc-hub models list` can enumerate all available models via OpenRouter API
  - OpenRouter becomes a dependency — downtime affects all LLM access
  - Rate limits and pricing per OpenRouter's terms

---

*Note: This ADR documents an observed choice, not a deliberate decision made during planning.*
