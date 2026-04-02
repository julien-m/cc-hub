/** Animated CLI spinner with multi-instance support. */

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const FRAME_INTERVAL_MS = 80;
const TICK_SUCCESS = '✔';
const TICK_FAIL = '✖';

/** Whether stderr supports ANSI animation. */
const isInteractive = (): boolean =>
  !!process.stderr.isTTY &&
  !process.env.CI &&
  !process.env.NO_COLOR &&
  process.env.TERM !== 'dumb';

/* ── Shared render loop ─────────────────────────────────────────────── */

/** All currently active spinners, ordered top-to-bottom. */
const active: Spinner[] = [];
let renderTimer: ReturnType<typeof setInterval> | null = null;
let frameIndex = 0;

/** Number of lines the previous render occupied (for cursor cleanup). */
let renderedLines = 0;

/**
 * Render all active spinners to stderr.
 * Moves the cursor up to overwrite previously rendered lines,
 * then writes each spinner on its own line.
 */
const render = (): void => {
  if (!isInteractive() || active.length === 0) return;

  // Move cursor up to the first spinner line
  if (renderedLines > 0) {
    process.stderr.write(`\x1b[${renderedLines}A`);
  }

  frameIndex++;
  const frame = FRAMES[frameIndex % FRAMES.length];

  for (const spinner of active) {
    if (spinner.elapsed) {
      spinner['elapsedTicks']++;
    }
    const elapsed = spinner.elapsed
      ? ` (${Math.floor(spinner['elapsedTicks'] * FRAME_INTERVAL_MS / 1000)}s)`
      : '';
    process.stderr.write(`\x1b[K${frame} ${spinner['label']}${elapsed}\n`);
  }

  renderedLines = active.length;
};

/** Start the shared render loop if not already running. */
const startLoop = (): void => {
  if (renderTimer) return;
  renderedLines = 0;
  renderTimer = setInterval(render, FRAME_INTERVAL_MS);
};

/** Stop the shared render loop if no spinners are active. */
const stopLoop = (): void => {
  if (active.length > 0 || !renderTimer) return;
  clearInterval(renderTimer);
  renderTimer = null;
  frameIndex = 0;
};

/* ── Exit cleanup ───────────────────────────────────────────────────── */

let cleanupRegistered = false;

const registerCleanup = (): void => {
  if (cleanupRegistered) return;
  cleanupRegistered = true;

  const cleanup = (): void => {
    if (active.length > 0) {
      // Clear all spinner lines
      if (renderedLines > 0 && isInteractive()) {
        process.stderr.write(`\x1b[${renderedLines}A`);
        for (let i = 0; i < renderedLines; i++) {
          process.stderr.write('\x1b[K\n');
        }
      }
      active.length = 0;
      renderedLines = 0;
    }
    if (renderTimer) {
      clearInterval(renderTimer);
      renderTimer = null;
    }
  };

  process.on('exit', cleanup);
};

/* ── Spinner class ──────────────────────────────────────────────────── */

/**
 * Animated CLI spinner that writes to stderr.
 * Multiple spinners can run concurrently, each on its own line.
 *
 * @example
 * ```ts
 * const spinner = new Spinner('Loading...').start();
 * spinner.update('Still loading...');
 * spinner.succeed('Done!');
 * ```
 */
export class Spinner {
  private label: string;
  private running = false;
  private elapsedTicks = 0;

  /** Whether to show elapsed time after the label. */
  readonly elapsed: boolean;

  /**
   * @param label - Text displayed next to the spinner frame.
   * @param options - Optional configuration.
   */
  constructor(label: string, options?: { elapsed?: boolean }) {
    this.label = label;
    this.elapsed = options?.elapsed ?? false;
  }

  /**
   * Start the spinner animation.
   * @returns this for chaining.
   */
  start(): this {
    if (this.running) return this;
    this.running = true;
    this.elapsedTicks = 0;

    registerCleanup();

    if (isInteractive()) {
      active.push(this);
      startLoop();
    } else {
      // Non-interactive: print label once
      process.stderr.write(`${this.label}\n`);
    }

    return this;
  }

  /**
   * Update the spinner label while it is running.
   * @param label - New text to display.
   */
  update(label: string): void {
    const changed = this.label !== label;
    this.label = label;

    if (!this.running) return;

    if (!isInteractive() && changed) {
      process.stderr.write(`${label}\n`);
    }
  }

  /**
   * Stop the spinner with a success icon.
   * @param msg - Optional final message (defaults to current label).
   */
  succeed(msg?: string): void {
    this.finish(`${TICK_SUCCESS} ${msg ?? this.label}`);
  }

  /**
   * Stop the spinner with a failure icon.
   * @param msg - Optional final message (defaults to current label).
   */
  fail(msg?: string): void {
    this.finish(`${TICK_FAIL} ${msg ?? this.label}`);
  }

  /** Stop the spinner silently, clearing its line. */
  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.removeFromActive();
  }

  /* ── Internal ──────────────────────────────────────────────────── */

  private finish(finalText: string): void {
    if (!this.running) return;
    this.running = false;

    if (isInteractive()) {
      this.removeFromActive();
      process.stderr.write(`${finalText}\n`);
    } else {
      process.stderr.write(`${finalText}\n`);
    }
  }

  /**
   * Remove this spinner from the active list and re-render.
   * Clears the old lines, removes self, then re-renders remaining spinners.
   */
  private removeFromActive(): void {
    const idx = active.indexOf(this);
    if (idx === -1) return;

    // Erase all rendered lines
    if (renderedLines > 0) {
      process.stderr.write(`\x1b[${renderedLines}A`);
      for (let i = 0; i < renderedLines; i++) {
        process.stderr.write('\x1b[K\n');
      }
      // Move back up
      process.stderr.write(`\x1b[${renderedLines}A`);
    }

    active.splice(idx, 1);

    // Re-render remaining spinners immediately
    if (active.length > 0) {
      renderedLines = 0;
      render();
    } else {
      renderedLines = 0;
      stopLoop();
    }
  }
}
