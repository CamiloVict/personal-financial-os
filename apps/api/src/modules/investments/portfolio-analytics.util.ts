/** Delta en valor estimado de la posición (misma lógica que `createEvent` en investments.service). */
export function eventEstimatedValueDelta(
  type: string,
  amount: number,
): number {
  const a = Number(amount) || 0;
  switch (type) {
    case 'CAPITAL_CONTRIBUTION':
    case 'VALUATION_INCREASE':
    case 'PROFIT_REINVESTMENT':
      return a;
    case 'CAPITAL_WITHDRAWAL':
    case 'VALUATION_DECREASE':
    case 'PROFIT_DISTRIBUTION':
      return -a;
    default:
      return 0;
  }
}

export type PositionEventRow = {
  id: string;
  date: Date;
  type: string;
  amount: unknown;
};

export type PositionForHistory = {
  id: string;
  startDate: Date;
  currentEstimatedValue: unknown;
  events: PositionEventRow[];
};

/** v0 + sum(deltas) = valor actual (si los eventos son consistentes con el estado actual). */
export function impliedStartValue(
  currentEstimatedValue: number,
  eventsAsc: PositionEventRow[],
): number {
  let sum = 0;
  for (const e of eventsAsc) {
    sum += eventEstimatedValueDelta(e.type, Number(e.amount));
  }
  return currentEstimatedValue - sum;
}

export type ValuePoint = { date: string; value: number };

/**
 * Puntos (fecha ISO día) del valor estimado de una posición tras cada evento.
 */
export function positionValueTimeline(
  position: PositionForHistory,
): ValuePoint[] {
  const current = Number(position.currentEstimatedValue ?? 0);
  const events = [...position.events].sort((a, b) => {
    const t = a.date.getTime() - b.date.getTime();
    return t !== 0 ? t : a.id.localeCompare(b.id);
  });
  const v0 = impliedStartValue(current, events);
  const points: ValuePoint[] = [
    { date: dayKey(position.startDate), value: v0 },
  ];
  let v = v0;
  for (const e of events) {
    v += eventEstimatedValueDelta(e.type, Number(e.amount));
    points.push({ date: dayKey(e.date), value: v });
  }
  return points;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function valueAtOrBefore(timeline: ValuePoint[], day: string): number {
  if (timeline.length === 0) return 0;
  if (day < timeline[0].date) return 0;
  let last = timeline[0].value;
  for (const p of timeline) {
    if (p.date > day) break;
    last = p.value;
  }
  return last;
}

/**
 * Serie agregada del portafolio (suma de valores por posición en fechas relevantes).
 */
export function mergePortfolioValueSeries(
  positions: PositionForHistory[],
): ValuePoint[] {
  const timelines = positions.map((p) => ({
    id: p.id,
    points: positionValueTimeline(p),
  }));
  const daySet = new Set<string>();
  for (const t of timelines) {
    for (const p of t.points) daySet.add(p.date);
  }
  const days = [...daySet].sort();
  const out: ValuePoint[] = [];
  for (const day of days) {
    let total = 0;
    for (const t of timelines) {
      total += valueAtOrBefore(t.points, day);
    }
    out.push({ date: day, value: total });
  }
  return out;
}

export function monthKeyFromDate(d: Date): string {
  return d.toISOString().slice(0, 7);
}

export function bucketEventsByMonth(
  events: { date: Date; amount: number }[],
  monthsBack: number,
): Map<string, number> {
  const cutoff = new Date();
  cutoff.setUTCMonth(cutoff.getUTCMonth() - monthsBack);
  const m = new Map<string, number>();
  for (const e of events) {
    if (e.date < cutoff) continue;
    const key = monthKeyFromDate(e.date);
    m.set(key, (m.get(key) ?? 0) + e.amount);
  }
  return m;
}

export function unionMonthKeys(...maps: Map<string, number>[]): string[] {
  const s = new Set<string>();
  for (const map of maps) for (const k of map.keys()) s.add(k);
  return [...s].sort();
}
