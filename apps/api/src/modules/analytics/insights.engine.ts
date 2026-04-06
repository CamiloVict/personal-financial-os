/**
 * Motor de insights del producto: reglas explicables, priorización y tope para reducir ruido.
 */

export type InsightKind =
  | 'EXCESS_CATEGORY_SPEND'
  | 'LOW_SAVINGS'
  | 'HIGH_FIXED_DEPENDENCY'
  | 'GOAL_BEHIND'
  | 'REINVESTMENT_OPPORTUNITY'
  | 'LIQUIDITY_ALERT'
  | 'TAX_OPPORTUNITY'
  | 'ASSET_CONCENTRATION'
  | 'CASHFLOW_IMPROVEMENT';

export type InsightModule =
  | 'cashflow'
  | 'goals'
  | 'investments'
  | 'tax'
  | 'debts'
  | 'global';

export type ProductInsight = {
  id: string;
  kind: InsightKind;
  /** 1–100; mayor = más relevante para mostrar arriba. */
  priority: number;
  severity: 'info' | 'attention' | 'warning';
  title: string;
  detail: string;
  /** Por qué aparece este insight (regla / datos). */
  why: string;
  module: InsightModule;
  href: string;
};

export type InsightSnapshot = {
  cashflow: {
    streamsCount: number;
    incomeTotal: number;
    expenseTotal: number;
    expenseFixed: number;
    savingsRate: number | null;
    fixedExpenseShareOfIncome: number | null;
    /** Mayor categoría de gasto (share 0–1). */
    topExpenseCategory: { name: string; share: number } | null;
    lastMonthNet: number;
    avgNet3: number;
    vsRolling3Pct: number | null;
  };
  goals: Array<{
    id: string;
    name: string;
    progress: number;
    expectedProgress: number | null;
  }>;
  investments: {
    positionCount: number;
    totalValue: number;
    topTypeShare: number | null;
    topTypeName: string | null;
    profitDistributedExceedsReinvest: boolean;
  };
  debts: {
    totalRemaining: number;
    monthlyPaymentTotal: number;
  };
  tax: {
    hasProfile: boolean;
    hasPlan: boolean;
    taxSavingsPotential: number | null;
    unclaimedBenefitHints: number;
  };
};

const HREF = {
  cashflow: '/cashflow',
  goals: '/goals',
  investments: '/investment-positions',
  tax: '/tax',
  debts: '/debts',
  dashboard: '/',
} as const;

function insight(
  partial: Omit<ProductInsight, 'id'> & { id?: string },
): ProductInsight {
  const id =
    partial.id ??
    `${partial.kind}:${partial.module}:${partial.title.slice(0, 24)}`;
  return { ...partial, id };
}

