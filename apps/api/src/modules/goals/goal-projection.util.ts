/**
 * Proyecciones de meta con aporte mensual y tasa mensual equivalente (TAE nominal).
 * Sin dependencias de framework: apto para tests unitarios.
 */

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
