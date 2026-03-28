/**
 * Options for querying an LLM (OpenRouter, Poyo, or Copilot).
 * @property model - Model identifier (e.g. "openai/gpt-5.4").
 * @property systemPrompt - Custom system prompt to prepend to the message.
 * @property stdin - Piped input from stdin (used when input comes from pipe).
 * @property files - Array of files to include as context.
 * @property effort - Effort level for long thinking (low, medium, high).
 * @property json - Request JSON output from the model.
 * @property jsonSchema - JSON schema for structured output.
 */
export interface AskOptions {
  model?: string;
  systemPrompt?: string;
  stdin?: string;
  files?: Array<{ path: string; content: string }>;
  effort?: 'low' | 'medium' | 'high';
  json?: boolean;
  jsonSchema?: Record<string, unknown>;
}
