/** Valores de formulario (strings) para acelerar “qué pasa si” sin tocar el backend. */

export type PropertyPresetId =
  | 'conservative'
  | 'base'
  | 'aggressive'
  | 'high_inflation'
  | 'reinvest_total';

export const PROPERTY_PRESET_META: Record<
  PropertyPresetId,
  { label: string; hint: string }
> = {
  conservative: {
    label: 'Conservador',
    hint: 'Menor apreciación, más gasto de mantenimiento, alternativa prudente.',
  },
  base: {
    label: 'Base',
    hint: 'Punto de partida equilibrado del modelo.',
  },
  aggressive: {
    label: 'Agresivo',
    hint: 'Más apreciación y retorno alternativo; mayor optimismo.',
  },
  high_inflation: {
    label: 'Inflación alta',
    hint: 'Más mantenimiento y tasa de crédito; apreciación moderada.',
  },
  reinvest_total: {
    label: 'Reinversión total',
    hint: 'Énfasis en cartera alternativa vs vivienda (misma compra, distinto trade-off).',
  },
};

export type PropertyFieldValues = {
  propertyValue: string;
  downPayment: string;
  interestRateAnnual: string;
  loanTermYears: string;
  expectedMonthlyRent: string;
  expectedAnnualAppreciation: string;
  maintenanceAnnualPercentage: string;
  baselineInvestmentReturn: string;
};

export function getPropertyPresetValues(id: PropertyPresetId): PropertyFieldValues {
  const base: PropertyFieldValues = {
    propertyValue: '500000000',
    downPayment: '150000000',
    interestRateAnnual: '12',
    loanTermYears: '15',
    expectedMonthlyRent: '2500000',
    expectedAnnualAppreciation: '5',
    maintenanceAnnualPercentage: '1',
    baselineInvestmentReturn: '8',
  };

  switch (id) {
    case 'base':
      return base;
    case 'conservative':
      return {
        ...base,
        expectedMonthlyRent: '2200000',
        expectedAnnualAppreciation: '3',
        maintenanceAnnualPercentage: '1.5',
        baselineInvestmentReturn: '6',
      };
    case 'aggressive':
      return {
        ...base,
        expectedMonthlyRent: '2800000',
        expectedAnnualAppreciation: '8',
        maintenanceAnnualPercentage: '1',
        baselineInvestmentReturn: '10',
      };
    case 'high_inflation':
      return {
        ...base,
        interestRateAnnual: '14',
        expectedAnnualAppreciation: '7',
        maintenanceAnnualPercentage: '2.5',
        baselineInvestmentReturn: '7',
      };
    case 'reinvest_total':
      return {
        ...base,
        expectedMonthlyRent: '2000000',
        expectedAnnualAppreciation: '4',
        baselineInvestmentReturn: '12',
      };
    default:
      return base;
  }
}
