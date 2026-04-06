import type { CSSProperties } from 'react';

/**
 * Tokens visuales unificados para Recharts y contenedores.
 * Paleta: slate neutro + acentos semánticos (ingreso verde, gasto rojo, neto indigo).
 */

export const CHART_PALETTE = {
  series: ['#4f6ef7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'] as const,
  expense: ['#b91c1c', '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca'] as const,
  income: '#2563eb',
  incomeMuted: '#93c5fd',
  expenseBar: '#f43f5e',
  expenseMuted: '#fecdd3',
  netLine: '#6366f1',
  positive: '#059669',
  neutral: '#64748b',
  grid: '#e8eef4',
  gridMuted: '#f1f5f9',
  axis: '#64748b',
  tooltipBg: 'rgba(255,255,255,0.96)',
  tooltipBorder: '#e2e8f0',
  /** Barras: comparativa fiscal (base / imp. bruto / neto) */
  fiscalBase: '#94a3b8',
  fiscalGross: '#ef4444',
  fiscalNet: '#6366f1',
  /** Simulador: línea base vs escenario */
  simBaseline: '#cbd5e1',
  simScenario: '#f59e0b',
} as const;

export const chartMargins = {
  compact: { top: 4, right: 8, left: -12, bottom: 4 },
  default: { top: 8, right: 8, left: 0, bottom: 0 },
  withLegend: { top: 8, right: 8, left: -8, bottom: 8 },
} as const;

export const axisTickProps = {
  fontSize: 10,
  fill: CHART_PALETTE.axis,
} as const;

export const legendStyle = {
  fontSize: 11,
  paddingTop: 6,
} as const;

export const tooltipContentStyle: CSSProperties = {
  fontSize: 12,
  borderRadius: 10,
  border: `1px solid ${CHART_PALETTE.tooltipBorder}`,
  boxShadow: '0 10px 40px -12px rgba(15, 23, 42, 0.15)',
  background: CHART_PALETTE.tooltipBg,
};
