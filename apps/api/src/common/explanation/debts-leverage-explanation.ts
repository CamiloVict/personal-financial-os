import type { FinancialExplanation } from '@personal-finance-os/explanation';
import { createNode, emptyFinancialExplanation } from '@personal-finance-os/explanation';

export function buildLeverageAnalysisExplanation(opts: {
  debtCount: number;
  positionCount: number;
}): FinancialExplanation {
  return {
    ...emptyFinancialExplanation(
      'debts.leverage_analysis',
      'Análisis de apalancamiento y clasificación de deudas',
    ),
    summary:
      'Clasificación heurística para visualización; no es recomendación de inversión ni asesoría de crédito.',
    inputs: [
      createNode({
        kind: 'input',
        label: 'Deudas con saldo > 0',
        value: opts.debtCount,
      }),
      createNode({
        kind: 'input',
        label: 'Posiciones de inversión activas',
        value: opts.positionCount,
      }),
    ],
    steps: [
      createNode({
        kind: 'rule',
        label: 'Deuda “buena” (apalancamiento)',
        description:
          'Hipoteca, crédito comercial, o deuda vinculada a posición distinta de AUTO_LOAN y CREDIT_CARD. Se estiman métricas con tasas fijas del modelo (apreciación 5%, flujo 6%).',
        ruleRef: 'DEBT-GOOD-HEURISTIC-v1',
      }),
      createNode({
        kind: 'rule',
        label: 'Deuda “mala” (consumo)',
        description:
          'Tarjetas, préstamos personales sin vínculo productivo, y créditos de vehículo (AUTO_LOAN) aunque estén ligados a un activo.',
        ruleRef: 'DEBT-BAD-HEURISTIC-v1',
      }),
      createNode({
        kind: 'rule',
        label: 'Escudo fiscal hipotecario',
        description:
          'Solo se modela reducción de costo de deuda para MORTGAGE (tasa marginal 35% simplificada).',
        ruleRef: 'DEBT-TAX-SHIELD-MORTGAGE',
      }),
    ],
    assumptions: [
      'Apreciación anual del activo 5% y retorno por flujo 6% son supuestos fijos del motor, no pronósticos del usuario.',
      'Tipo de cambio e inflación no modelados en el ratio de apalancamiento.',
      'Costo efectivo de deuda y cash-on-cash son indicativos.',
    ],
    missingData: [
      'Historial de pagos reales y comisiones del crédito.',
      'Valor de mercado actualizado del colateral (se usa valoración de posición o aproximación).',
    ],
    normativeRefs: [],
  };
}
