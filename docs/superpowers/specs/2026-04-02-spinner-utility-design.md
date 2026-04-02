# Spinner Utility — Design Spec

## Problem

Waiting feedback is either absent (media commands use static `console.error`) or inline (ask has a hardcoded spinner). No reusable abstraction exists.

## API

```typescript
class Spinner {
  constructor(label: string)
  start(): Spinner           // begins animation, returns this for chaining
  update(label: string): void // replaces the label mid-spin
  succeed(msg?: string): void // stops with ✔ + msg (or label)
  fail(msg?: string): void    // stops with ✖ + msg (or label)
  stop(): void                // stops silently, clears line
}
```

## Behavior

- Frames: `⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏` at 80ms interval
- Output: `stderr` only (stdout reserved for piped data)
- Uses `\r\x1b[K` to overwrite the same line
- **CI/non-TTY**: no animation, no ANSI codes — writes `label\n` once on start, `label\n` on update (only if label changed), final status on succeed/fail
- `succeed()`: writes `✔ {msg}\n`, clears interval
- `fail()`: writes `✖ {msg}\n`, clears interval
- `stop()`: writes `\r\x1b[K` (clears line), clears interval
- Calling start() twice is a no-op (idempotent)
- Calling stop/succeed/fail on a stopped spinner is a no-op

## Integration points

| Location | Current code | New code |
|----------|-------------|----------|
| `ask.ts` heartbeat | Inline spinner + setInterval | `new Spinner('waiting...').start()` + tick counter |
| `imagine.ts` | `console.error('Generating image...')` | `spinner.start()` ... `spinner.succeed('Image saved')` |
| `video.ts` | `console.error('Generating video...')` | Same pattern |
| `motion.ts` | `console.error('Generating motion...')` | Same pattern |
| `music.ts` | `console.error('Generating music...')` | Same pattern |
| `poyo-media.ts` pollTask | `console.error('Progress: N%')` | `onProgress` callback → `spinner.update()` |

## poyo-media callback

`generateMedia` and `pollTask` gain an optional `onProgress?: (progress: number) => void` callback. Commands pass `(p) => spinner.update(\`Generating... ${p}%\`)`. The service layer stays UI-agnostic.

## ask.ts timer

The ask command needs elapsed time in the label. It keeps its own `setInterval` at 1s to update the spinner label: `spinner.update(\`waiting... ${seconds}s\`)`. The Spinner's own interval handles animation frames independently.
