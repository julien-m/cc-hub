import { execFileSync } from 'node:child_process';

export function getCred(name: string): string {
  try {
    return execFileSync('creds', ['get', name, '--no-newline'], {
      encoding: 'utf-8',
    });
  } catch {
    console.error(`⚠️  Token manquant : ${name}`);
    console.error(`   → Enregistre-le avec : creds set ${name}`);
    process.exit(3);
  }
}

export function tryGetCred(name: string): string | null {
  try {
    return execFileSync('creds', ['get', name, '--no-newline'], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}
