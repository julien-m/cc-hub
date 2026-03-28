import { Glob } from 'bun';
import { resolve, relative } from 'node:path';

const GLOB_CHARS = /[*?[\]{]/;

/**
 * Resolves file patterns (paths or globs) to deduplicated absolute paths.
 * @param patterns - Array of file paths or glob patterns to resolve.
 * @returns Deduplicated array of absolute file paths.
 * @throws If a glob pattern matches no files.
 */
export const resolveFilePaths = async (patterns: string[]): Promise<string[]> => {
  const seen = new Set<string>();
  const results: string[] = [];

  for (const pattern of patterns) {
    if (GLOB_CHARS.test(pattern)) {
      const glob = new Glob(pattern);
      let matched = false;
      for await (const match of glob.scan({ dot: false, absolute: true })) {
        matched = true;
        const abs = resolve(match);
        if (!seen.has(abs)) {
          seen.add(abs);
          results.push(abs);
        }
      }
      if (!matched) {
        throw new Error(`No files matched glob: ${pattern}`);
      }
    } else {
      const abs = resolve(pattern);
      if (!seen.has(abs)) {
        seen.add(abs);
        results.push(abs);
      }
    }
  }

  return results;
};

/**
 * Reads a file and returns its path + content, or null if binary/directory.
 * @param filePath - Absolute path to the file to read.
 * @returns An object with relative path and content, or null if skipped.
 * @throws If the file does not exist.
 */
export const readFileAsContext = async (
  filePath: string,
): Promise<{ path: string; content: string } | null> => {
  const file = Bun.file(filePath);

  const stat = await file.stat().catch(() => null);
  if (!stat) {
    throw new Error(`File not found: ${filePath}`);
  }
  if (stat.isDirectory()) {
    console.error(`⚠ Skipping directory: ${filePath}`);
    return null;
  }

  const bytes = await file.bytes();
  const sample = bytes.slice(0, 8192);
  if (sample.includes(0)) {
    console.error(`⚠ Skipping binary file: ${filePath}`);
    return null;
  }

  const content = new TextDecoder().decode(bytes);
  const relPath = relative(process.cwd(), filePath);
  return { path: relPath, content };
};

/**
 * Resolve file patterns, read contents, and warn if context is large.
 * @param patterns - File paths or glob patterns.
 * @returns Array of file objects with path and content.
 */
export const loadFileContext = async (
  patterns: string[],
): Promise<Array<{ path: string; content: string }>> => {
  const resolved = await resolveFilePaths(patterns);
  const files: Array<{ path: string; content: string }> = [];

  for (const filePath of resolved) {
    const ctx = await readFileAsContext(filePath);
    if (ctx) files.push(ctx);
  }

  if (files.length > 0) {
    const totalContent = buildFileContext(files);
    const tokens = estimateTokens(totalContent);
    if (tokens > 25000) {
      console.error(`Large context (~${tokens} tokens estimated):`);
      for (const f of files) {
        console.error(`  ${f.path} (~${estimateTokens(f.content)} tokens)`);
      }
    }
  }

  return files;
};

/**
 * Formats file contexts into XML-delimited blocks.
 * @param files - Array of file objects with path and content.
 * @returns A string of XML-delimited file blocks.
 */
export const buildFileContext = (
  files: Array<{ path: string; content: string }>,
): string => {
  return files
    .map((f) => `<file path="${f.path}">\n${f.content}\n</file>`)
    .join('\n\n');
};

/**
 * Rough token estimate (~4 chars per token).
 * @param text - The text to estimate tokens for.
 * @returns Estimated token count.
 */
export const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};
