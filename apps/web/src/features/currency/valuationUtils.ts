import type { PresentLineResult } from '@/features/currency/api/queries';

export type ValuationLineInput = {
  id: string;
  amount: number;
  currency: string;
  valueDate: string;
};

export function rowsToMap(rows: PresentLineResult[] | undefined): Map<string, PresentLineResult> {
  const m = new Map<string, PresentLineResult>();
  if (!rows) return m;
  for (const r of rows) m.set(r.id, r);
  return m;
}

export function linesFromStreams(streams: any[]): ValuationLineInput[] {
  return streams.map((s) => ({
    id: s.id,
    amount: Number(s.expectedAmount),
    currency: s.currency || 'USD',
    valueDate: new Date(s.startDate).toISOString().slice(0, 10),
  }));
}

export function linesFromPositions(
  positions: any[],
  valuationAsOfDate: string,
): ValuationLineInput[] {
  return positions.flatMap((p) => [
    {
      id: `${p.id}-cap`,
      amount: Number(p.initialCapital),
      currency: p.currency || 'USD',
      valueDate: new Date(p.startDate).toISOString().slice(0, 10),
    },
    {
      id: `${p.id}-val`,
      amount: Number(p.currentEstimatedValue),
      currency: p.currency || 'USD',
      valueDate: valuationAsOfDate,
    },
  ]);
}

