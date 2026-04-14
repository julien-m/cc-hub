import type { Row } from "@libsql/client";
import { getDb } from "../db/index.ts";
import { statusIcon } from "./format.ts";

/**
 * Retrieves events from the database for digest generation.
 * @param since - Optional ISO date string; defaults to 24 hours ago
 * @returns Array of event rows ordered by creation time ascending
 */
export const getEventsForDigest = async (since?: string): Promise<Row[]> => {
	const db = await getDb();
	const sinceDate = since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

	const result = await db.execute({
		sql: "SELECT * FROM events WHERE created_at >= ? ORDER BY created_at ASC",
		args: [sinceDate],
	});

	return result.rows;
};

/**
 * Formats a list of events into a human-readable digest preview.
 * @param events - Array of event rows to format
 * @returns A formatted multi-line string summarizing the events
 */
export const formatDigestPreview = (events: Row[]): string => {
	if (events.length === 0) return "No events for this period.";

	const today = new Date().toLocaleDateString("en-US");
	const lines = [`Digest for ${today}`, "─────────────────────"];

	for (const event of events) {
		lines.push(
			`${statusIcon(String(event.status))} ${event.title} (${new Date(String(event.created_at)).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })})${event.artifact_path ? " [artifact]" : ""}`,
		);
	}

	const failed = events.filter((e) => e.status === "failed");
	if (failed.length > 0) {
		lines.push("");
		lines.push(
			`${failed.length} attention point${failed.length > 1 ? "s" : ""}: ${failed.map((e) => String(e.title)).join(", ")}`,
		);
	}

	return lines.join("\n");
};
