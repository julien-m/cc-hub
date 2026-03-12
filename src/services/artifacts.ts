import { copyFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { ARTIFACTS_DIR, ensureDirs } from '../utils/paths.ts';

export function storeArtifact(filePath: string, slug: string | null): string {
  ensureDirs();

  const today = new Date().toISOString().slice(0, 10);
  const existing = readdirSync(ARTIFACTS_DIR).filter((f) =>
    f.startsWith(today),
  );
  const seq = String(existing.length + 1).padStart(3, '0');
  const normalizedSlug =
    slug ||
    basename(filePath)
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-z0-9-]/gi, '-')
      .toLowerCase();

  const artifactName = `${today}_${seq}_${normalizedSlug}.md`;
  const destPath = join(ARTIFACTS_DIR, artifactName);

  copyFileSync(filePath, destPath);
  return destPath;
}
