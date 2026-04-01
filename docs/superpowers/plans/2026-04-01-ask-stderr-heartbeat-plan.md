# Implementation Plan — cc-hub ask stderr heartbeat

## Task 1: Add heartbeat to ask command handler

**File:** `src/commands/ask.ts`

**Changes:**
1. Before the `await askFn(...)` call (currently line 69), add:
   - Initialize counter: `let seconds = 0;`
   - Start interval: `const heartbeat = setInterval(() => { seconds++; process.stderr.write(\`[cc-hub] waiting... ${seconds}s\n\`); }, 1000);`
2. Wrap the `await askFn(...)` + stdout write in a `try/finally`:
   - `finally { clearInterval(heartbeat); }`
3. The existing outer try/catch for error handling remains unchanged.

**Result:** stderr emits `[cc-hub] waiting... 1s`, `[cc-hub] waiting... 2s`, etc. every second until the API responds.

## Task 2: Manual test

Run: `cc-hub ask "Say hello in 3 words" --model google/gemini-3-flash --provider poyo 2>&1`
Verify: heartbeat markers appear on stderr, then response on stdout.
