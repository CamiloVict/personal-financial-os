export type DebtPresetId = 'pay_down' | 'base' | 'growth';

export const DEBT_PRESET_META: Record<
  DebtPresetId,
  { label: string; hint: string }
> = {
  pay_down: {
    label: 'Priorizar deuda',
    hint: 'Más capital extra al préstamo, retorno de inversión más bajo.',
  },
  base: {
    label: 'Balanceado',
    hint: 'Valores por defecto del formulario.',
  },
  growth: {
    label: 'Priorizar crecimiento',
    hint: 'Menos extra a deuda, asume mayor retorno en inversión.',
  },
};

export type DebtFieldValues = {
  debtBalance: string;
  debtInterestRateAnnual: string;
  minimumMonthlyPayment: string;
  monthlyExtraCapital: string;
  investmentReturnAnnual: string;
  yearsToSimulateDebt: string;
};

export function getDebtPresetValues(id: DebtPresetId): DebtFieldValues {
  const base: DebtFieldValues = {
    debtBalance: '50000000',
    debtInterestRateAnnual: '28',
    minimumMonthlyPayment: '1500000',
    monthlyExtraCapital: '1000000',
    investmentReturnAnnual: '10',
    yearsToSimulateDebt: '10',
  };

  switch (id) {
    case 'base':
      return base;
    case 'pay_down':
      return {
        ...base,
        monthlyExtraCapital: '2000000',
        investmentReturnAnnual: '7',
      };
    case 'growth':
      return {
        ...base,
        monthlyExtraCapital: '400000',
        investmentReturnAnnual: '14',
      };
    default:
      return base;
  }
}
