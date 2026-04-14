/** Command handler for sending messages and files via Telegram. */

import { existsSync } from "node:fs";
import { Command } from "commander";
import { exitCode } from "../errors.ts";
import { sendDocument, sendMediaGroup, sendMessage } from "../services/telegram.ts";

/**
 * Create the `telegram` command group.
 * @returns The configured Commander command.
 */
export const createTelegramCommand = (): Command => {
	const telegram = new Command("telegram").description("Send messages via Telegram");

	telegram
		.command("send <message>")
		.description("Send a text message (Markdown)")
		.action(async (message: string) => {
			try {
				await sendMessage(message);
				console.error("Message sent");
			} catch (err) {
				console.error(
					`Failed to send Telegram message: ${(err as Error).message}. ` +
						"Check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.",
				);
				process.exit(exitCode(err, 4));
			}
		});

	telegram
		.command("send-file")
		.description("Send one or more files")
		.argument("<files...>", "Files to send")
		.option("-c, --caption <text>", "Caption (Markdown)")
		.action(async (files: string[], opts: { caption?: string }) => {
			const existing = files.filter((f) => {
				if (!existsSync(f)) {
					console.error(`File not found: ${f}`);
					return false;
				}
				return true;
			});

			if (existing.length === 0) {
				console.error("No valid files to send");
				process.exit(2);
			}

			try {
				if (existing.length === 1) {
					await sendDocument(existing[0], opts.caption);
				} else {
					await sendMediaGroup(existing, opts.caption);
				}
				console.error(`${existing.length} file${existing.length > 1 ? "s" : ""} sent`);
			} catch (err) {
				console.error(
					`Failed to send file(s) via Telegram: ${(err as Error).message}. ` +
						"Check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.",
				);
				process.exit(exitCode(err, 4));
			}
		});

	return telegram;
};
