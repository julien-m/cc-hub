import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { getEnv } from './env.ts';

interface TelegramCredentials {
  token: string;
  chatId: string;
}

interface MediaEntry {
  type: string;
  media: string;
  caption?: string;
  parse_mode?: string;
}

function getCredentials(): TelegramCredentials {
  const token = getEnv('TELEGRAM_BOT_TOKEN');
  const chatId = getEnv('TELEGRAM_CHAT_ID');
  if (!token || !chatId) {
    console.error('Telegram non configuré — vérifie TELEGRAM_BOT_TOKEN et TELEGRAM_CHAT_ID dans .env');
    process.exit(3);
  }
  return { token, chatId };
}

export async function sendMessage(text: string): Promise<unknown> {
  const { token, chatId } = getCredentials();

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telegram sendMessage failed: ${err}`);
  }

  return res.json();
}

export async function sendDocument(filePath: string, caption?: string): Promise<unknown> {
  const { token, chatId } = getCredentials();

  const fileContent = readFileSync(filePath);
  const fileName = basename(filePath);

  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('document', new Blob([fileContent]), fileName);
  if (caption) {
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telegram sendDocument failed: ${err}`);
  }

  return res.json();
}

export async function sendMediaGroup(filePaths: string[], caption?: string): Promise<unknown> {
  const { token, chatId } = getCredentials();

  const formData = new FormData();
  formData.append('chat_id', chatId);

  const media: MediaEntry[] = filePaths.map((fp, i) => {
    const fileName = basename(fp);
    const attachKey = `file${i}`;
    formData.append(attachKey, new Blob([readFileSync(fp)]), fileName);
    const entry: MediaEntry = { type: 'document', media: `attach://${attachKey}` };
    if (i === 0 && caption) {
      entry.caption = caption;
      entry.parse_mode = 'Markdown';
    }
    return entry;
  });

  formData.append('media', JSON.stringify(media));

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telegram sendMediaGroup failed: ${err}`);
  }

  return res.json();
}
