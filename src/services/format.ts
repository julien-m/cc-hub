export interface EventRow {
	id: number;
	created_at: string;
	source: string;
	type: string;
	status: string;
	title: string;
	details: string | null;
	artifact_path: string | null;
	important: number;
}

const TYPE_ICONS: Record<string, string> = {
	tech_watch: "🔍",
	pull_request: "🔀",
	code_refactor: "♻️",
	bug_fix: "🐛",
	code_review: "👀",
	test_run: "🧪",
	deploy: "🚀",
	documentation: "📝",
	summary_sent: "📬",
	data_analysis: "📊",
	image_gen: "🎨",
	video_gen: "🎬",
	transcription: "🎙️",
	prompt_used: "💡",
	backup: "💾",
	notification_sent: "🔔",
	task_scheduled: "📅",
	error: "❌",
	other: "📌",
};

const STATUS_ICONS: Record<string, string> = {
	success: "✅",
	failed: "⚠️",
	partial: "⏳",
};

/**
 * Returns the icon for a given event type.
 * @param type - The event type string.
 * @returns The corresponding emoji icon, or a default pin icon.
 */
export const typeIcon = (type: string): string => {
	return TYPE_ICONS[type] || "📌";
};

/**
 * Returns the icon for a given event status.
 * @param status - The event status string.
 * @returns The corresponding emoji icon, or a question mark icon.
 */
export const statusIcon = (status: string): string => {
	return STATUS_ICONS[status] || "❓";
};

/**
 * Formats an event row as a single-line summary string.
 * @param event - The event row to format.
 * @returns A formatted string with status icon, title, time, and optional artifact indicator.
 */
export const formatEvent = (event: EventRow): string => {
	const icon = statusIcon(event.status);
	const time = new Date(event.created_at).toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
	});
	const artifact = event.artifact_path ? " 📎 artifact" : "";
	return `${icon} ${event.title} (${time})${artifact}`;
};

/**
 * Formats an event row as a multi-line detail string.
 * @param event - The event row to format.
 * @returns A formatted multi-line string with all event fields.
 */
export const formatEventDetail = (event: EventRow): string => {
	const lines = [
		`${statusIcon(event.status)} ${event.title}`,
		`   Type: ${typeIcon(event.type)} ${event.type}`,
		`   Status: ${event.status}`,
		`   Date: ${event.created_at}`,
		`   Source: ${event.source}`,
	];
	if (event.details) lines.push(`   Details: ${event.details}`);
	if (event.artifact_path) lines.push(`   Artifact: ${event.artifact_path}`);
	return lines.join("\n");
};
