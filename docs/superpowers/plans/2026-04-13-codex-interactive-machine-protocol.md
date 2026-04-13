# Codex Interactive Machine Protocol Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform `cc codex -i` from a human REPL into a machine-readable JSON-lines protocol for scripts and AI agents.

**Architecture:** Replace human-facing text output (prompt, prefix, spinner) with a JSON-lines protocol on stdout: `{"ready":true}` at startup, `{"response":"..."}` per turn, `{"error":"..."}` on failure. Refactor readline loop to use `rl.on('line', ...)` pattern without output stream. Update skill doc with protocol description and Python example.

**Tech Stack:** TypeScript, Node.js `readline`, Bun test runner, Commander.js

---

### Task 1: Refactor interactive block in src/commands/codex.ts

**Files:**
- Modify: `src/commands/codex.ts` (lines 26, 50–154)

The entire interactive block (between `// ── Interactive mode` and `// ── End interactive mode`) is rewritten. No other code in this file changes.

- [ ] **Step 1: Re-read the current file before editing**

Run: `cat -n src/commands/codex.ts | head -160`

Confirm the interactive block spans approximately lines 50–154.

- [ ] **Step 2: Replace the interactive block**

In `src/commands/codex.ts`, replace the option description on line 26 and the entire interactive block (lines 50–154). The new content:

**Line 26 — update option description:**
```typescript
.option('-i, --interactive', 'Machine-readable interactive session (JSON lines on stdout). One prompt per stdin line, one {"response":"..."} per stdout line. For scripts and AI agents only.')
```

**Replace lines 50–154 with:**
```typescript
        // ── Interactive mode ─────────────────────────────────────────────
        if (opts.interactive) {
          if (opts.schema) {
            console.error('Error: --schema is not compatible with --interactive');
            process.exit(2);
          }

          const rawModel = opts.model || getEnv('CODEX_MODEL') || 'openai/gpt-5.4';
          const nativeModel = resolveForProvider(rawModel, 'codex');

          let session: CodexSession;
          try {
            session = await CodexSession.create(process.cwd(), {
              model: nativeModel,
              sandbox: (opts.sandbox ?? 'read-only') as 'read-only' | 'workspace-write',
              persist: opts.persist,
            });
          } catch (err) {
            return handleError(err);
          }

          // Signal readiness — consumer waits for this before sending first prompt
          process.stdout.write('{"ready":true}\n');

          // Process initial prompt arg if provided
          if (promptArg) {
            try {
              const response = await session.ask(promptArg);
              process.stdout.write(JSON.stringify({ response }) + '\n');
            } catch (err) {
              process.stdout.write(JSON.stringify({ error: (err as Error).message }) + '\n');
              await session.close();
              process.exit(exitCode(err, 1));
            }
          }

          // Read one prompt per line; pause between turns to enforce sequential processing
          process.stdin.resume();
          process.stdin.setEncoding('utf8');

          const rl = readline.createInterface({ input: process.stdin });

          const sigintHandler = () => { rl.close(); };
          process.once('SIGINT', sigintHandler);

          try {
            await new Promise<void>((resolve) => {
              rl.on('line', async (line: string) => {
                const trimmed = line.trim();
                if (!trimmed) return;
                if (['exit', 'quit', 'q'].includes(trimmed.toLowerCase())) {
                  rl.close();
                  return;
                }
                rl.pause();
                try {
                  const response = await session.ask(trimmed);
                  process.stdout.write(JSON.stringify({ response }) + '\n');
                } catch (err) {
                  process.stdout.write(JSON.stringify({ error: (err as Error).message }) + '\n');
                  rl.close();
                  return;
                }
                rl.resume();
              });
              rl.on('close', resolve);
            });
          } finally {
            process.removeListener('SIGINT', sigintHandler);
            await session.close();
          }

          return;
        }
        // ── End interactive mode ──────────────────────────────────────────
```

- [ ] **Step 3: Re-read the modified file to confirm the edit applied correctly**

Run: `cat -n src/commands/codex.ts | sed -n '20,130p'`

