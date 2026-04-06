/**
 * Motor de insights del producto: reglas explicables, priorización y tope para reducir ruido.
 */

export type InsightKind =
  | 'EXCESS_CATEGORY_SPEND'
  | 'LOW_SAVINGS'
  | 'HIGH_FIXED_DEPENDENCY'
  | 'GOAL_BEHIND'
  | 'GOAL_MONTHLY_GAP'
  | 'GOAL_EARLIER_OPPORTUNITY'
  | 'REINVESTMENT_OPPORTUNITY'
  | 'LIQUIDITY_ALERT'
  | 'TAX_OPPORTUNITY'
  | 'TAX_VALIDATION_REMINDER'
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
  /** Acción concreta sugerida (opcional). */
  action?: string;
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
    targetAmount: number;
    currentAmount: number;
    /** ISO date o null si la meta no tiene fecha. */
    targetDate: string | null;
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

/** Meses hasta la fecha objetivo (mín. 1 si el plazo es futuro). */
function monthsFromNowToTarget(iso: string): number | null {
  const end = new Date(iso).getTime();
  if (!Number.isFinite(end)) return null;
  const now = Date.now();
  if (end <= now) return null;
  const msPerMonth = 30.44 * 24 * 60 * 60 * 1000;
  return Math.max(1, Math.ceil((end - now) / msPerMonth));
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
        title: `Estás concentrando mucho gasto en «${cf.topExpenseCategory.name}»`,
        detail: `Esa categoría representa alrededor del ${(cf.topExpenseCategory.share * 100).toFixed(0)}% de tus gastos modelados en streams.`,
        why: 'Regla: categoría con participación ≥ 28% en gastos mensuales esperados.',
        action:
          'Revisa si hay suscripciones o montos duplicados en esa categoría y ajusta streams o presupuesto.',
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
            : 'Tu ahorro “en papel” del modelo es bajo',
        detail:
          cf.savingsRate < 0
            ? 'Con los montos actuales, los gastos superan los ingresos esperados.'
            : `La tasa de ahorro implícita es ~${(cf.savingsRate * 100).toFixed(0)}% de los ingresos (ingresos − gastos en streams).`,
        why: 'Regla: tasa de ahorro (ingresos − gastos) / ingresos < 8%.',
        action:
          cf.savingsRate < 0
            ? 'Prioriza cuadrar ingresos vs gastos fijos o revisa montos en Flujo.'
            : 'Identifica un gasto variable a recortar o un ingreso recurrente a fortalecer; automatiza un ahorro pequeño fijo.',
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
        action:
          'Revisa contratos renegociables (telecom, seguros) y evita nuevos compromisos fijos hasta mejorar el margen.',
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
          action:
            'Aumenta el aporte mensual automatizado a esa meta o mueve una partida puntual desde Flujo.',
          module: 'goals',
          href: HREF.goals,
        }),
      );
      break;
    }
  }

  // 4b. Meta con fecha: ritmo mensual vs margen modelado / oportunidad de adelantar
  const monthlyModelSurplus = cf.incomeTotal - cf.expenseTotal;
  if (monthlyModelSurplus > 0 && goals.length > 0) {
    const dated = goals
      .filter((g) => g.targetDate && g.targetAmount > g.currentAmount)
      .sort((a, b) => {
        const ta = a.targetDate ? new Date(a.targetDate).getTime() : Infinity;
        const tb = b.targetDate ? new Date(b.targetDate).getTime() : Infinity;
        return ta - tb;
      });
    for (const g of dated) {
      if (!g.targetDate) continue;
      const gap = g.targetAmount - g.currentAmount;
      const mLeft = monthsFromNowToTarget(g.targetDate);
      if (mLeft === null) continue;
      const requiredMonthly = gap / mLeft;
      if (requiredMonthly > monthlyModelSurplus * 1.08) {
        out.push(
          insight({
            kind: 'GOAL_MONTHLY_GAP',
            priority: 74,
            severity: 'attention',
            title: `La meta «${g.name}» exige más ritmo mensual que tu margen modelado`,
            detail: `Para la fecha objetivo, harían falta ~${Math.round(requiredMonthly).toLocaleString('es-CO')} COP/mes hacia la meta; el flujo modelado deja ~${Math.round(monthlyModelSurplus).toLocaleString('es-CO')} COP/mes de margen.`,
            why: 'Regla: (objetivo − ahorrado) / meses restantes > 8% por encima del margen mensual (ingresos − gastos en streams).',
            action:
              'Amplía plazo, reduce el monto objetivo o busca ingreso adicional; registra el cambio en Metas o Flujo.',
            module: 'goals',
            href: HREF.goals,
          }),
        );
        break;
      }
      if (
        requiredMonthly > 0 &&
        requiredMonthly < monthlyModelSurplus * 0.72 &&
        g.expectedProgress !== null &&
        g.progress + 0.08 >= g.expectedProgress
      ) {
        out.push(
          insight({
            kind: 'GOAL_EARLIER_OPPORTUNITY',
            priority: 60,
            severity: 'info',
            title: `Podrías acercarte antes a «${g.name}»`,
            detail: `El mínimo orientativo para llegar a tiempo es ~${Math.round(requiredMonthly).toLocaleString('es-CO')} COP/mes; tu margen modelado es mayor, así que un aporte constante podría adelantar el cierre (ilustrativo).`,
            why: 'Regla: ritmo requerido < 72% del margen mensual modelado y progreso ≥ avance temporal esperado − 8 pp.',
            action:
              'Programa un aporte automático recurrente a la meta por encima del mínimo y revisa cada trimestre.',
            module: 'goals',
            href: HREF.goals,
          }),
        );
        break;
      }
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
          'En los eventos de tus posiciones hay más retiros de utilidades que reinversiones; podrías evaluar coherencia con tu horizonte.',
        why: 'Regla: suma de PROFIT_DISTRIBUTION > suma de PROFIT_REINVESTMENT en el histórico registrado.',
        action:
          'Definí en Metas si buscás ingreso corriente o acumulación de patrimonio; alineá los próximos eventos con esa decisión.',
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
          action:
            'Evita asignar capital ilíquido hasta tener colchón; prioriza cuotas o metas de liquidez en Asignador y Deudas.',
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
          action:
            'Actualiza el perfil fiscal con montos reales y revisa la sección de escenarios con un asesor si la brecha es material.',
          module: 'tax',
          href: HREF.tax,
        }),
      );
      out.push(
        insight({
          kind: 'TAX_VALIDATION_REMINDER',
          priority: 54,
          severity: 'info',
          title: 'Este escenario fiscal requiere validación',
          detail:
            'Cualquier brecha entre escenarios en la app es modelo + supuestos: no sustituye declaración ni dictamen.',
          why: 'Regla: existe TaxPlan con escenarios CONSERVATIVE y OPTIMIZED y brecha estimada > 0.',
          action:
            'Cruza cifras con comprobantes y norma del año gravable antes de tomar decisiones de caja.',
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
          action:
            'Marca solo lo que aplica y carga montos aproximados para que el modelo refleje tu caso.',
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
        title: 'Patrimonio concentrado por categoría',
        detail: `Cerca del ${(inv.topTypeShare * 100).toFixed(0)}% del valor está en «${inv.topTypeName ?? 'una categoría'}».`,
        why: 'Regla: una categoría de patrimonio concentra ≥58% del valor y hay al menos dos posiciones.',
        action:
          'Revisa en Patrimonio o en el simulador qué implica diversificar gradualmente sin forzar costos de salida.',
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
        action: up
          ? 'Canaliza el excedente a meta o deuda según tu plan; evita que se diluya en gasto discrecional.'
          : 'Revisa categorías que subieron el último mes y normaliza ingresos extraordinarios en Flujo.',
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
