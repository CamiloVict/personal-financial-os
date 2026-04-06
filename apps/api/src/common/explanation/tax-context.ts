import type { FinancialExplanation } from '@personal-finance-os/explanation';
import { createNode, mergeFinancialExplanations } from '@personal-finance-os/explanation';

/** Enriquece explicación fiscal con contexto de ingresos y datos faltantes por stream. */
export function augmentTaxExplanation(
  base: FinancialExplanation,
  opts: {
    incomeStreamCount: number;
    engineVersion: string;
    missingConditions?: string[];
    extraAssumptions?: string[];
  },
): FinancialExplanation {
  const extraInputs = [
    createNode({
      kind: 'input',
      label: 'Flujos de ingreso considerados (Cashflow)',
      value: opts.incomeStreamCount,
      description: 'Solo streams tipo INCOME; monto anual = expectedAmount × 12.',
      meta: { engineVersion: opts.engineVersion },
    }),
  ];

  return mergeFinancialExplanations(base, {
    inputs: extraInputs,
    missingData: opts.missingConditions ?? [],
    assumptions: opts.extraAssumptions ?? [],
  });
}
