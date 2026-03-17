import { getEnv } from './env.ts';

interface AskOptions {
  model?: string;
  stdin?: string;
  files?: Array<{ path: string; content: string }>;
  effort?: 'low' | 'medium' | 'high';
  json?: boolean;
  jsonSchema?: object;
}

export async function askLLM(prompt: string, opts: AskOptions = {}): Promise<string> {
  const apiKey = getEnv('OPENROUTER_API_KEY');
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY non configuré dans .env');
    process.exit(3);
  }
  const model = opts.model || getEnv('ASK_MODEL');
  if (!model) {
    console.error('Aucun modèle spécifié — utilise --model <model>');
    process.exit(1);
  }

  const messages: Array<{ role: string; content: string }> = [];

  if (opts.json) {
    messages.push({ role: 'system', content: 'Respond with valid JSON only. No markdown, no explanation, no code fences.' });
  }

  // Message 1: the prompt (intent first)
  messages.push({ role: 'user', content: prompt });

  // Message 2: files + stdin as context (if any)
  const contextParts: string[] = [];

  if (opts.files?.length) {
    const { buildFileContext } = await import('../utils/files.ts');
    contextParts.push(buildFileContext(opts.files));
  }

  if (opts.stdin) {
    contextParts.push(`<stdin>\n${opts.stdin}\n</stdin>`);
  }

  if (contextParts.length > 0) {
    messages.push({ role: 'user', content: contextParts.join('\n\n') });
  }

  const baseUrl = getEnv('OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1';

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/cc-hub',
      'X-Title': 'cc-hub',
    },
    body: JSON.stringify({
      model,
      messages,
      ...(opts.json && {
        response_format: opts.jsonSchema
          ? { type: 'json_schema', json_schema: opts.jsonSchema }
          : { type: 'json_object' },
      }),
      ...(opts.effort && {
        reasoning: {
          effort: opts.effort,
          exclude: true,
        },
      }),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error (${res.status}): ${err}`);
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Unexpected OpenRouter response format');
  }

  return data.choices[0].message.content;
}
