import { describe, expect, it } from 'vitest';

import { formatAddress, formatTokenAmount, parseAmount } from '../src/lib/format';

// A 42-character checksum-length address. Invented, not a real deployment:
// addresses come from the SDK, never from a fixture (AGENTS.md P3).
const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

describe('formatAddress', () => {
  it('returns a short address unchanged', () => {
    expect(formatAddress('0xabcdef')).toBe('0xabcdef');
  });

  it('returns an address of exactly the cutoff length unchanged', () => {
    // chars * 2 + 2 = 14 with the default chars
    const fourteen = '0x123456789012';
    expect(fourteen).toHaveLength(14);
    expect(formatAddress(fourteen)).toBe(fourteen);
  });

  it('truncates the middle of a long address with the default chars', () => {
    expect(formatAddress(ADDRESS)).toBe('0x123456...345678');
  });

  it('honours a custom chars width', () => {
    expect(formatAddress(ADDRESS, 4)).toBe('0x1234...5678');
  });
});

describe('parseAmount', () => {
  it('parses a whole number at 18 decimals', () => {
    expect(parseAmount('1', 18)).toBe(1000000000000000000n);
  });

  it('parses a fractional amount at 18 decimals', () => {
    expect(parseAmount('1.5', 18)).toBe(1500000000000000000n);
  });

  it('parses a small fractional amount at 18 decimals', () => {
    expect(parseAmount('0.000001', 18)).toBe(1000000000000n);
  });

  it('parses a small fractional amount at 6 decimals', () => {
    expect(parseAmount('0.000001', 6)).toBe(1n);
  });

  it('parses a fractional amount at 6 decimals', () => {
    expect(parseAmount('1.5', 6)).toBe(1500000n);
  });

  it('truncates fractional digits beyond the token decimals', () => {
    expect(parseAmount('1.23456789', 6)).toBe(1234567n);
  });

  it('handles a trailing dot with no fractional digits', () => {
    expect(parseAmount('2.', 6)).toBe(2000000n);
  });

  // Documents today's behaviour, not the desired behaviour: parseAmount hands a
  // non-numeric string straight to BigInt(). CLI-02 replaces this with a clear
  // validation error; until then handleError prints the raw SyntaxError.
  it('throws a raw SyntaxError for a non-numeric amount (current behaviour)', () => {
    expect(() => parseAmount('abc', 18)).toThrow(SyntaxError);
  });
});

describe('formatTokenAmount', () => {
  it('returns "0" for a zero string', () => {
    expect(formatTokenAmount('0', 18)).toBe('0');
  });

  it('returns "0" for a zero bigint', () => {
    expect(formatTokenAmount(0n, 18)).toBe('0');
  });

  it('formats a value below one unit', () => {
    expect(formatTokenAmount('500000000000000000', 18)).toBe('0.50');
  });

  it('rounds nothing down to zero for a dust value', () => {
    expect(formatTokenAmount('1', 18)).toBe('0.00');
  });

  it('adds thousands separators to the integer part', () => {
    expect(formatTokenAmount(1234567000000000000000000n, 18)).toBe('1,234,567.00');
  });

  it('omits the fraction when displayDecimals is 0', () => {
    expect(formatTokenAmount(1234567000000000000000000n, 18, 0)).toBe('1,234,567');
  });

  it('truncates the fraction to displayDecimals', () => {
    expect(formatTokenAmount('1987654321000000000', 18, 4)).toBe('1.9876');
  });

  it('defaults to two decimal places', () => {
    expect(formatTokenAmount('1987654321000000000', 18)).toBe('1.98');
  });

  it('formats a 6-decimal token', () => {
    expect(formatTokenAmount('1500000', 6)).toBe('1.50');
  });

  it('treats a bigint and its string form identically', () => {
    expect(formatTokenAmount(2500000000000000000n, 18)).toBe(
      formatTokenAmount('2500000000000000000', 18),
    );
  });
});
