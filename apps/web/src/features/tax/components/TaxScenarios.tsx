import React, { useMemo } from 'react';
import { Landmark, CheckCircle2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatBookAmount, formatPresentedAmount } from '@/features/currency/format';
import {
  CHART_PALETTE,
  axisTickProps,
  chartMargins,
  legendStyle,
  tooltipContentStyle,
} from '@/shared/charts/chartTokens';

interface TaxScenariosProps {
  plan: any;
  taxFmt?: (id: string, copAmount: number) => string;
  taxNum?: (id: string, copAmount: number) => number;
  taxChartCurrency?: string;
  taxPresentationLoading?: boolean;
  /** True si hay palancas activas en simulación de impacto (copy de coherencia con Proyección declaración). */
  declarationSimulationActive?: boolean;
}

export function TaxScenarios({
  plan,
  taxFmt,
  taxNum,
  taxChartCurrency = 'COP',
  taxPresentationLoading,
  declarationSimulationActive,
}: TaxScenariosProps) {
  const chartRows = useMemo(() => {
    if (!plan?.scenarios?.length) return [];
    return plan.scenarios.map((s: any) => {
      const id = String(s.id ?? '');
      const baseRaw = Number(s.estimatedTaxableBase);
      const liabRaw = Number(s.estimatedTaxLiability);
      const netRaw = Number(s.estimatedNetTaxPayable);
      return {
        name: s.name,
        base: taxNum ? taxNum(`tax-scen-${id}-base`, baseRaw) : baseRaw,
        impuesto: taxNum ? taxNum(`tax-scen-${id}-liability`, liabRaw) : liabRaw,
        neto: taxNum ? taxNum(`tax-scen-${id}-net`, netRaw) : netRaw,
      };
    });
  }, [plan, taxNum]);

  const yTick = (val: number) =>
    taxChartCurrency === 'USD' ? `$${val / 1000}k` : `${(val / 1e6).toFixed(1)}M`;
  const tooltipFmt = (v: unknown) =>
    formatPresentedAmount(Number(v ?? 0), taxChartCurrency);

  if (!plan || !plan.scenarios || plan.scenarios.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 flex items-center gap-1.5 text-lg font-bold text-slate-800">
        <Landmark className="h-4 w-4 text-indigo-600" />
        Escenarios y Liquidación Sugerida
      </h2>

      {declarationSimulationActive ? (
        <p className="mb-3 rounded-lg border border-slate-200/90 bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
          Hay beneficios seleccionados en <strong>Simulación de impacto</strong> (abajo). El impuesto de esa combinación
          se ve en <strong>Proyección declaración de renta</strong>{' '}
          <a
            href="#tax-declaration-projection"
            className="font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-2"
          >
            (ir al gráfico)
          </a>
          . Las cifras de estas tarjetas son el plan del motor y no cambian al pulsar allí.
        </p>
      ) : null}

      <div className="chart-surface mb-4 rounded-2xl border border-slate-200/90 p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold tracking-tight text-slate-900">
          Comparativa de escenarios
        </h3>
        <div className="relative h-40">
          {taxPresentationLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80 text-[11px] font-medium text-slate-500 backdrop-blur-[1px]">
              Aplicando valuación…
            </div>
          ) : null}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartRows} margin={chartMargins.withLegend}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={CHART_PALETTE.gridMuted}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ ...axisTickProps, fontSize: 9 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ ...axisTickProps, fontSize: 9 }}
                tickFormatter={(val) => yTick(Number(val))}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={tooltipContentStyle}
                formatter={(value: unknown) => tooltipFmt(value)}
              />
              <Legend wrapperStyle={{ ...legendStyle, fontSize: 9, paddingTop: 2 }} />
              <Bar
                dataKey="base"
                name="Base gravable neta"
                fill={CHART_PALETTE.fiscalBase}
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
              />
              <Bar
                dataKey="impuesto"
                name="Impuesto bruto"
                fill={CHART_PALETTE.fiscalGross}
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
              />
              <Bar
                dataKey="neto"
                name="Impuesto a pagar (neto)"
                fill={CHART_PALETTE.fiscalNet}
                radius={[4, 4, 0, 0]}
                maxBarSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {plan.scenarios.map((sc: any) => {
          const sid = String(sc.id ?? '');
          const gross = Number(sc.estimatedGrossIncome);
          const ded = Number(sc.estimatedDeductions);
          const ex = Number(sc.estimatedExemptions);
          const base = Number(sc.estimatedTaxableBase);
          const fc = Number(sc.estimatedForeignCredit);
          const net = Number(sc.estimatedNetTaxPayable);

          const fmt = (lineId: string, cop: number) =>
            taxFmt ? taxFmt(lineId, cop) : formatBookAmount(cop, 'COP');

          return (
            <div
              key={sc.id}
              className={`glass-card rounded-xl p-4 shadow-sm border-2 ${sc.type === 'OPTIMIZED' ? 'border-indigo-500 relative' : 'border-slate-200'}`}
            >
              {sc.type === 'OPTIMIZED' && (
                <span className="absolute -top-2.5 right-3 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full max-w-[200px] text-center leading-tight">
                  Sujeto a validación documental
                </span>
              )}

              <h3 className="text-sm font-bold text-slate-900 mb-1">{sc.name}</h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">{sc.explanation}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Ingresos Brutos Estimados</span>
                  <span className="font-semibold text-slate-800">
                    {fmt(`tax-scen-${sid}-gross`, gross)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Deducciones Aplicadas</span>
                  <span className="font-semibold text-emerald-600">
                    -{fmt(`tax-scen-${sid}-ded`, ded)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Rentas Exentas Calculadas</span>
                  <span className="font-semibold text-emerald-600">
                    -{fmt(`tax-scen-${sid}-exempt`, ex)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold border-b border-slate-200 pb-1.5">
                  <span className="text-slate-700">Base Gravable Neta</span>
                  <span className="text-slate-900">{fmt(`tax-scen-${sid}-base`, base)}</span>
                </div>
                {fc > 0 && (
                  <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-1.5 bg-blue-50 p-1.5 rounded">
                    <span className="text-blue-800 font-semibold">Descuento Exterior</span>
                    <span className="font-bold text-blue-600">
                      -{fmt(`tax-scen-${sid}-credit`, fc)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-black pt-1">
                  <span className="text-slate-900">Impuesto a Pagar</span>
                  <span className={sc.type === 'OPTIMIZED' ? 'text-indigo-600' : 'text-slate-800'}>
                    {fmt(`tax-scen-${sid}-net`, net)}
                  </span>
                </div>
              </div>

              {sc.requirements && sc.requirements.length > 0 && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <h4 className="text-[10px] font-bold text-yellow-800 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Soportes Requeridos
                  </h4>
                  <ul className="list-disc pl-4 text-[10px] text-yellow-900 space-y-0.5">
                    {sc.requirements.map((req: string, i: number) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
