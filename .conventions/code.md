
---
<!-- source: code-conventions/general.md -->
---

# General Rules (All Languages)

> These rules apply to **every language**. Language-specific files add deltas on top of these.

## Architecture & Code Rules

### 1. General Principles
- Explicit over implicit — always favor clarity
- Strong typing when the language supports it
- Minimal dependencies — prefer standard library
- All code must be formatted and linted automatically

### 2. Type Safety
- Use the type system to its fullest — avoid untyped containers (`any`, `object`, `void*`, `interface{}`)
- All public functions must have explicit input and output types
- Business objects must be explicitly typed
- Validate external data at system boundaries

### 3. Project Structure
- Organize by domain/feature, not by technical layer (e.g. `src/user/`, `src/billing/` — not `src/models/`, `src/controllers/`)
- Avoid catch-all folders: `utils/`, `helpers/`, `misc/`, `common/`
- One primary concept per file
- Clear separation: entry points, business logic, data access, external integrations

### 4. Style
- Automatic formatter — no manual formatting debates
- Linter with strict rules
- Consistent across the entire codebase
- No committed code that fails lint or format checks

### 5. Naming
- **Variables**: descriptive names, no single-letter names outside tiny loops. Booleans read naturally: `isActive`, `hasCredits`, `canRetry`, `shouldNotify`
- **Functions**: action verbs (`getUserById`, `createInvoice`). Avoid vague names: `handle`, `process`, `doStuff`
- **Types/Classes**: PascalCase (or language convention). No prefixes (`IUser`, `TUser`)
- **Constants**: UPPER_SNAKE_CASE for globals (or language convention). Centralize business values
- **Files/Folders**: consistent casing, names reflect content

### 6. Functions
- Small and focused: 20–30 lines maximum
- Single responsibility — one reason to change
- Prefer pure functions when possible (no side effects, deterministic)
- Explicit return types on public functions
- Avoid deep nesting — return early

### 7. Error Handling
- Never silently swallow errors
- Define domain-specific error types (not generic strings)
- Handle errors at boundaries: HTTP handlers, CLI, job processors
- Internal functions should propagate errors, not catch them
- Log errors with context (what failed, with which input)

### 8. Async / Concurrency
- Use the language's idiomatic async model
- Always handle async errors
- Parallelize independent operations
- Timeouts on all external calls
- Support cancellation where possible
- Never fire-and-forget without explicit intent

### 9. Testing
See [`testing.md`](testing.md) for all cross-cutting testing conventions (UI test identifiers, naming, mocking boundaries, test data, async, integration vs unit, coverage).

### 10. Tooling
Every project must enforce: formatter, linter, type checker (if applicable), test runner. All must pass in CI.

### 11. Data Validation
Always validate external data: HTTP requests, env vars, webhooks, file imports, message queues. Use a schema/validation library. Never trust external input.

### 12. Environment Variables
- Never use raw, unvalidated env vars
- Parse and validate at startup, fail fast if missing
- Type-coerce numeric and boolean values

### 13. API and DTO Rules
Never expose internal models directly. Separate: database entities, API DTOs, domain models. Transform between layers explicitly.

### 14. Magic Values
No hardcoded strings or numbers in business logic. Centralize in constants, enums, or config objects.

### 15. Dependency Injection
- Avoid implicit/global dependencies — pass via constructors or function parameters
- Constructors should only assign dependencies — no side effects

### 16. Separation of Responsibilities
- **Handlers/Controllers**: parse input, call services, return response
- **Services**: business logic
- **Repositories**: data access
- **Mappers**: transform between layers
- No layer leaks into another

### 17. Idempotent Operations
Critical operations (payments, creation, status changes) must be idempotent.

### 18. Limits and Pagination
Never load unlimited datasets. Always apply limits.

### 19. Logging
- Structured logging (key-value, JSON)
- Log at system boundaries only: HTTP, errors, major events
- Avoid excessive logging in business logic
- Include context: IDs, operation names, durations
- See `logging.md` for detailed sensitive data, redaction, and compliance rules

### 20. Time Handling
Centralize time access behind an abstraction — avoid scattering `Date.now()` / `time.Now()`. Enables deterministic testing.

