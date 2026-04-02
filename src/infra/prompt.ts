/** Resolves the user prompt from a CLI argument, stdin, or both. */
import { readStdin } from './stdin.ts';
import { AppError } from '../errors.ts';

/** Result of prompt resolution. */
export interface ResolvedPrompt {
  /** The main prompt text (from arg or stdin). */
  prompt: string;
  /** Piped stdin content, only set when a prompt arg was also provided. */
  stdin?: string;
}

/**
 * Resolve the prompt from a positional CLI argument and/or piped stdin.
 *
 * | promptArg | stdin | Result                                        |
 * |-----------|-------|-----------------------------------------------|
 * | provided  | piped | prompt = arg, stdin = piped content            |
 * | provided  | no    | prompt = arg                                  |
 * | missing   | piped | prompt = piped content (stdin consumed)        |
 * | missing   | no    | error                                         |
 *
 * @param promptArg - The optional positional argument from Commander.
 * @returns The resolved prompt and optional stdin context.
 * @throws {AppError} When no prompt and no stdin are available (exit code 2).
 */
export const resolvePrompt = async (promptArg?: string): Promise<ResolvedPrompt> => {
  const hasStdin = !process.stdin.isTTY;

  if (promptArg && hasStdin) {
    const stdin = await readStdin();
    return { prompt: promptArg, stdin: stdin || undefined };
  }

  if (promptArg) {
    return { prompt: promptArg };
  }

  if (hasStdin) {
    const stdinContent = await readStdin();
    const trimmed = stdinContent.trim();
    if (!trimmed) {
      throw new AppError('No prompt provided — stdin is empty', 2);
    }
    return { prompt: trimmed };
  }

  throw new AppError(
    'No prompt provided — pass it as an argument or pipe via stdin',
    2,
  );
};
