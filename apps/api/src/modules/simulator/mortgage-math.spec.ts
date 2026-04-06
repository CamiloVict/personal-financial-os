import { describe, expect, it } from 'vitest';
import { monthlyMortgagePaymentFrench } from './mortgage-math';

describe('simulator mortgage-math', () => {
  it('principal 0 → cuota 0', () => {
    expect(monthlyMortgagePaymentFrench(0, 12, 120)).toBe(0);
  });

  it('tasa 0 → capital / meses', () => {
    expect(monthlyMortgagePaymentFrench(120_000, 0, 12)).toBeCloseTo(10_000, 5);
  });

  it('tasa positiva: cuota acorde a sistema francés (spot check)', () => {
    const pmt = monthlyMortgagePaymentFrench(100_000, 12, 12);
    expect(pmt).toBeGreaterThan(8800);
    expect(pmt).toBeLessThan(8900);
  });
});
