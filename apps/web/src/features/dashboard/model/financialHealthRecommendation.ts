import type { ConfidenceLevel } from '@personal-finance-os/explanation';

/** Entradas derivadas solo en hooks / capa de datos; sin JSX. */
export type FinancialHealthInput = {
  hasStreams: boolean;
  hasPositions: boolean;
  income: number;
  expense: number;
  savingsRate: number | null;
  totalDebt: number;
  investmentsValue: number;
  netWorthApprox: number;
  goalsCount: number;
  goalsAvgProgress: number | null;
  taxHasScenarios: boolean;
  taxConfidenceLevel?: ConfidenceLevel;
  leverageRatio: number | null;
  cashflowEventCount: number;
};

export type HeroRecommendation = {
  title: string;
  detail: string;
  tone: 'positive' | 'warning' | 'neutral';
};

/**
 * Una sola recomendación priorizada para la cabecera del dashboard.
 * Orden: datos faltantes → flujo negativo → apalancamiento → fiscal → metas → positivo por defecto.
 */
export function pickFinancialHealthRecommendation(
  i: FinancialHealthInput,
): HeroRecommendation {
  if (!i.hasStreams && !i.hasPositions) {
    return {
      title: 'Completá tu modelo base',
      detail:
        'Registrá al menos un flujo en Cashflow o una posición en Portafolio para ver ingresos, gastos y patrimonio en un solo lugar.',
      tone: 'neutral',
    };
  }

  if (i.income > 0 && i.savingsRate !== null && i.savingsRate < 0) {
    return {
      title: 'Flujo mensual modelado en rojo',
      detail:
        'Con los montos esperados actuales, los gastos superan los ingresos. Revisá categorías en Cashflow o ajustá montos para ver un escenario sostenible.',
      tone: 'warning',
    };
  }

  if (i.leverageRatio !== null && i.leverageRatio > 0.55 && i.totalDebt > 0) {
    return {
      title: 'Apalancamiento elevado',
      detail:
        'La deuda representa una parte importante frente a tus activos modelados. Revisá cuotas y tasas en Deudas y priorizá reducir costo de capital.',
      tone: 'warning',
    };
  }

  if (i.taxConfidenceLevel === 'LOW' && i.taxHasScenarios) {
    return {
      title: 'Fiscal: confianza baja en los datos',
      detail:
        'Los escenarios tributarios son ilustrativos pero la completitud de datos es limitada. Completá perfil y fuentes en Fiscal para decisiones más sólidas.',
      tone: 'warning',
    };
  }

  if (!i.taxHasScenarios && i.hasPositions) {
    return {
      title: 'Activá tu plan fiscal',
      detail:
        'Tenés patrimonio registrado pero no hay escenarios fiscales recientes. Generá un plan en Fiscal para estimar carga y comparar escenarios.',
      tone: 'neutral',
    };
  }

  if (
    i.goalsCount > 0 &&
    i.goalsAvgProgress !== null &&
    i.goalsAvgProgress < 0.25
  ) {
    return {
      title: 'Metas con avance bajo',
      detail:
        'Varias metas van rezagadas respecto al objetivo. Revisá montos actuales o plazos en Metas y alinea aportes con tu flujo libre.',
      tone: 'warning',
    };
  }

  if (i.cashflowEventCount < 3 && i.hasStreams) {
    return {
      title: 'Registrá más movimientos reales',
      detail:
        'La tendencia mensual mejora cuando cargás pagos e ingresos efectivos en Cashflow; así el gráfico refleja tu historia, no solo el modelo.',
      tone: 'neutral',
    };
  }

  if (i.savingsRate !== null && i.savingsRate >= 0.1) {
    return {
      title: 'Buen margen de flujo libre',
      detail:
        'Tu modelo muestra ahorro neto positivo. Podés dirigir ese margen a metas, deuda o inversión según prioridad.',
      tone: 'positive',
    };
  }

  return {
    title: 'Vista consolidada',
    detail:
      'Revisá gráficos y KPIs abajo para cashflow, patrimonio, metas y fiscal. Usá Planificación para escenarios hipotéticos sin tocar tus datos.',
    tone: 'neutral',
  };
}