Verify:
- Line ~26: `-i, --interactive` description mentions "Machine-readable interactive session"
- No `Spinner` instantiation within the interactive block
- No `process.stderr.write('Codex session ready...')` line
- `{"ready":true}` is emitted after `CodexSession.create()`
- Response uses `JSON.stringify({ response })`
- Error uses `JSON.stringify({ error: ... })`
- `readline.createInterface({ input: process.stdin })` — no `output` key
- `rl.on('line', ...)` pattern used (no `rl.question()`)

- [ ] **Step 4: Check TypeScript compiles**

Run: `bun build bin/cc-hub.ts --outfile /dev/null 2>&1 | head -30`

Expected: no errors. If errors appear, fix them before continuing.

- [ ] **Step 5: Smoke test the protocol manually**

Run: `printf 'exit\n' | bun run bin/cc-hub.ts codex -i 2>/dev/null`

Expected output (stdout):
```
{"ready":true}
```
(then process exits 0)

If `codex app-server` is not available, the session create will fail and `handleError` will exit 3. That's acceptable — confirms the plumbing works.

- [ ] **Step 6: Commit**

```bash
git add src/commands/codex.ts
git commit -m "feat(codex): convert -i to machine-readable JSON-lines protocol"
```

---

### Task 2: Update .claude/skills/cc-hub/SKILL.md

**Files:**
- Modify: `.claude/skills/cc-hub/SKILL.md` (Codex CLI section, lines ~87–101)

- [ ] **Step 1: Re-read the skill file before editing**

Run: `cat -n .claude/skills/cc-hub/SKILL.md | sed -n '87,105p'`

Identify the Codex CLI section.

- [ ] **Step 2: Replace the Codex CLI section**

Replace the current `### Codex CLI (OpenAI)` section with:

```markdown
### Codex CLI (OpenAI)

```bash
cc-hub codex "Question"
cc-hub codex "Analyse" -f src/api.ts
cc-hub codex "Deep" -e high
cc-hub codex review                   # review uncommitted changes
cc-hub codex review -b main
```

Auth via `codex login`. Options : `-e/--effort low|medium|high`, `-s/--sandbox read-only|workspace-write`, `-x/--schema <path>`, `-p/--persist` (create a non-ephemeral thread; no automatic resume).
Modèles : **Read** [`references/models.md`](references/models.md)

#### Mode interactif machine (`-i`)

Protocol JSON lines pour scripts et agents IA. **Jamais utilisé directement par un humain.**

- stdin : une ligne par prompt ; `exit`/`quit`/`q` ou EOF (Ctrl-D) ferme la session
- stdout : une ligne JSON par événement

| Événement | JSON stdout |
|-----------|-------------|
| Session prête | `{"ready":true}` |
| Réponse | `{"response":"..."}` |
| Erreur (fatale) | `{"error":"..."}` |

- stderr : vide en fonctionnement normal
- Exit codes : 0 (OK), 1 (erreur générale), 3 (auth/non trouvé), 4 (timeout)

**Exemple Python :**

```python
import subprocess, json

proc = subprocess.Popen(
    ['cc-hub', 'codex', '-i'],
    stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True,
)

# Attendre le signal ready
ready = json.loads(proc.stdout.readline())  # {"ready": true}

# Envoyer un prompt et lire la réponse
proc.stdin.write('Explain quicksort\n')
proc.stdin.flush()
result = json.loads(proc.stdout.readline())  # {"response": "..."}
print(result['response'])

# Fermer proprement
proc.stdin.write('exit\n')
proc.stdin.flush()
proc.wait()
```

Avec prompt initial : `cc-hub codex -i "first prompt"` → `{"ready":true}` puis `{"response":"..."}` avant d'entrer dans la boucle.
```

- [ ] **Step 3: Re-read the modified section**

Run: `cat -n .claude/skills/cc-hub/SKILL.md | sed -n '87,160p'`

Verify:
- `-i` removed from the main bash example block
- New `#### Mode interactif machine (-i)` section present
- Protocol table present
- Python example present with `{"ready":true}` sync step

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/cc-hub/SKILL.md
git commit -m "docs(skill): document codex -i as machine-readable JSON-lines protocol with Python example"
```