### 21. External Calls
Every external call must include: timeout, error handling, retry strategy if applicable, circuit breaker for critical paths.

### 22. Security
- Never log sensitive data (passwords, tokens, PII) — see `logging.md` for detailed rules
- Never expose internal errors to API consumers
- Validate and sanitize all inputs
- Use parameterized queries (no string concatenation for SQL)

## Documentation Rules

### 23. Module Headers
Every file/module must start with a short description of its responsibility.

### 24. Public API Documentation
Every public function, class, type, or interface must include documentation comments explaining purpose, parameters, return values, and side effects.

### 25. Mandatory Inline Comment Triggers

The following code patterns **require** an inline comment explaining the "why". This is not optional — if the pattern appears, the comment must exist.

| # | Trigger | Expected comment |
|---|---------|------------------|
| 1 | **Magic constant** — numeric or string literal without self-evident meaning | Origin and rationale for the value |
| 2 | **Silent catch** — catch block that ignores, swallows, or returns a default | Why the error is intentionally ignored |
| 3 | **Diff/merge/sync algorithm** — logic comparing two states to produce actions | Strategy summary before the implementation |
| 4 | **Template/string building** — multi-line script, query, or document construction | End-to-end flow description of the generated output |
| 5 | **Non-trivial business branch** — if/else encoding a business rule, not just type narrowing | The business rule in plain language |
| 6 | **Non-obvious default value** — fallback that isn't zero/empty/null | Why this specific default was chosen |
| 7 | **Loop with early exit** — break/continue/return inside a loop body | What condition triggers the exit and why |
| 8 | **Backward compatibility code** — logic supporting an old format, schema, or API | What old version it supports and when it can be removed |
| 9 | **Order-dependent operations** — sequence where reordering would break correctness | Why this order matters (e.g., write-then-rename for atomicity) |
| 10 | **Non-trivial regex** — pattern longer than ~15 characters | What the pattern matches, in plain language |
| 11 | **System/shell interaction** — external process call, OS-specific behavior | The contract: expected inputs, outputs, exit codes, platform quirks |
| 12 | **Lossy data transformation** — conversion that intentionally discards information | What is lost and why it's acceptable |
| 13 | **Intentionally ignored parameter** — received argument not used in a code path | Why it's unused (distinguish from a bug) |
| 14 | **Arbitrary threshold/limit** — any bound not from a standard or spec | Where the number comes from and trade-offs |
| 15 | **High cyclomatic function** — function >20 lines with >2 nesting levels (excluding test bodies) | Strategy summary at the top of the function |

### 26. Comments Explain Why, Not What
Bad: `// increment counter` — Good: `// Retry up to 3 times because the service may temporarily reject requests`

### 27. Keep Comments Synchronized
Outdated comments are worse than no comments. Update comments immediately when logic changes.

### 28. No Trivial Comments
Do not comment code where the intent is obvious from the code itself. The following patterns must **not** be commented:

- Getters, setters, and trivial property access
- Import/require statements
- Function calls where the name is self-documenting (e.g., `validateCronExpression(expr)`)
- Simple assignments and variable declarations
- Types/interfaces whose name fully conveys their purpose
- Standard framework boilerplate (route registration, middleware setup)
- Test bodies — the test name is the documentation

### 29. Document Side Effects and Ownership
Side effects, ownership transfer, and cleanup responsibilities must always be documented.

### 30. Concise Documentation
Short description + parameters + return value. Avoid long explanations that repeat the code.

## External Data & Assets

### 31. Source-First Assets

When the user provides source URLs (ticketing pages, product pages, official event pages), **always scrape those pages first** to extract assets and data. Never search for generic images on Wikipedia/Wikimedia/Google when official sources are available.

- Source URLs are the single source of truth for assets **and data**
- Extract `og:image`, hero images, or event artwork from the provided pages
- Also extract metadata: titles, descriptions, dates, prices, venue names — don't rely solely on user-provided text, which may contain voice-transcription errors
- **Cross-validate user-provided data** against source pages: if a name or title doesn't match the source, flag it before using it
- **Download and store assets locally** (in repo or project assets folder) — don't hotlink external URLs, which break over time
- Fall back to generic sources (Wikipedia, press photos) only if no source URL exists
- Verify every image URL loads (HTTP 200) before using it
- Wikimedia Commons URLs are fragile (hash paths, rate-limiting, hotlink blocking) — avoid them

