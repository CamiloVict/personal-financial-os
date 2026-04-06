/**
 * Proyecciones de meta con aporte mensual y tasa mensual equivalente (TAE nominal).
 * Sin dependencias de framework: apto para tests unitarios.
 */

/** Meses de horizonte cuando la meta no tiene fecha objetivo (ritmo sugerido). */
export const DEFAULT_GOAL_PLANNING_HORIZON_MONTHS = 12;

const FREQ_TO_MONTHLY_MULT: Record<string, number> = {
  WEEKLY: 52 / 12,
  BIWEEKLY: 26 / 12,
  MONTHLY: 1,
  BIMONTHLY: 0.5,
  QUARTERLY: 1 / 3,
  FOUR_MONTHLY: 0.25,
  SEMIANNUALLY: 1 / 6,
  ANNUALLY: 1 / 12,
};

/**
 * Convierte el monto esperado de un flujo de caja a equivalente mensual según su frecuencia.
 */
export function cashflowStreamToMonthlyEquivalent(
  expectedAmount: number,
  frequency: string,
  customFrequencyMonths: number | null | undefined,
): number {
  const amt = Number(expectedAmount);
  if (!Number.isFinite(amt)) return 0;
  const f = String(frequency ?? 'MONTHLY').trim().toUpperCase();
  if (f === 'CUSTOM') {
    if (
      customFrequencyMonths != null &&
      customFrequencyMonths > 0
    ) {
      return amt / customFrequencyMonths;
    }
    return amt;
  }
  const m = FREQ_TO_MONTHLY_MULT[f];
  return Number.isFinite(m) ? amt * m : amt;
}

/**
 * Meses entre hoy y la fecha objetivo (UTC, calendario). Sin fecha: horizonte de planificación por defecto.
 */
export function monthsRemainingForGoal(
  targetDate: Date | null | undefined,
  now: Date,
): {
  months: number;
  openEnded: boolean;
  targetInPast: boolean;
} {
  if (!targetDate || Number.isNaN(targetDate.getTime())) {
    return {
      months: DEFAULT_GOAL_PLANNING_HORIZON_MONTHS,
      openEnded: true,
      targetInPast: false,
    };
  }
  const end = new Date(
    Date.UTC(
      targetDate.getUTCFullYear(),
      targetDate.getUTCMonth(),
      targetDate.getUTCDate(),
    ),
  );
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  if (end.getTime() < start.getTime()) {
    return { months: 1, openEnded: false, targetInPast: true };
  }
  const msPerAvgMonth = (365.25 / 12) * 24 * 60 * 60 * 1000;
  const months = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / msPerAvgMonth),
  );
  return { months, openEnded: false, targetInPast: false };
}

export function annualToMonthlyRate(annualPercent: number): number {
  if (annualPercent <= 0) return 0;
  return Math.pow(1 + annualPercent / 100, 1 / 12) - 1;
}

/** Valor futuro: saldo inicial + cuota constante al final de cada mes durante n meses. */
export function futureValue(
  presentValue: number,
  monthlyPayment: number,
  monthlyRate: number,
  months: number,
): number {
  if (months <= 0) return presentValue;
  if (monthlyRate === 0) {
    return presentValue + monthlyPayment * months;
  }
  const factor = Math.pow(1 + monthlyRate, months);
  return (
    presentValue * factor +
    (monthlyPayment * (factor - 1)) / monthlyRate
  );
}

/**
 * Meses mínimos para alcanzar al menos `targetBalance` con aporte positivo y/o interés.
 * Búsqueda binaria 1..maxMonths (cap 600 = 50 años).
 */
export function monthsToReachTarget(
  presentValue: number,
  monthlyPayment: number,
  monthlyRate: number,
  targetBalance: number,
  maxMonths = 600,
): number | null {
  if (targetBalance <= presentValue) return 0;
  if (monthlyPayment <= 0 && monthlyRate <= 0) return null;

  const fvAt = (n: number) =>
    futureValue(presentValue, monthlyPayment, monthlyRate, n);

  if (fvAt(maxMonths) < targetBalance) return null;

  let lo = 1;
  let hi = maxMonths;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fvAt(mid) >= targetBalance) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

/** Aportes acumulados (nominal) vs crecimiento por interés hasta FV. */
export function splitContributionVsGrowth(
  presentValue: number,
  monthlyPayment: number,
  monthlyRate: number,
  months: number,
): { contributions: number; growth: number; futureValue: number } {
  const fv = futureValue(presentValue, monthlyPayment, monthlyRate, months);
  const contributions = presentValue + monthlyPayment * months;
  const growth = fv - contributions;
  return { contributions, growth, futureValue: fv };
}

export type ProjectionScenarioKey =
  | 'ACTUAL'
  | 'CONSERVATIVE'
  | 'BASE'
  | 'OPTIMIZED'
  | 'COMBINED';

export interface ProjectionScenarioInput {
  key: ProjectionScenarioKey;
  label: string;
  annualReturnPct: number;
  /** Si true, usa el ahorro mensual requerido en lugar del flujo libre actual. */
  useRequiredMonthly?: boolean;
}

export const DEFAULT_PROJECTION_SCENARIOS: ProjectionScenarioInput[] = [
  {
    key: 'ACTUAL',
    label: 'Actual (sin rendimiento en la meta)',
    annualReturnPct: 0,
  },
  {
    key: 'CONSERVATIVE',
    label: 'Conservador (2% anual nominal, ilustrativo)',
    annualReturnPct: 2,
  },
  {
    key: 'BASE',
    label: 'Base (4% anual nominal, ilustrativo)',
    annualReturnPct: 4,
  },
  {
    key: 'OPTIMIZED',
    label: 'Optimizado (8% anual nominal, ilustrativo)',
    annualReturnPct: 8,
  },
  {
    key: 'COMBINED',
    label: 'Combinado (aportar lo requerido + 4% anual)',
    annualReturnPct: 4,
    useRequiredMonthly: true,
  },
];

/**
 * Equivalente mensual orientativo de utilidades hacia la meta cuando la cadencia es trimestral.
 * Con cadencia manual no suma al flujo modelado (se espera ajuste del saldo actual).
 */
export function utilityImpliedMonthlySavings(params: {
  mode: 'NONE' | 'AMOUNT' | 'PERCENT';
  cadence: 'QUARTERLY' | 'MANUAL';
  utilityValue: number;
  currentAmount: number;
}): number {
  const { mode, cadence, utilityValue, currentAmount } = params;
  if (mode === 'NONE' || utilityValue <= 0 || cadence === 'MANUAL') return 0;
  if (mode === 'AMOUNT') return utilityValue / 3;
  if (mode === 'PERCENT')
    return (Math.max(0, currentAmount) * (utilityValue / 100)) / 3;
  return 0;
}
