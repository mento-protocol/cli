import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';

import { handleError } from '../src/lib/errors';

/**
 * handleError ends every branch with process.exit(1). A no-op stub would let
 * execution fall through into the branches below it, so the stub throws and
 * each test asserts on the throw instead.
 */
class ProcessExited extends Error {
  constructor(readonly code: number | undefined) {
    super(`process.exit(${code})`);
  }
}

let exitSpy: MockInstance<typeof process.exit>;
let errorSpy: MockInstance<typeof console.error>;

beforeEach(() => {
  exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
    throw new ProcessExited(code);
  }) as never);
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Everything handleError printed, with any chalk colour codes removed. */
function printed(): string {
  // eslint-disable-next-line no-control-regex
  const ansi = /\u001b\[[0-9;]*m/g;
  return errorSpy.mock.calls
    .map((call) => String(call[0]).replace(ansi, ''))
    .join('\n');
}

/** Runs handleError and asserts it exited, so callers can inspect the output. */
function run(err: unknown): void {
  expect(() => handleError(err)).toThrow(ProcessExited);
  expect(exitSpy).toHaveBeenCalledWith(1);
}

describe('handleError', () => {
  it('explains a closed FX market', () => {
    run(new Error('FxMarket is closed for this pair'));
    expect(printed()).toContain('FX Market is currently closed');
  });

  it('matches the "market closed" wording too', () => {
    run(new Error('Market closed'));
    expect(printed()).toContain('FX Market is currently closed');
  });

  it('explains an insufficient balance', () => {
    run(new Error('insufficient funds for gas'));
    expect(printed()).toContain('Insufficient balance for this transaction');
  });

  it('adds a hint for an unknown token', () => {
    run(new Error('token not found: cXYZ'));
    const out = printed();
    expect(out).toContain('token not found: cXYZ');
    expect(out).toContain('mento tokens --all');
  });

  it('adds a hint when no route exists', () => {
    run(new Error('No route found between cUSD and cEUR'));
    const out = printed();
    expect(out).toContain('No route found between cUSD and cEUR');
    expect(out).toContain('mento routes');
  });

  it('explains a network failure and suggests --rpc', () => {
    run(new Error('fetch failed'));
    const out = printed();
    expect(out).toContain('Network connection failed');
    expect(out).toContain('--rpc <url>');
  });

  it('lists the supported chains for an unknown chain', () => {
    run(new Error('Unknown chain: "ethereum".'));
    expect(printed()).toContain('Supported chains: celo, celo-sepolia');
  });

  it('summarises an on-chain revert', () => {
    run(new Error('execution reverted: SLIPPAGE'));
    const out = printed();
    expect(out).toContain('Transaction reverted on-chain');
    expect(out).toContain('execution reverted: SLIPPAGE');
  });

  it('prints an unrecognised message as-is', () => {
    run(new Error('something unexpected happened'));
    expect(printed()).toBe('Error: something unexpected happened');
  });

  it('stringifies a non-Error value', () => {
    run('plain string failure');
    expect(printed()).toBe('Error: plain string failure');
  });
});
