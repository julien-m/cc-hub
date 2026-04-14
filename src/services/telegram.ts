import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { ConfigError } from "../errors.ts";
import { getEnv } from "./env.ts";

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

interface TelegramResponse {
	ok: boolean;
	result: Record<string, unknown>;
}

const getCredentials = (): TelegramCredentials => {
	const token = getEnv("TELEGRAM_BOT_TOKEN");
	const chatId = getEnv("TELEGRAM_CHAT_ID");
	if (!token || !chatId) {
		throw new ConfigError("Telegram not configured — check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env");
	}
	return { token, chatId };
};

/**
 * Sends a text message via Telegram Bot API.
 * @param text - The message text (Markdown supported)
 * @returns The Telegram API response
 * @throws ConfigError if credentials are missing
 */
export const sendMessage = async (text: string): Promise<TelegramResponse> => {
	const { token, chatId } = getCredentials();

	const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			chat_id: chatId,
			text,
			parse_mode: "Markdown",
		}),
		signal: AbortSignal.timeout(10_000),
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Telegram sendMessage failed: ${err}`);
	}

	return res.json() as Promise<TelegramResponse>;
};

/**
 * Sends a document file via Telegram Bot API.
 * @param filePath - Absolute path to the file to send
 * @param caption - Optional caption (Markdown supported)
 * @returns The Telegram API response
 * @throws ConfigError if credentials are missing
 */
export const sendDocument = async (filePath: string, caption?: string): Promise<TelegramResponse> => {
	const { token, chatId } = getCredentials();

	const fileContent = readFileSync(filePath);
	const fileName = basename(filePath);

	const formData = new FormData();
	formData.append("chat_id", chatId);
	formData.append("document", new Blob([fileContent]), fileName);
	if (caption) {
		formData.append("caption", caption);
		formData.append("parse_mode", "Markdown");
	}

	const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
		method: "POST",
		body: formData,
		signal: AbortSignal.timeout(10_000),
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Telegram sendDocument failed: ${err}`);
	}

	return res.json() as Promise<TelegramResponse>;
};

/**
 * Sends multiple files as a media group via Telegram Bot API.
 * @param filePaths - Array of absolute file paths to send
 * @param caption - Optional caption for the first file (Markdown supported)
 * @returns The Telegram API response
 * @throws ConfigError if credentials are missing
 */
export const sendMediaGroup = async (filePaths: string[], caption?: string): Promise<TelegramResponse> => {
	const { token, chatId } = getCredentials();

	const formData = new FormData();
	formData.append("chat_id", chatId);

	const media: MediaEntry[] = filePaths.map((fp, i) => {
		const fileName = basename(fp);
		const attachKey = `file${i}`;
		formData.append(attachKey, new Blob([readFileSync(fp)]), fileName);
		const entry: MediaEntry = { type: "document", media: `attach://${attachKey}` };
		if (i === 0 && caption) {
			entry.caption = caption;
			entry.parse_mode = "Markdown";
		}
		return entry;
	});

	formData.append("media", JSON.stringify(media));

	const res = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
		method: "POST",
		body: formData,
		signal: AbortSignal.timeout(10_000),
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Telegram sendMediaGroup failed: ${err}`);
	}

	return res.json() as Promise<TelegramResponse>;
};
