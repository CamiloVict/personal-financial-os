'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Calculator, Info } from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { formatBookAmount, formatPresentedAmount } from '@/features/currency/format';
import type { TaxDeclarationPreview } from '../api/queries';
import {
  CHART_PALETTE,
  axisTickProps,
  chartMargins,
  legendStyle,
  tooltipContentStyle,
} from '@/shared/charts/chartTokens';

export type LeverRow = {
  id: string;
  label: string;
  description: string;
  estimatedGrossIncome: number;
  estimatedTaxableBase: number;
  estimatedNetTaxPayable: number;
  savingsVsConservative: number;
};

interface TaxDeclarationSectionProps {
  /** Respuesta de GET /tax/declaration-insights */
  data: {
    showDeclarationModule: boolean;
    hasEstablishedIncome: boolean;
    exceedsMassThreshold: boolean;
    totalAnnualIncomeEstimated: number;
    engineVersion: string;
    leverComparison: LeverRow[];
  };
  selectedLeverIds: string[];
  /** Datos de POST /tax/declaration-preview cuando hay palancas seleccionadas (puede ser placeholder mientras llega la nueva clave). */
  combinedPreview: TaxDeclarationPreview | null | undefined;
  combinedPreviewLoading: boolean;
  combinedPreviewError: boolean;
  /** True si el valor de combinación corresponde a una selección anterior (refetch en curso). */
  combinedPreviewStale?: boolean;
  onClearSelection: () => void;
  /** Valuación global: montos del motor (COP) presentados en COP/USD/real según barra. */
  taxFmt?: (id: string, copAmount: number) => string;
  taxNum?: (id: string, copAmount: number) => number;
  taxChartCurrency?: string;
  taxPresentationLoading?: boolean;
}

function shortChartName(id: string, label: string): string {
  if (id === 'CONSERVATIVE') return 'Sin deducciones';
  if (id === 'OPTIMIZED_ACTUAL') return 'Tu perfil';
  if (id === 'LEVER_VOLUNTARY_PENSION') return 'Solo FPV';
  if (id === 'LEVER_AFC') return 'Solo AFC';
  if (id === 'LEVER_HOUSING') return 'Solo vivienda';
  if (id === 'LEVER_PREPAID') return 'Solo prepagada';
  if (id === 'LEVER_DEPENDENTS') return 'Solo depend.';
  return label.length > 18 ? `${label.slice(0, 16)}…` : label;
}

