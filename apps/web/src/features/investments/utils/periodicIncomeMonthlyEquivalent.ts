/** Convierte el monto por período a equivalente mensual (para comparar ingresos). */
export function periodicIncomeMonthlyEquivalent(pos: {
  generatesPeriodicIncome?: boolean;
  expectedPeriodicIncomeAmount?: number | string | null;
  frequency?: string | null;
  customFrequencyMonths?: number | null;
}): number | null {
  if (!pos.generatesPeriodicIncome) return null;
  const amt = Number(pos.expectedPeriodicIncomeAmount ?? 0);
  if (!Number.isFinite(amt) || amt <= 0) return null;
  const f = pos.frequency;
  if (f === 'CUSTOM' && pos.customFrequencyMonths && pos.customFrequencyMonths > 0) {
    return amt / pos.customFrequencyMonths;
  }
  const mult: Record<string, number> = {
    WEEKLY: 52 / 12,
    BIWEEKLY: 26 / 12,
    MONTHLY: 1,
    BIMONTHLY: 0.5,
    QUARTERLY: 1 / 3,
    FOUR_MONTHLY: 0.25,
    SEMIANNUALLY: 1 / 6,
    ANNUALLY: 1 / 12,
  };
  const m = f ? mult[f] : NaN;
  if (!Number.isFinite(m) || m <= 0) return null;
  return amt * m;
}
