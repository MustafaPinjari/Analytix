import { describe, it, expect } from 'vitest';
import { formatCurrency, formatNumber, formatPercent, formatShortNumber } from './index';

describe('Formatting Utilities', () => {
  it('should format numbers with currency formatting', () => {
    expect(formatCurrency(12500)).toBe('$12,500');
    expect(formatCurrency(0)).toBe('$0');
  });

  it('should format numbers with standard commas', () => {
    expect(formatNumber(1500430)).toBe('1,500,430');
    expect(formatNumber(12.5)).toBe('12.5');
  });

  it('should format percentage rates', () => {
    expect(formatPercent(0.45)).toBe('45.0%');
    expect(formatPercent(12.5)).toBe('12.5%');
  });

  it('should shorten large numbers with standard scale abbreviations', () => {
    expect(formatShortNumber(1250000000)).toBe('1.3B');
    expect(formatShortNumber(5400000)).toBe('5.4M');
    expect(formatShortNumber(4520)).toBe('4.5K');
    expect(formatShortNumber(85)).toBe('85');
  });
});
