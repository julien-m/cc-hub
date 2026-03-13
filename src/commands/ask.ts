import { Command } from 'commander';
import { askLLM } from '../services/openrouter.ts';

export function createAskCommand(): Command {
  const ask = new Command('ask')
    .description('Poser une question à un LLM')
    .argument('<prompt>', 'Prompt à envoyer au modèle')
    .option('--model <model>', 'Modèle à utiliser (surcharge ASK_MODEL)')
    .action(async (prompt: string, opts: { model?: string }) => {
      try {
        let stdin: string | undefined;
        if (!process.stdin.isTTY) {
          stdin = await readStdin();
        }

        const response = await askLLM(prompt, {
          model: opts.model,
          stdin,
        });

        process.stdout.write(response);
        if (!response.endsWith('\n')) process.stdout.write('\n');
      } catch (err) {
        console.error(`❌ ${(err as Error).message}`);
        process.exit(4);
      }
    });

  return ask;
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk: string) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}
