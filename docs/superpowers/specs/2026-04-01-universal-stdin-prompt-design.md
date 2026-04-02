# Universal Stdin Prompt Resolution

## Problem

Only `ask` and `copilot` commands read stdin. The other 4 prompt-accepting commands (imagine, video, motion, music) require a positional `<prompt>` argument. This prevents HEREDOC and pipe-based workflows like:

```bash
cc-hub imagine <<'EOF'
A detailed multi-line prompt
with specific instructions
EOF

echo "Generate a sunset" | cc-hub imagine -o sunset.png
```

Additionally, the stdin logic is duplicated in `ask.ts` and `copilot.ts`.

## Design

### New utility: `src/infra/prompt.ts`

```typescript
interface ResolvedPrompt {
  prompt: string;
  stdin?: string;  // only set when prompt arg provided AND stdin piped
}

resolvePrompt(promptArg?: string): Promise<ResolvedPrompt>
```

Resolution logic:

| promptArg | stdin piped | Result |
|-----------|-------------|--------|
| yes | yes | `{ prompt: promptArg, stdin: stdinContent }` |
| yes | no | `{ prompt: promptArg }` |
| no | yes | `{ prompt: stdinContent }` |
| no | no | throws `AppError` (exit code 2) |

### Command changes

All 6 commands change `<prompt>` → `[prompt]` and call `resolvePrompt(promptArg)`.

**ask/copilot** — use `resolved.prompt` as intent, `resolved.stdin` as context (preserves current behavior when both are provided).

**imagine/video/motion/music** — use `resolved.prompt` only (they don't have a context concept).

### Backward compatibility

- All existing invocations with positional prompt continue to work identically.
- `cat file | cc-hub ask "explain"` continues to work (prompt + stdin as context).
- New: `cc-hub ask <<'EOF' ... EOF` works (stdin becomes prompt).
- New: `echo "prompt" | cc-hub imagine -o out.png` works.

## Edge cases

- Empty stdin (whitespace only) with no prompt arg → error (same as no input).
- Binary stdin → not handled (user error, will produce garbage prompt).
