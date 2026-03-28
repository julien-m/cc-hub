/** Base application error with exit code. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: number = 1,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/** Configuration or missing credentials error (exit code 3). */
export class ConfigError extends AppError {
  constructor(message: string) {
    super(message, 3);
  }
}

/** Network or timeout error (exit code 4). */
export class NetworkError extends AppError {
  constructor(message: string) {
    super(message, 4);
  }
}

/** Model not found error. */
export class ModelNotFoundError extends AppError {
  constructor(id: string) {
    super(`Unknown model: ${id}`);
  }
}

/** Unsupported format error. */
export class UnsupportedFormatError extends AppError {
  constructor(format: string, type: string) {
    super(`Unsupported ${type} format: ${format}`);
  }
}

/**
 * Extract the exit code from an error.
 * Returns the AppError code if available, otherwise the provided fallback.
 * @param err - The caught error.
 * @param fallback - Default exit code when err is not an AppError.
 * @returns The exit code to use with process.exit().
 */
export const exitCode = (err: unknown, fallback = 1): number =>
  err instanceof AppError ? err.code : fallback;
