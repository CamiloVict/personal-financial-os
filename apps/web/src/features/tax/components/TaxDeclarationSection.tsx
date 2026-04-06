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
import type { TaxDeclarationPreview } from '../api/queries';

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
}: TaxDeclarationSectionProps) {
  const rows = data.leverComparison ?? [];

  const chartData = useMemo(() => {
    const conservative = rows.find((r) => r.id === 'CONSERVATIVE');
    const optimized = rows.find((r) => r.id === 'OPTIMIZED_ACTUAL');
    if (!conservative || !optimized) return [];

    const basePair = [
      {
        name: shortChartName('CONSERVATIVE', conservative.label),
        impuesto: Number(conservative.estimatedNetTaxPayable),
        key: 'CONSERVATIVE',
      },
      {
        name: shortChartName('OPTIMIZED_ACTUAL', optimized.label),
        impuesto: Number(optimized.estimatedNetTaxPayable),
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
    return [
      basePair[0],
      {
        name: n === 1 ? '1 beneficio' : `${n} beneficios`,
        impuesto: Number(combinedPreview.estimatedNetTaxPayable),
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
  ]);

  const barColors = ['#94a3b8', '#f97316', '#4f46e5'];

  if (!data.showDeclarationModule) return null;

  const conservative = rows.find((r) => r.id === 'CONSERVATIVE');
  const optimized = rows.find((r) => r.id === 'OPTIMIZED_ACTUAL');
  const saving =
    conservative && optimized
      ? Math.max(0, Number(conservative.estimatedNetTaxPayable) - Number(optimized.estimatedNetTaxPayable))
      : 0;

  const showComboChart = selectedLeverIds.length > 0 && combinedPreview != null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-indigo-200 bg-linear-to-br from-indigo-50 to-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
          <Calculator className="w-5 h-5 text-indigo-600" />
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="bg-white/80 rounded-lg border border-slate-100 p-2.5">
            <p className="text-[9px] font-bold text-slate-500 uppercase">Ingreso anual est.</p>
            <p className="text-sm font-bold text-slate-900">
              ${Number(data.totalAnnualIncomeEstimated).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-white/80 rounded-lg border border-slate-100 p-2.5">
            <p className="text-[9px] font-bold text-slate-500 uppercase">Imp. conservador</p>
            <p className="text-sm font-bold text-rose-700">
              ${conservative ? Number(conservative.estimatedNetTaxPayable).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}
            </p>
          </div>
          <div className="bg-white/80 rounded-lg border border-slate-100 p-2.5">
            <p className="text-[9px] font-bold text-slate-500 uppercase">Imp. tu perfil</p>
            <p className="text-sm font-bold text-indigo-700">
              ${optimized ? Number(optimized.estimatedNetTaxPayable).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}
            </p>
          </div>
          <div className="bg-white/80 rounded-lg border border-emerald-100 p-2.5">
            <p className="text-[9px] font-bold text-emerald-700 uppercase">Ahorro vs conserv.</p>
            <p className="text-sm font-bold text-emerald-800">
              ${saving.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
          <p className="text-[10px] text-rose-700 mb-2">
            No se pudo cargar la vista previa de la combinación. Revisa la conexión o reintenta.
          </p>
        ) : null}
        {combinedPreviewStale ? (
          <p className="text-[10px] text-slate-500 mb-2">Actualizando cifras para la nueva combinación…</p>
        ) : null}

        <div
          className={`h-52 sm:h-56 bg-white rounded-lg border border-slate-100 p-2 ${combinedPreviewStale ? 'opacity-80' : ''}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                interval={0}
                angle={-12}
                textAnchor="end"
                height={52}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
              />
              <Tooltip
                formatter={(v) =>
                  `$${Number(v ?? 0).toLocaleString()}`
                }
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="impuesto" name="Impuesto a pagar (aprox.)" radius={[4, 4, 0, 0]} maxBarSize={56}>
                {chartData.map((entry, i) => (
                  <Cell key={entry.key} fill={barColors[Math.min(i, barColors.length - 1)]} />
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
