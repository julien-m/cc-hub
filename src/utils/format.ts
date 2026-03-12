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
  tech_watch: '🔍',
  pull_request: '🔀',
  code_refactor: '♻️',
  bug_fix: '🐛',
  code_review: '👀',
  test_run: '🧪',
  deploy: '🚀',
  documentation: '📝',
  summary_sent: '📬',
  data_analysis: '📊',
  image_gen: '🎨',
  video_gen: '🎬',
  transcription: '🎙️',
  prompt_used: '💡',
  backup: '💾',
  notification_sent: '🔔',
  task_scheduled: '📅',
  error: '❌',
  other: '📌',
};

const STATUS_ICONS: Record<string, string> = {
  success: '✅',
  failed: '⚠️',
  partial: '⏳',
};

export function typeIcon(type: string): string {
  return TYPE_ICONS[type] || '📌';
}

export function statusIcon(status: string): string {
  return STATUS_ICONS[status] || '❓';
}

export function formatEvent(event: EventRow): string {
  const icon = statusIcon(event.status);
  const time = new Date(event.created_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const artifact = event.artifact_path ? ' 📎 artifact' : '';
  return `${icon} ${event.title} (${time})${artifact}`;
}

export function formatEventDetail(event: EventRow): string {
  const lines = [
    `${statusIcon(event.status)} ${event.title}`,
    `   Type: ${typeIcon(event.type)} ${event.type}`,
    `   Status: ${event.status}`,
    `   Date: ${event.created_at}`,
    `   Source: ${event.source}`,
  ];
  if (event.details) lines.push(`   Details: ${event.details}`);
  if (event.artifact_path) lines.push(`   Artifact: ${event.artifact_path}`);
  return lines.join('\n');
}
