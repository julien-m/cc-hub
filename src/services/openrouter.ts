import { getEnv } from './env.ts';

interface AskOptions {
  model?: string;
  stdin?: string;
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
  if (opts.stdin) {
    messages.push({ role: 'user', content: `${opts.stdin}\n\n${prompt}` });
  } else {
    messages.push({ role: 'user', content: prompt });
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
      max_tokens: 4096,
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