export function TaxDeclarationSection({
  data,
  selectedLeverIds,
  combinedPreview,
  combinedPreviewLoading,
  combinedPreviewError,
  combinedPreviewStale,
  onClearSelection,
  taxFmt,
  taxNum,
  taxChartCurrency = 'COP',
  taxPresentationLoading,
}: TaxDeclarationSectionProps) {
  const rows = data.leverComparison ?? [];

  const netPresented = (leverId: string, raw: number) =>
    taxNum ? taxNum(`tax-decl-lever-${leverId}-net`, raw) : raw;

  const chartData = useMemo(() => {
    const conservative = rows.find((r) => r.id === 'CONSERVATIVE');
    const optimized = rows.find((r) => r.id === 'OPTIMIZED_ACTUAL');
    if (!conservative || !optimized) return [];

    const basePair = [
      {
        name: shortChartName('CONSERVATIVE', conservative.label),
        impuesto: netPresented('CONSERVATIVE', Number(conservative.estimatedNetTaxPayable)),
        key: 'CONSERVATIVE',
      },
      {
        name: shortChartName('OPTIMIZED_ACTUAL', optimized.label),
        impuesto: netPresented('OPTIMIZED_ACTUAL', Number(optimized.estimatedNetTaxPayable)),
        key: 'OPTIMIZED_ACTUAL',
      },
    ];

    if (selectedLeverIds.length === 0) return basePair;

    if (combinedPreviewLoading && combinedPreview == null) {
      return basePair;
    }

    if (combinedPreviewError && combinedPreview == null) {
      return basePair;
    }

    if (combinedPreview == null) {
      return basePair;
    }

    const n = selectedLeverIds.length;
    const comboRaw = Number(combinedPreview.estimatedNetTaxPayable);
    return [
      basePair[0],
      {
        name: n === 1 ? '1 beneficio' : `${n} beneficios`,
        impuesto: taxNum ? taxNum('tax-combo-net', comboRaw) : comboRaw,
        key: 'COMBINED_PREVIEW',
      },
      basePair[1],
    ];
  }, [
    rows,
    selectedLeverIds.length,
    combinedPreview,
    combinedPreviewLoading,
    combinedPreviewError,
    taxNum,
  ]);

  const barFill = (key: string) => {
    if (key === 'CONSERVATIVE') return CHART_PALETTE.fiscalBase;
    if (key === 'COMBINED_PREVIEW') return CHART_PALETTE.simScenario;
    return CHART_PALETTE.fiscalNet;
  };

  if (!data.showDeclarationModule) return null;

  const conservative = rows.find((r) => r.id === 'CONSERVATIVE');
  const optimized = rows.find((r) => r.id === 'OPTIMIZED_ACTUAL');
  const consRaw = conservative ? Number(conservative.estimatedNetTaxPayable) : 0;
  const optRaw = optimized ? Number(optimized.estimatedNetTaxPayable) : 0;
  const comboRaw =
    combinedPreview != null ? Number(combinedPreview.estimatedNetTaxPayable) : null;

  const consP = taxNum ? taxNum('tax-decl-lever-CONSERVATIVE-net', consRaw) : consRaw;
  const optP = taxNum ? taxNum('tax-decl-lever-OPTIMIZED_ACTUAL-net', optRaw) : optRaw;
  const comboP =
    comboRaw != null && taxNum ? taxNum('tax-combo-net', comboRaw) : comboRaw;

  const saving =
    selectedLeverIds.length > 0 && comboP != null
      ? Math.max(0, consP - comboP)
      : conservative && optimized
        ? Math.max(0, consP - optP)
        : 0;

  const showComboChart = selectedLeverIds.length > 0 && combinedPreview != null;

  const fmtIncome = taxFmt
    ? taxFmt('tax-decl-total-income', Number(data.totalAnnualIncomeEstimated))
    : formatBookAmount(Number(data.totalAnnualIncomeEstimated), 'COP');
  const fmtCons = conservative
    ? taxFmt
      ? taxFmt('tax-decl-lever-CONSERVATIVE-net', consRaw)
      : formatBookAmount(consRaw, 'COP')
    : '—';
  const fmtOpt = optimized
    ? taxFmt
      ? taxFmt('tax-decl-lever-OPTIMIZED_ACTUAL-net', optRaw)
      : formatBookAmount(optRaw, 'COP')
    : '—';
  const fmtCombo =
    showComboChart && combinedPreview
      ? taxFmt
        ? taxFmt('tax-combo-net', Number(combinedPreview.estimatedNetTaxPayable))
        : formatBookAmount(
            Number(combinedPreview.estimatedNetTaxPayable),
            'COP',
          )
      : null;

  const yTick = (val: number) =>
    taxChartCurrency === 'USD' ? `$${val / 1000}k` : `${(val / 1e6).toFixed(1)}M`;
  const tooltipFmt = (v: unknown) =>
    formatPresentedAmount(Number(v ?? 0), taxChartCurrency);

  return (
    <div className="space-y-4">
      <div
        id="tax-declaration-projection"
        className="scroll-mt-24 rounded-xl border border-indigo-200 bg-linear-to-br from-indigo-50 to-white p-4 shadow-sm"
      >
        <h2 className="mb-2 flex items-center gap-2 text-base font-bold text-slate-900">
          <Calculator className="h-5 w-5 text-indigo-600" />
          Proyección declaración de renta (aprox.)
        </h2>
        <div className="flex gap-2 text-[11px] text-slate-600 leading-relaxed mb-3">
          <Info className="w-4 h-4 shrink-0 text-indigo-500 mt-0.5" />
          <p>
            {data.totalAnnualIncomeEstimated <= 0 ? (
              <>
                Aún no hay <strong>ingresos de trabajo</strong> en Cashflow: los valores quedan en 0.{' '}
                <Link href="/cashflow" className="font-semibold text-indigo-700 hover:underline">
                  Añade un ingreso
                </Link>{' '}
                para ver la proyección con tus datos.
              </>
            ) : data.hasEstablishedIncome ? (
              <>
                Tienes al menos un ingreso con <strong>inicio hace más de un año</strong>; conviene revisar el impuesto
                estimado y las palancas (FPV, AFC, etc.).
              </>
            ) : data.exceedsMassThreshold ? (
              <>
                Por el <strong>monto anual estimado</strong> conviene revisar esta proyección orientativa (no sustituye
                asesoría de un contador).
              </>
            ) : (
              <>
                Proyección según tus ingresos en Cashflow y el perfil guardado. Ajusta beneficios en{' '}
                <strong>Perfil y Beneficios</strong> y vuelve a guardar para recalcular.
              </>
            )}{' '}
            Motor <span className="font-mono text-[10px]">{data.engineVersion}</span>, UVT referencia 2026.
          </p>
        </div>

        <div
          className={`grid gap-2 mb-4 grid-cols-2 ${showComboChart ? 'sm:grid-cols-3 lg:grid-cols-5' : 'sm:grid-cols-4'}`}
        >
          <div className="bg-white/80 rounded-lg border border-slate-100 p-2.5">
            <p className="text-[9px] font-bold text-slate-500 uppercase">Ingreso anual est.</p>
            <p className="text-sm font-bold text-slate-900">{fmtIncome}</p>
          </div>
          <div className="bg-white/80 rounded-lg border border-slate-100 p-2.5">
            <p className="text-[9px] font-bold text-slate-500 uppercase">Imp. conservador</p>
            <p className="text-sm font-bold text-rose-700">{fmtCons}</p>
          </div>
          {fmtCombo != null ? (
            <div className="bg-white/80 rounded-lg border border-amber-100 p-2.5">
              <p className="text-[9px] font-bold text-amber-800 uppercase">Imp. combinación</p>
              <p className="text-sm font-bold text-amber-900">{fmtCombo}</p>
            </div>
          ) : null}
          <div className="bg-white/80 rounded-lg border border-slate-100 p-2.5">
            <p className="text-[9px] font-bold text-slate-500 uppercase">Imp. tu perfil</p>
            <p className="text-sm font-bold text-indigo-700">{fmtOpt}</p>
          </div>
          <div className="bg-white/80 rounded-lg border border-emerald-100 p-2.5">
            <p className="text-[9px] font-bold text-emerald-700 uppercase">
              {selectedLeverIds.length > 0 ? 'Ahorro vs conserv. (comb.)' : 'Ahorro vs conserv.'}
            </p>
            <p className="text-sm font-bold text-emerald-800">
              {formatPresentedAmount(saving, taxChartCurrency)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h3 className="text-sm font-bold text-slate-800">
            {showComboChart
              ? 'Comparación: conservador · combinación elegida · tu perfil'
              : 'Comparación: conservador · tu perfil combinado'}
          </h3>
          {selectedLeverIds.length > 0 ? (
            <button
              type="button"
              onClick={onClearSelection}
              className="text-[11px] font-semibold text-indigo-700 hover:underline"
            >
              Quitar selección
            </button>
          ) : null}
        </div>

        {selectedLeverIds.length > 0 && combinedPreviewLoading && combinedPreview == null ? (
          <p className="text-[10px] text-amber-800 mb-2">Calculando la combinación seleccionada…</p>
        ) : null}
        {selectedLeverIds.length > 0 && combinedPreviewError && combinedPreview == null ? (
          <div className="mb-2">
            <ErrorState
              variant="compact"
              title="No se pudo cargar la combinación"
              description="Revisa la conexión o reintenta. El gráfico muestra conservador y tu perfil hasta que el servidor responda."
              className="border-rose-200/80 bg-rose-50/40 py-3"
            />
          </div>
        ) : null}
        {combinedPreviewStale ? (
          <p className="text-[10px] text-slate-500 mb-2">Actualizando cifras para la nueva combinación…</p>
        ) : null}

        <div
          className={`relative h-52 sm:h-56 bg-white rounded-lg border border-slate-100 p-2 ${combinedPreviewStale ? 'opacity-80' : ''}`}
        >
          {taxPresentationLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 text-[11px] font-medium text-slate-500">
              Aplicando valuación…
            </div>
          ) : null}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={chartMargins.withLegend}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={CHART_PALETTE.gridMuted}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={axisTickProps}
                interval={0}
                angle={-12}
                textAnchor="end"
                height={52}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={axisTickProps}
                tickFormatter={(v) => yTick(Number(v))}
              />
              <Tooltip
                formatter={(v: unknown) => tooltipFmt(v)}
                contentStyle={tooltipContentStyle}
              />
              <Legend wrapperStyle={{ ...legendStyle, fontSize: 10 }} />
              <Bar dataKey="impuesto" name="Impuesto a pagar (aprox.)" radius={[4, 4, 0, 0]} maxBarSize={56}>
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={barFill(entry.key)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-[10px] text-slate-500 mt-2">
          En <strong>simulación de impacto</strong> puedes activar varias tarjetas a la vez: el gráfico muestra el impuesto
          estimado <em>si</em> esa combinación de beneficios aplicara según el motor (topes modelados), junto al escenario
          conservador y a tu perfil guardado.
        </p>
      </div>
    </div>
  );
}
