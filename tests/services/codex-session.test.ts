import { describe, it, expect } from 'bun:test';
import {
  CodexTimeoutError,
  CodexSessionError,
  CodexSessionClosedError,
} from '../../src/services/codex-session.ts';

describe('CodexSession error classes', () => {
  it('CodexTimeoutError is an Error with correct name', () => {
    const err = new CodexTimeoutError('timed out');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('CodexTimeoutError');
    expect(err.message).toBe('timed out');
  });

  it('CodexSessionError is an Error with correct name', () => {
    const err = new CodexSessionError('invalid cwd');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('CodexSessionError');
  });

  it('CodexSessionClosedError is an Error with correct name and default message', () => {
    const err = new CodexSessionClosedError();
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('CodexSessionClosedError');
    expect(err.message).toBe('CodexSession is already closed.');
  });
});
