import { describe, expect, it } from 'vitest';
import {
  cashflowStreamToMonthlyEquivalent,
  DEFAULT_GOAL_PLANNING_HORIZON_MONTHS,
  monthsRemainingForGoal,
} from './goal-projection.util';

describe('cashflowStreamToMonthlyEquivalent', () => {
  it('MONTHLY devuelve el mismo monto', () => {
    expect(cashflowStreamToMonthlyEquivalent(3000, 'MONTHLY', null)).toBe(3000);
  });

  it('QUARTERLY divide entre 3', () => {
    expect(cashflowStreamToMonthlyEquivalent(9000, 'QUARTERLY', null)).toBe(3000);
  });

  it('CUSTOM usa customFrequencyMonths', () => {
    expect(cashflowStreamToMonthlyEquivalent(6000, 'CUSTOM', 2)).toBe(3000);
  });

  it('normaliza frecuencia (minúsculas)', () => {
    expect(cashflowStreamToMonthlyEquivalent(9000, 'quarterly', null)).toBe(3000);
  });

  it('CUSTOM sin meses: trata como mensual', () => {
    expect(cashflowStreamToMonthlyEquivalent(2500, 'CUSTOM', null)).toBe(2500);
  });
});

describe('monthsRemainingForGoal', () => {
  it('sin fecha usa horizonte por defecto', () => {
    const r = monthsRemainingForGoal(null, new Date('2026-06-15'));
    expect(r.openEnded).toBe(true);
    expect(r.months).toBe(DEFAULT_GOAL_PLANNING_HORIZON_MONTHS);
  });

  it('fecha futura: ~12 meses en un año civil', () => {
    const r = monthsRemainingForGoal(
      new Date(Date.UTC(2026, 11, 31)),
      new Date(Date.UTC(2026, 0, 1)),
    );
    expect(r.openEnded).toBe(false);
    expect(r.months).toBe(12);
  });

  it('fecha pasada: 1 mes y flag', () => {
    const r = monthsRemainingForGoal(
      new Date(Date.UTC(2020, 0, 1)),
      new Date(Date.UTC(2026, 0, 1)),
    );
    expect(r.targetInPast).toBe(true);
    expect(r.months).toBe(1);
  });
});
