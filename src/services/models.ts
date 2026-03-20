import { MODELS, type Model, type ModelType, type ProviderName } from '../data/models.ts';

const byId = new Map<string, Model>(MODELS.map((m) => [m.id, m]));

export function findModel(id: string): Model | undefined {
  return byId.get(id);
}

export function findByProviderName(provider: ProviderName, name: string): Model | undefined {
  return MODELS.find((m) => m.providers[provider] === name);
}

export function toProviderName(id: string, provider: ProviderName): string {
  const model = byId.get(id);
  if (!model) throw new Error(`Unknown model: ${id}`);
  const native = model.providers[provider];
  if (!native) throw new Error(`${id} is not available on ${provider}`);
  return native;
}

export function resolveForProvider(userInput: string, provider: ProviderName): string {
  const model = byId.get(userInput);
  if (model) {
    const native = model.providers[provider];
    if (native) return native;
    throw new Error(
      `${userInput} is not available on ${provider}. ` +
        `Use 'cc-hub models list --provider ${provider}' to see available models.`,
    );
  }
  if (provider === 'openrouter') return userInput;
  throw new Error(
    `Unknown model: ${userInput}. ` +
      `Use 'cc-hub models list --provider ${provider}' to see available models.`,
  );
}

export function modelToSlug(id: string): string {
  return id
    .replace(/\//g, '-')
    .replace(/[^a-z0-9-]/gi, '')
    .toLowerCase();
}

export function listModels(opts?: { type?: ModelType; provider?: ProviderName }): Model[] {
  return MODELS.filter((m) => {
    if (opts?.type && m.type !== opts.type) return false;
    if (opts?.provider && !m.providers[opts.provider]) return false;
    return true;
  });
}

export { type Model, type ModelType, type ProviderName } from '../data/models.ts';
export { VALID_TYPES } from '../data/models.ts';
