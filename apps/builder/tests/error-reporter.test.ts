import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  reportError,
  onBuilderError,
  clearErrorListeners,
  pluginLoadError,
  storagePersistError,
  type BuilderError,
} from '../src/lib/error-reporter';
import { retryWithBackoff } from '../src/lib/retry';

describe('Error Reporter', () => {
  beforeEach(() => {
    clearErrorListeners();
  });

  it('notifies registered listeners on reportError', () => {
    const listener = vi.fn();
    onBuilderError(listener);

    const err: BuilderError = {
      code: 'TEST_ERROR',
      severity: 'error',
      message: 'Something broke',
    };
    reportError(err);

    expect(listener).toHaveBeenCalledWith(err);
  });

  it('supports multiple listeners', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    onBuilderError(listener1);
    onBuilderError(listener2);

    reportError({ code: 'X', severity: 'info', message: 'test' });

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes listener via returned function', () => {
    const listener = vi.fn();
    const unsubscribe = onBuilderError(listener);

    reportError({ code: 'X', severity: 'info', message: 'first' });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    reportError({ code: 'X', severity: 'info', message: 'second' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('continues if a listener throws', () => {
    const badListener = vi.fn(() => { throw new Error('boom'); });
    const goodListener = vi.fn();
    onBuilderError(badListener);
    onBuilderError(goodListener);

    reportError({ code: 'X', severity: 'error', message: 'test' });

    expect(badListener).toHaveBeenCalled();
    expect(goodListener).toHaveBeenCalled();
  });

  it('creates plugin load error with context', () => {
    const err = pluginLoadError('my-plugin', new Error('network'));
    expect(err.code).toBe('PLUGIN_LOAD_FAILED');
    expect(err.severity).toBe('warning');
    expect(err.recovery).toBeDefined();
    expect(err.context?.pluginId).toBe('my-plugin');
  });

  it('creates storage persist error', () => {
    const err = storagePersistError('quota exceeded');
    expect(err.code).toBe('STORAGE_PERSIST_FAILED');
    expect(err.severity).toBe('error');
    expect(err.message).toContain('quota exceeded');
  });
});

describe('Retry with Backoff', () => {
  it('returns result on first success', async () => {
    const result = await retryWithBackoff(() => 42);
    expect(result).toBe(42);
  });

  it('retries on failure and eventually succeeds', async () => {
    let attempts = 0;
    const result = await retryWithBackoff(() => {
      attempts++;
      if (attempts < 3) throw new Error('fail');
      return 'success';
    }, { maxAttempts: 3, baseDelayMs: 1 });

    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('throws after max attempts exhausted', async () => {
    await expect(
      retryWithBackoff(
        () => { throw new Error('always fails'); },
        { maxAttempts: 2, baseDelayMs: 1 },
      ),
    ).rejects.toThrow('always fails');
  });

  it('calls onRetry callback', async () => {
    const onRetry = vi.fn();
    let attempts = 0;

    await retryWithBackoff(() => {
      attempts++;
      if (attempts < 2) throw new Error('fail');
      return 'ok';
    }, { maxAttempts: 3, baseDelayMs: 1, onRetry });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  it('works with async functions', async () => {
    const result = await retryWithBackoff(async () => {
      return Promise.resolve('async-result');
    });
    expect(result).toBe('async-result');
  });
});
