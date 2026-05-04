/** Shared Commander option collectors for repeatable flags. */

// @spec FR-001: Repeatable -i collector, FR-002: Repeatable -i collector, FR-003: Repeatable -i collector — .specs/features/001-multi-reference-files/spec.md#fr-001
/**
 * Append a value to an accumulator without mutating the input.
 * Use as the parser argument for `.option(... , collect, [])` to make a Commander
 * option repeatable (multiple occurrences accumulated in CLI order).
 *
 * @param value - The value parsed for this occurrence.
 * @param previous - The accumulator passed by Commander (defaults to []).
 * @returns A new array with `value` appended.
 */
export const collect = (value: string, previous: string[]): string[] => [...previous, value];