---
<!-- source: code-conventions/javascript.md -->
---

# TypeScript Rules (Delta)

> These rules complement [`general.md`](general.md). Only TypeScript/JavaScript-specific conventions are listed here.

## Stack
- Backend runtime: **Node.js** (dev tooling: **Bun** when useful)
- Frontend: **React**, **Next.js**, **Astro**
- TypeScript is mandatory, `strict` mode enabled
- Runtime validation: **Zod** (or equivalent) for external data

## TypeScript Specifics
- `any` is forbidden unless explicitly justified
- Inference allowed only for trivial local variables
- Prefer `interface` for structured objects, `type` for unions/mapped types/compositions
- Prefer `Readonly<T>`, `ReadonlyArray<T>`, and `as const` to enforce immutability
- Never mutate function arguments — treat all parameters as read-only
- ESM only (`import/export`), no CommonJS. Prefer named exports. Source files use `.ts`

## Style
- Semicolons required, double quotes, tabs
- Files and folders: **kebab-case** (`user.service.ts`, `verify-otp.controller.ts`, `email-templates/`)
- Local constants may use camelCase

## Functions & Classes
- Prefer **arrow functions**
- Prefer **classes for services and use cases** with constructor DI
- Prefer composition over inheritance

```ts
export class UserService {
	constructor(private readonly repo: UserRepository) {}

	createUser = async (input: CreateUserInput): Promise<CreateUserResult> => {
		const user = await this.repo.create(input);
		return { userId: user.id };
	};
}
```

## Error Handling
- Domain error classes extending `Error`: `export class UserAlreadyExistsError extends Error {}`
- Internal functions throw, boundaries catch

## Async
- async/await only (no `.then()` chains). Async functions return `Promise<T>`
- `Promise.all` for parallel independent operations
- `void sendEmail(user)` for explicit fire-and-forget
- `AbortController` for cancellable operations and timeouts

```ts
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);
await fetch(url, { signal: controller.signal });
```

## Testing
- Framework: **Vitest**, files named `*.test.ts`

## Tooling
- **Biome** (lint + format — replaces ESLint + Prettier), **TypeScript** (`tsc --noEmit`), **Vitest**

```json
{
	"scripts": {
		"check": "biome check .",
		"check:fix": "biome check --write .",
		"typecheck": "tsc --noEmit",
		"test": "vitest run"
	}
}
```

## Pre-commit Validation

Before committing, all of these must pass with zero errors/warnings:

```bash
tsc --noEmit          # type checking (or bunx tsc --noEmit for Bun projects)
biome check .         # linting + formatting
vitest run            # tests
```

## Bun Projects (setup only)

When scaffolding a Bun project:
- devDependency: `@types/bun` (not the deprecated `bun-types`)
- tsconfig: `skipLibCheck: true`, `moduleResolution: "bundler"`, `target/module: "ESNext"`

## Magic Strings Pattern

```ts
export const SIGNATURE_STATUS = {
	DRAFT: "draft",
	PENDING: "pending",
	SIGNED: "signed",
} as const;

export type SignatureStatus = (typeof SIGNATURE_STATUS)[keyof typeof SIGNATURE_STATUS];
```

## Options Objects
Always type options objects — never `options: any`.

```ts
interface CreateUserOptions {
	sendEmail?: boolean;
}
```

## Public APIs Return Typed Objects
Public APIs should return typed objects, not anonymous ones: `interface CreateUserResult { userId: string }`.

## TS Documentation
- All public functions must use **JSDoc** — no TS types in JSDoc tags (`@param limit` not `@param {number} limit`)
- Describe: purpose, parameters meaning, return value, side effects
- `@throws` for every function that can throw, with the error type
- `@returns` to describe complex return structures (e.g. object shape)
- Keep documentation in sync with code — outdated JSDoc is worse than none