export function linesFromDebts(debts: any[]): ValuationLineInput[] {
  return debts.map((d) => ({
    id: d.id,
    amount: Number(d.remainingAmount),
    currency: d.currency || 'USD',
    valueDate: d.createdAt
      ? new Date(d.createdAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  }));
}

/** Resultado del simulador (montos en COP según formularios del producto). */
export function linesFromSimulationResult(
  result: {
    finalBaselineNetWorth: number;
    finalScenarioNetWorth: number;
    years: Array<{
      year: number;
      baselineNetWorth: number;
      scenarioNetWorth: number;
    }>;
  } | null
  | undefined,
  valueDate: string,
): ValuationLineInput[] {
  if (!result) return [];
  const lines: ValuationLineInput[] = [
    {
      id: 'sim-final-base',
      amount: Number(result.finalBaselineNetWorth),
      currency: 'COP',
      valueDate,
    },
    {
      id: 'sim-final-scen',
      amount: Number(result.finalScenarioNetWorth),
      currency: 'COP',
      valueDate,
    },
  ];
  for (const y of result.years) {
    lines.push(
      {
        id: `sim-y${y.year}-base`,
        amount: Number(y.baselineNetWorth),
        currency: 'COP',
        valueDate,
      },
      {
        id: `sim-y${y.year}-scen`,
        amount: Number(y.scenarioNetWorth),
        currency: 'COP',
        valueDate,
      },
    );
  }
  return lines;
}

/** Escenarios fiscales del dashboard (montos motor en COP). */
export function linesFromDashboardTaxScenarios(
  scenarios:
    | Array<{
        taxableBase: number;
        taxLiability: number;
        netTaxPayable: number;
      }>
    | null
    | undefined,
  valueDate: string,
): ValuationLineInput[] {
  if (!scenarios?.length) return [];
  return scenarios.flatMap((s, i) => {
    const prefix = `dash-tax-${i}`;
    return [
      {
        id: `${prefix}-taxableBase`,
        amount: Number(s.taxableBase),
        currency: 'COP',
        valueDate,
      },
      {
        id: `${prefix}-taxLiability`,
        amount: Number(s.taxLiability),
        currency: 'COP',
        valueDate,
      },
      {
        id: `${prefix}-netTaxPayable`,
        amount: Number(s.netTaxPayable),
        currency: 'COP',
        valueDate,
      },
    ];
  });
}

/** Metas: moneda de registro COP o USD según la meta. */
export function linesFromGoals(
  goals: any[],
  valuationAsOfDate: string,
): ValuationLineInput[] {
  const vd = valuationAsOfDate.slice(0, 10);
  return goals.flatMap((g) => {
    const ccy =
      g.currency === 'USD' || g.currency === 'COP' ? g.currency : 'COP';
    return [
      {
        id: `${g.id}-target`,
        amount: Number(g.targetAmount),
        currency: ccy,
        valueDate: vd,
      },
      {
        id: `${g.id}-current`,
        amount: Number(g.currentAmount || 0),
        currency: ccy,
        valueDate: vd,
      },
    ];
  });
}

export function aggregateExpensePieByCategory(
  streams: any[],
  rowMap: Map<string, PresentLineResult>,
): { name: string; value: number }[] {
  const m = new Map<string, number>();
  for (const s of streams) {
    if (s.flowType !== 'EXPENSE') continue;
    const r = rowMap.get(s.id);
    const v = r ? r.presentedAmount : Number(s.expectedAmount);
    const cat = s.category?.name || 'Otros';
    m.set(cat, (m.get(cat) || 0) + v);
  }
  return Array.from(m.entries()).map(([name, value]) => ({ name, value }));
}

export function aggregateIncomeBarByType(
  streams: any[],
  rowMap: Map<string, PresentLineResult>,
): { name: string; value: number }[] {
  const m = new Map<string, number>();
  for (const s of streams) {
    if (s.flowType !== 'INCOME') continue;
    const r = rowMap.get(s.id);
    const v = r ? r.presentedAmount : Number(s.expectedAmount);
    const t = s.streamType || 'OTHER';
    m.set(t, (m.get(t) || 0) + v);
  }
  return Array.from(m.entries()).map(([name, value]) => ({ name, value }));
}

/** Capital del asignador modelado en USD en el API. */
export function linesFromAllocatorPlan(
  plan: {
    availableCapital: number;
    unallocatedCapital: number;
    scenarios: Array<{ id: string; modeledAmount: number; expectedReturnAmount: number }>;
    surplusAlternatives?: Array<{
      id: string;
      modeledAmount: number;
      expectedReturnAmount: number;
    }>;
    capitalBlendMenus?: Array<{
      scenarios: Array<{
        id: string;
        modeledAmount: number;
        expectedReturnAmount: number;
      }>;
    }>;
  },
  asOf: string,
): ValuationLineInput[] {
  const lines: ValuationLineInput[] = [
    {
      id: 'alloc-avail',
      amount: plan.availableCapital,
      currency: 'USD',
      valueDate: asOf,
    },
    {
      id: 'alloc-unalloc',
      amount: plan.unallocatedCapital,
      currency: 'USD',
      valueDate: asOf,
    },
  ];
  const pushScenarioLines = (
    sc: { id: string; modeledAmount: number; expectedReturnAmount: number },
  ) => {
    lines.push({
      id: `alloc-mod-${sc.id}`,
      amount: sc.modeledAmount,
      currency: 'USD',
      valueDate: asOf,
    });
    lines.push({
      id: `alloc-ret-${sc.id}`,
      amount: sc.expectedReturnAmount,
      currency: 'USD',
      valueDate: asOf,
    });
  };
  for (const sc of plan.scenarios) {
    pushScenarioLines(sc);
  }
  for (const sc of plan.surplusAlternatives ?? []) {
    pushScenarioLines(sc);
  }
  for (const menu of plan.capitalBlendMenus ?? []) {
    for (const sc of menu.scenarios) {
      pushScenarioLines(sc);
    }
  }
  return lines;
}

/**
 * Moneda de presentación coherente entre filas. Si se indica `preferredLineId`, se usa esa fila
 * (útil cuando la primera línea puede tener fallback distinto, p. ej. metas / simulación).
 */
export function presentedCurrencyFromRows(
  rows: PresentLineResult[] | undefined,
  displayMode: string,
  preferredLineId?: string,
): string {
  if (preferredLineId && rows?.length) {
    const hit = rows.find((r) => r.id === preferredLineId);
    if (hit?.presentedCurrency) return hit.presentedCurrency;
  }
  return (
    rows?.[0]?.presentedCurrency ?? (displayMode === 'NOMINAL_USD' ? 'USD' : 'COP')
  );
}

export function sumPositionPresented(
  positions: any[],
  rows: PresentLineResult[] | undefined,
): { invested: number | null; value: number | null; currency: string } {
  if (!rows?.length) return { invested: null, value: null, currency: 'COP' };
  let inv = 0;
  let val = 0;
  const ccy = rows[0].presentedCurrency;
  for (const p of positions) {
    const c = rows.find((r) => r.id === `${p.id}-cap`);
    const v = rows.find((r) => r.id === `${p.id}-val`);
    if (!c || !v) return { invested: null, value: null, currency: ccy };
    inv += c.presentedAmount;
    val += v.presentedAmount;
  }
  return { invested: inv, value: val, currency: ccy };
}
