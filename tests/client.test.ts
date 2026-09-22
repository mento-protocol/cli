import { ChainId } from '@mento-protocol/mento-sdk';
import { describe, expect, it } from 'vitest';

import { resolveChainId } from '../src/lib/client';

// resolveChainId is pure: it reads a static registry and never touches the
// network. getMento, in the same module, does reach an RPC and is deliberately
// untested here (AGENTS.md P2).
describe('resolveChainId', () => {
  it('resolves the celo mainnet name', () => {
    expect(resolveChainId('celo')).toBe(ChainId.CELO);
  });

  it('is case-insensitive', () => {
    expect(resolveChainId('CELO')).toBe(ChainId.CELO);
  });

  it('resolves the celo-sepolia testnet name', () => {
    expect(resolveChainId('celo-sepolia')).toBe(ChainId.CELO_SEPOLIA);
  });

  it('passes a numeric chain ID through', () => {
    expect(resolveChainId('42220')).toBe(42220);
  });

  it('passes an unregistered numeric chain ID through', () => {
    expect(resolveChainId('1')).toBe(1);
  });

  it('throws a named error for an unknown chain', () => {
    expect(() => resolveChainId('ethereum')).toThrow(/Unknown chain: "ethereum"/);
  });
});