export function buildInsightsFromSnapshot(s: InsightSnapshot): ProductInsight[] {
  const out: ProductInsight[] = [];
  const { cashflow: cf, goals, investments: inv, debts, tax } = s;

  // 1. Gasto concentrado por categoría (solo la más alta si supera umbral)
  if (
    cf.topExpenseCategory &&
    cf.topExpenseCategory.share >= 0.28 &&
    cf.expenseTotal > 0
  ) {
    out.push(
      insight({
        kind: 'EXCESS_CATEGORY_SPEND',
        priority: 72,
        severity: 'attention',
        title: 'Gasto concentrado en una categoría',
        detail: `«${cf.topExpenseCategory.name}» representa alrededor del ${(cf.topExpenseCategory.share * 100).toFixed(0)}% de tus gastos modelados.`,
        why: 'Regla: categoría con participación ≥ 28% en gastos mensuales esperados.',
        module: 'cashflow',
        href: HREF.cashflow,
      }),
    );
  }

  // 2. Bajo ahorro (tasa de ahorro del modelo)
  if (cf.savingsRate !== null && cf.incomeTotal > 0 && cf.savingsRate < 0.08) {
    out.push(
      insight({
        kind: 'LOW_SAVINGS',
        priority: 78,
        severity: cf.savingsRate < 0 ? 'warning' : 'attention',
        title:
          cf.savingsRate < 0
            ? 'Flujo modelado en déficit'
            : 'Tasa de ahorro baja en el modelo',
        detail:
          cf.savingsRate < 0
            ? 'Con los montos actuales, los gastos superan los ingresos esperados.'
            : `La tasa de ahorro implícita es ~${(cf.savingsRate * 100).toFixed(0)}% de los ingresos.`,
        why: 'Regla: tasa de ahorro (ingresos − gastos) / ingresos < 8%.',
        module: 'cashflow',
        href: HREF.cashflow,
      }),
    );
  }

  // 3. Alta dependencia de gasto fijo
  if (
    cf.fixedExpenseShareOfIncome !== null &&
    cf.fixedExpenseShareOfIncome >= 0.48
  ) {
    out.push(
      insight({
        kind: 'HIGH_FIXED_DEPENDENCY',
        priority: 70,
        severity: 'attention',
        title: 'Mucho compromiso en gastos fijos',
        detail: `Los gastos fijos modelados absorben ~${(cf.fixedExpenseShareOfIncome * 100).toFixed(0)}% de tus ingresos.`,
        why: 'Regla: gastos fijos / ingresos ≥ 48%.',
        module: 'cashflow',
        href: HREF.cashflow,
      }),
    );
  }

  // 4. Meta atrasada (vs avance temporal lineal)
  for (const g of goals) {
    if (
      g.expectedProgress !== null &&
      g.progress + 0.12 < g.expectedProgress &&
      g.expectedProgress > 0.05
    ) {
      out.push(
        insight({
          kind: 'GOAL_BEHIND',
          priority: 80,
          severity: 'warning',
          title: `Meta «${g.name}» va rezagada`,
          detail: `Llevas ~${(g.progress * 100).toFixed(0)}% del objetivo y el calendario sugería ~${(g.expectedProgress * 100).toFixed(0)}%.`,
          why: 'Regla: progreso actual al menos 12 puntos porcentuales por debajo del avance temporal lineal hasta la fecha objetivo.',
          module: 'goals',
          href: HREF.goals,
        }),
      );
      break;
    }
  }

  // 5. Oportunidad de reinversión (distribuciones >> reinversiones)
  if (inv.profitDistributedExceedsReinvest && inv.positionCount > 0) {
    out.push(
      insight({
        kind: 'REINVESTMENT_OPPORTUNITY',
        priority: 62,
        severity: 'info',
        title: 'Más utilidades retiradas que reinvertidas',
        detail:
          'En tus eventos de inversiones hay más retiros de utilidades que reinversiones; podrías evaluar coherencia con tu horizonte.',
        why: 'Regla: suma de PROFIT_DISTRIBUTION > suma de PROFIT_REINVESTMENT en el histórico registrado.',
        module: 'investments',
        href: HREF.investments,
      }),
    );
  }

  // 6. Alerta de liquidez: poco margen tras fijos y deudas
  const monthlyIncome = cf.incomeTotal;
  const fixedExp = cf.expenseFixed;
  if (monthlyIncome > 0 && debts.monthlyPaymentTotal >= 0) {
    const afterFixed = monthlyIncome - fixedExp;
    const afterDebt = afterFixed - debts.monthlyPaymentTotal;
    if (
      afterDebt < monthlyIncome * 0.05 &&
      (afterDebt < cf.avgNet3 || cf.avgNet3 <= 0)
    ) {
      out.push(
        insight({
          kind: 'LIQUIDITY_ALERT',
          priority: 85,
          severity: 'warning',
          title: 'Margen de liquidez ajustado',
          detail:
            'Tras gastos fijos modelados y cuotas de deuda, queda poco colchón respecto a tus ingresos.',
          why: 'Regla: (ingresos − fijos − cuotas deuda) < 5% de ingresos o menor que el promedio de flujo neto reciente.',
          module: 'debts',
          href: HREF.debts,
        }),
      );
    }
  }

  // 7. Oportunidad fiscal (un solo insight por tipo: prioriza brecha entre escenarios)
  if (tax.hasProfile) {
    if (
      tax.hasPlan &&
      tax.taxSavingsPotential !== null &&
      tax.taxSavingsPotential > 0
    ) {
      out.push(
        insight({
          kind: 'TAX_OPPORTUNITY',
          priority: 68,
          severity: 'info',
          title: 'Espacio orientativo entre escenarios fiscales',
          detail: `El plan guardado muestra ~${Math.round(tax.taxSavingsPotential).toLocaleString('es-CO')} COP de diferencia entre escenario prudente y con beneficios del perfil (validar con soportes y norma vigente).`,
          why: 'Regla: impuesto neto escenario CONSERVATIVE menos OPTIMIZED del último TaxPlan.',
          module: 'tax',
          href: HREF.tax,
        }),
      );
    } else if (tax.unclaimedBenefitHints >= 3) {
      out.push(
        insight({
          kind: 'TAX_OPPORTUNITY',
          priority: 55,
          severity: 'info',
          title: 'Revisa beneficios en tu perfil fiscal',
          detail:
            'Varios beneficios frecuentes no están marcados; si aplican a tu caso, actualizar el perfil mejora la proyección.',
          why: 'Regla: ≥3 banderas de beneficio (AFC, FPV, etc.) sin activar en TaxProfile.',
          module: 'tax',
          href: HREF.tax,
        }),
      );
    }
  }

  // 8. Concentración en tipo de activo
  if (
    inv.topTypeShare !== null &&
    inv.topTypeShare >= 0.58 &&
    inv.positionCount >= 2
  ) {
    out.push(
      insight({
        kind: 'ASSET_CONCENTRATION',
        priority: 64,
        severity: 'attention',
        title: 'Portafolio concentrado por tipo',
        detail: `Cerca del ${(inv.topTypeShare * 100).toFixed(0)}% del valor está en «${inv.topTypeName ?? 'un tipo'}».`,
        why: 'Regla: un tipo de inversión concentra ≥58% del valor y hay al menos dos posiciones.',
        module: 'investments',
        href: HREF.investments,
      }),
    );
  }

  // 9. Mejora potencial en cashflow (último mes vs media 3m)
  if (
    cf.vsRolling3Pct !== null &&
    Math.abs(cf.vsRolling3Pct) > 0.12 &&
    cf.streamsCount > 0
  ) {
    const up = cf.vsRolling3Pct > 0;
    out.push(
      insight({
        kind: 'CASHFLOW_IMPROVEMENT',
        priority: 58,
        severity: 'info',
        title: up ? 'Flujo neto mejoró vs. reciente' : 'Flujo neto bajó vs. reciente',
        detail: up
          ? 'El último mes con eventos muestra un neto por encima de tu media de 3 meses; podrías aprovechar el margen con prioridades claras.'
          : 'El último mes con eventos está por debajo de la media de 3 meses; conviene revisar gastos o ingresos extraordinarios.',
        why: 'Regla: variación del último neto mensual vs. media móvil de 3 meses > 12%.',
        module: 'global',
        href: HREF.dashboard,
      }),
    );
  }

  return out;
}

export function prioritizeInsights(
  insights: ProductInsight[],
  max = 8,
): ProductInsight[] {
  const seen = new Set<InsightKind>();
  const sorted = [...insights].sort((a, b) => b.priority - a.priority);
  const out: ProductInsight[] = [];
  for (const i of sorted) {
    if (seen.has(i.kind)) continue;
    seen.add(i.kind);
    out.push(i);
    if (out.length >= max) break;
  }
  return out;
}
