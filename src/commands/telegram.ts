import { existsSync } from 'node:fs';
import { Command } from 'commander';
import { sendMessage, sendDocument, sendMediaGroup } from '../services/telegram.ts';

export function createTelegramCommand(): Command {
  const telegram = new Command('telegram').description(
    'Envoyer des messages via Telegram',
  );

  telegram
    .command('send <message>')
    .description('Envoyer un message texte (Markdown)')
    .action(async (message: string) => {
      try {
        await sendMessage(message);
        console.error('✅ Message envoyé');
      } catch (err) {
        console.error(`❌ ${(err as Error).message}`);
        process.exit(4);
      }
    });

  telegram
    .command('send-file')
    .description('Envoyer un ou plusieurs fichiers')
    .argument('<files...>', 'Fichiers à envoyer')
    .option('--caption <text>', 'Légende (Markdown)')
    .action(async (files: string[], opts: { caption?: string }) => {
      const existing = files.filter((f) => {
        if (!existsSync(f)) {
          console.error(`⚠️  Fichier introuvable: ${f}`);
          return false;
        }
        return true;
      });

      if (existing.length === 0) {
        console.error('❌ Aucun fichier valide à envoyer');
        process.exit(1);
      }

      try {
        if (existing.length === 1) {
          await sendDocument(existing[0], opts.caption);
        } else {
          await sendMediaGroup(existing, opts.caption);
        }
        console.error(`✅ ${existing.length} fichier${existing.length > 1 ? 's' : ''} envoyé${existing.length > 1 ? 's' : ''}`);
      } catch (err) {
        console.error(`❌ ${(err as Error).message}`);
        process.exit(4);
      }
    });

  return telegram;
}
