import { describe, expect, it } from 'vitest';
import { calculateColombiaIncomeTaxUVT2026, UVT_2026 } from './index';

describe('tax-engine CO-AG2026 UVT (referencia educativa)', () => {
  it('base gravable 0 → impuesto 0', () => {
    expect(calculateColombiaIncomeTaxUVT2026(0, UVT_2026)).toBe(0);
  });

  it('base por encima del tramo exento (>1090 UVT) genera impuesto > 0', () => {
    const baseCop = 1200 * UVT_2026;
    const tax = calculateColombiaIncomeTaxUVT2026(baseCop, UVT_2026);
    expect(tax).toBeGreaterThan(0);
  });
});
