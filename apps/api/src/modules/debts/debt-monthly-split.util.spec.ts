import { describe, expect, it } from 'vitest';
import { splitMonthlyInstallment } from './debt-monthly-split.util';

describe('splitMonthlyInstallment', () => {
  it('tasa 0: toda la cuota va a capital', () => {
    const r = splitMonthlyInstallment(10_000, 500, 0);
    expect(r.interestPortion).toBe(0);
    expect(r.principalPortion).toBe(500);
    expect(r.newRemaining).toBe(9500);
  });

  it('12% nominal anual: interés mensual ~1% del saldo', () => {
    const r = splitMonthlyInstallment(12_000, 600, 12);
    expect(r.interestPortion).toBe(120);
    expect(r.principalPortion).toBe(480);
    expect(r.newRemaining).toBe(11520);
  });

  it('última cuota: no baja por debajo de cero', () => {
    const r = splitMonthlyInstallment(50, 200, 24);
    expect(r.newRemaining).toBe(0);
    expect(r.principalPortion).toBe(50);
  });

  it('cuota menor que interés del mes: todo a interés, saldo igual', () => {
    const r = splitMonthlyInstallment(100_000, 100, 24);
    expect(r.interestPortion).toBe(100);
    expect(r.principalPortion).toBe(0);
    expect(r.newRemaining).toBe(100_000);
  });
});
