import type { SimulationMetricColor } from '../types';

const METRIC_CLASS_MAP: Record<
  SimulationMetricColor,
  { wrap: string; label: string; value: string }
> = {
  emerald: {
    wrap: 'bg-emerald-50 border-emerald-200',
    label: 'text-emerald-600',
    value: 'text-emerald-700',
  },
  rose: {
    wrap: 'bg-rose-50 border-rose-200',
    label: 'text-rose-600',
    value: 'text-rose-700',
  },
  indigo: {
    wrap: 'bg-indigo-50 border-indigo-200',
    label: 'text-indigo-600',
    value: 'text-indigo-700',
  },
  amber: {
    wrap: 'bg-amber-50 border-amber-200',
    label: 'text-amber-600',
    value: 'text-amber-700',
  },
  slate: {
    wrap: 'bg-slate-50 border-slate-200',
    label: 'text-slate-600',
    value: 'text-slate-700',
  },
};

const DEFAULT_METRIC_CLASSES = METRIC_CLASS_MAP.slate;

export function getMetricClasses(color: string) {
  return METRIC_CLASS_MAP[color as SimulationMetricColor] ?? DEFAULT_METRIC_CLASSES;
}