### Inline Comment Triggers
All 15 triggers from [`general.md`](general.md) §25 apply. Use `//` for inline comments.

Additionally for TypeScript/JavaScript:
- **Type assertions** (`as`, `!`) — explain why the assertion is safe
- **`// biome-ignore`** directives — explain why the rule is suppressed
- **Dynamic `import()`** — explain why static import is not possible

---
<!-- source: code-conventions/cli.md -->
---

# TypeScript CLI Conventions (Delta)

> Delta on [`javascript.md`](javascript.md). Load after it when building a Node.js/Bun CLI application.
> For visual/UX patterns (colors, spinners, tables, prompts), see [`../design/systems/cli-patterns.md`](../design/systems/cli-patterns.md).
> For runtime/language choice, see [`../stack-ref/frontend/cli.md`](../stack-ref/frontend/cli.md).

## Entry Point Architecture

Split every CLI entry point into a **fast path** and a **full path**:

```ts
// src/cli.ts — fast paths first, no heavy imports
if (process.argv.includes("--version")) {
	console.log(VERSION);
	process.exit(0);
}
// Full path: dynamic import defers the heavy module graph
const { run } = await import("./app.js");
await run();
```

- Never `import` the full application at the top of the entry point — use `await import(...)` for the main module
- `--version` and `--help` must be instant

## Command Registration (Commander.js)

- Use **Commander.js** for argument parsing — never `switch` on `process.argv` manually
- Use `InvalidArgumentError` for argument validation, not manual `process.exit`
- Use `.parseAsync()` not `.parse()` — async commands need it
- Register all commands in `src/commands/`, one file per command
- Every command that returns data **must** support `--json` for scripting

## Stdin Input

Commands accepting variable-length text input (prompts, messages, content bodies) **must** also accept stdin when the positional argument is omitted. This enables piping from files, other commands, and scripts.

### Priority order

1. **Positional argument** — if provided, use it (explicit over implicit)
2. **stdin** — if `!process.stdin.isTTY` (piped input detected), read stdin
3. **Error** — no input available, throw with a usage hint

### Rules

- **isTTY guard is mandatory** — never read stdin without checking `!process.stdin.isTTY` first, or the command hangs waiting for terminal input
- stdin is consumed as **UTF-8 text** — binary input is out of scope
- **Scope:** applies to arguments where a user might pipe content from a file. Does not apply to short structured args (IDs, paths, enum values)

### Pattern

Place `resolveInput()` in `services/` (services own all I/O):

```ts
// services/input.ts — resolve text input from arg or stdin
export async function resolveInput(arg: string | undefined): Promise<string> {
  if (arg !== undefined) return arg.trim();

  if (!process.stdin.isTTY) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const input = Buffer.concat(chunks).toString("utf-8").trim();
    if (!input) throw new Error("Stdin was empty. Provide input via argument or non-empty pipe.");
    return input;
  }

  throw new Error("No input provided. Pass text as argument or pipe via stdin.");
}
```

Register the positional argument as optional with Commander.js (`[text]` = optional):

```ts
program
  .command("ask [text]")
  .description("Ask a question")
  .action(async (text: string | undefined) => {
    const input = await resolveInput(text);
    // ...
  });
```

### Usage

```bash
my-cli ask "direct question"           # positional arg
echo "question" | my-cli ask           # piped string
cat prompt.txt | my-cli ask            # piped file
my-cli ask                             # error: no input provided
```

## Module Structure

```
src/
  cli.ts          # Entry point — fast path + dynamic import of app
  app.ts          # Command registration, program setup
  commands/       # One file per command — thin wiring only (args → service → output)
  services/       # Business logic — HTTP clients, file ops, config (owns all I/O)
  utils/          # Pure functions — no I/O, no side effects
  types/          # Shared TypeScript types and interfaces
```

- No `helpers/`, `misc/`, or `common/` catch-all folders (see `general.md §3`)
- `commands/` must not contain business logic — delegate to `services/`

## Build Pipeline

