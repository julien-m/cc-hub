/** Thin wrapper over ora adding elapsed time support. */
import ora, { type Ora } from "ora";

/**
 * CLI spinner backed by ora.
 * Adds optional elapsed time display not available in ora natively.
 *
 * @example
 * ```ts
 * const s = new Spinner('Loading...', { elapsed: true }).start();
 * s.update('Still loading...');
 * s.succeed('Done!');
 * ```
 */
export class Spinner {
	private readonly ora: Ora;
	private baseLabel: string;
	private timer: ReturnType<typeof setInterval> | null = null;
	private seconds = 0;

	/** Whether elapsed time is shown. */
	readonly elapsed: boolean;

	constructor(label: string, options?: { elapsed?: boolean }) {
		this.baseLabel = label;
		this.elapsed = options?.elapsed ?? false;
		this.ora = ora({ text: label, stream: process.stderr });
	}

	/** Start the spinner animation. */
	start(): this {
		this.ora.start();
		if (this.elapsed) {
			this.seconds = 0;
			this.timer = setInterval(() => {
				this.seconds++;
				this.ora.text = `${this.baseLabel} (${this.seconds}s)`;
			}, 1000);
		}
		return this;
	}

	/** Update the spinner label. */
	update(label: string): void {
		this.baseLabel = label;
		this.ora.text = this.elapsed ? `${label} (${this.seconds}s)` : label;
	}

	/** Stop with success icon. */
	succeed(msg?: string): void {
		this.clearTimer();
		this.ora.succeed(msg ?? this.baseLabel);
	}

	/** Stop with failure icon. */
	fail(msg?: string): void {
		this.clearTimer();
		this.ora.fail(msg ?? this.baseLabel);
	}

	/** Stop silently. */
	stop(): void {
		this.clearTimer();
		this.ora.stop();
	}

	private clearTimer(): void {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}
}
