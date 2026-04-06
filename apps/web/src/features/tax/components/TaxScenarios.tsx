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

interface TaxScenariosProps {
  plan: any;
  taxFmt?: (id: string, copAmount: number) => string;
  taxNum?: (id: string, copAmount: number) => number;
  taxChartCurrency?: string;
  taxPresentationLoading?: boolean;
}

export function TaxScenarios({
  plan,
  taxFmt,
  taxNum,
  taxChartCurrency = 'COP',
  taxPresentationLoading,
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
      <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-1.5">
        <Landmark className="w-4 h-4 text-indigo-600" />
        Escenarios y Liquidación Sugerida
      </h2>

      <div className="glass-card rounded-xl shadow-sm p-4 mb-4">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Comparativa de Escenarios Visual</h3>
        <div className="relative h-40">
          {taxPresentationLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 text-[11px] font-medium text-slate-500">
              Aplicando valuación…
            </div>
          ) : null}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartRows}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 9 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 9 }}
                tickFormatter={(val) => yTick(Number(val))}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                formatter={(value: any) => tooltipFmt(value)}
              />
              <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '2px' }} />
              <Bar
                dataKey="base"
                name="Base Gravable Neta"
                fill="#94a3b8"
                radius={[2, 2, 0, 0]}
                maxBarSize={20}
              />
              <Bar
                dataKey="impuesto"
                name="Impuesto Bruto"
                fill="#ef4444"
                radius={[2, 2, 0, 0]}
                maxBarSize={20}
              />
              <Bar
                dataKey="neto"
                name="Impuesto a Pagar (Neto)"
                fill="#6366f1"
                radius={[2, 2, 0, 0]}
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