- **esbuild** for distributable CLIs — bundle to single ESM output
- **`bun build --compile`** for internal/dev tools — self-contained binary
- Always include `bin` field in `package.json` for installable CLIs
- Add `#!/usr/bin/env node` shebang to the output entry point
- Run `typecheck` separately from `build` — esbuild does not type-check
- Use esbuild `define` for build-time feature gates (dead-code elimination)

## Startup Optimization

Parallelize all I/O at startup — but only after fast-path exits (`--version`, `--help`):

```ts
// Fast paths already handled above — now fire slow I/O in parallel
const configPromise = loadConfig();
const credentialsPromise = loadCredentials();
// ... register commands ...
const [config, credentials] = await Promise.all([configPromise, credentialsPromise]);
```

- Never `await` at the top of the entry point for non-essential I/O
- Use `Promise.all` not sequential `await` for independent I/O operations

## Error Handling

### Custom Error Classes

- One error class per category — always set `this.name` explicitly (survives minification)
- Use dual detection: `instanceof` (dev) + `.name` check (minified prod builds)

### CLI Error Boundary

Top-level boundary catches and formats errors with actionable next steps:

```ts
try {
	await program.parseAsync();
} catch (error) {
	if (isAuthError(error)) {
		console.error("Authentication failed. Run `my-cli auth login` to re-authenticate.");
		process.exit(1);
	}
	console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
	console.error("Run with DEBUG=1 for full details.");
	process.exit(1);
}
```

- Always include a hint on what the user should do next
- Use `process.exit(1)` on error, `process.exit(0)` on success
- Never `process.exit()` in services — throw errors, let the boundary call `exit`
- Never swallow errors silently

## Terminal Output

### stdout vs stderr

- **stdout**: command data (JSON `--json` output, values)
- **stderr**: status messages, errors, warnings, progress, spinners

Separating channels allows `my-cli get | jq .` to work without pollution.

### Colors and Spinners

- `chalk` for colors — respects `NO_COLOR` automatically
- `ora` for spinners — always `succeed()`, `fail()`, or `stop()`, never leave running

## Interactive TUI (Ink)

- Use **Ink** (React for terminal) only for continuously-updating interactive UI — not for simple one-shot commands
- Always guard with `process.stdout.isTTY` — provide non-interactive fallback
- tsconfig: `"jsx": "react-jsx"`, `"jsxImportSource": "react"`

## ESM Imports

Use `.js` extension for local imports even in `.ts` files — Node.js ESM requires it:

```ts
// Correct — .js extension in .ts source file
import { deployCommand } from "./commands/deploy.js";
import type { Config } from "./types/config.js";
```

## Environment Variables

- Validate env vars with Zod when the selected command needs them — not globally at startup (keeps `--help` and offline commands working)
- Respect `NO_COLOR` and `XDG_CONFIG_HOME`
- Document every env var in `--help` output or README

## Testing

- Mock the service layer — commands should have no business logic to test directly
- Use `vi.spyOn(process, "exit")` to assert exit codes without actually exiting
- Test `--json` output paths separately to verify JSON structure
- Never test against real network/filesystem in unit tests

## Anti-Patterns

| Anti-pattern | Correct approach |
|---|---|
| `strict: false` in tsconfig | `strict: true` always |
| Silent `catch {}` blocks | Log at minimum; re-throw if unrecoverable |
| Top-level `await` for I/O at import | Fire in background, `await` lazily |
| `process.exit()` in services | Throw error; let CLI boundary call `exit` |
| Mixed stdout/stderr output | Data on stdout, status on stderr |
| Monolithic command files (>300 LOC) | Split: service layer + thin command handler |
| Hardcoded `.env` path assumptions | Respect `XDG_CONFIG_HOME` |
| Required positional for text input, no stdin | Optional `[arg]` + `resolveInput()` from stdin |

## Inline Comment Triggers (CLI-Specific)

All triggers from `general.md §25` apply. Additionally for CLI code:

- **Dynamic `import()`** at entry point — explain which fast-path this enables
- **Lazy `import()`** inside a function — explain which circular dependency it breaks
- **`process.exit()`** in non-boundary code — explain why throwing is not sufficient
- **`isTTY` checks** — explain what the non-TTY fallback does and why
- **stdin read without `isTTY` guard** — explain why hanging is possible and what the fallback is
