import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { SimulationResult, SimulationYearData } from '../types';
import { getMetricClasses } from '../utils/metricStyles';
import { ConfidenceBadge } from '@/shared/ui/ConfidenceBadge';
import { formatPresentedAmount } from '@/features/currency/format';
import {
  CHART_PALETTE,
  axisTickProps,
  chartMargins,
  legendStyle,
  tooltipContentStyle,
} from '@/shared/charts/chartTokens';

interface SimulatorResultsPanelProps {
  result: SimulationResult;
  /** Serie ya presentada (barra global); si no, se usa `result.years` en COP nominal. */
  presentedYears?: SimulationYearData[];
  presentedFinalBaseline?: number;
  presentedFinalScenario?: number;
  chartCurrency?: string;
  presentationLoading?: boolean;
}

export function SimulatorResultsPanel({
  result,
  presentedYears,
  presentedFinalBaseline,
  presentedFinalScenario,
  chartCurrency = 'COP',
  presentationLoading,
}: SimulatorResultsPanelProps) {
  const years = presentedYears ?? result.years;
  const finalBase =
    presentedFinalBaseline ?? result.finalBaselineNetWorth;
  const finalScen =
    presentedFinalScenario ?? result.finalScenarioNetWorth;

  const yTick = (val: number) =>
    chartCurrency === 'USD'
      ? `$${(val / 1_000_000).toFixed(0)}M`
      : `${(val / 1e6).toFixed(1)}M`;
  const tooltipFmt = (v: unknown) =>
    formatPresentedAmount(Number(v ?? 0), chartCurrency);

  return (
    <div className="space-y-3 animate-in slide-in-from-right-8 duration-500 h-full flex flex-col">
      <div className="flex justify-end">
        <ConfidenceBadge confidence={result.confidence} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="glass-card p-2 rounded-lg border border-slate-200 shadow-sm bg-white">
          <h3 className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">Veredicto</h3>
          <p className="text-[10px] font-bold tracking-tight text-slate-800 leading-snug">{result.primaryInsight}</p>
        </div>

        <div className="glass-card p-2 rounded-lg border border-slate-200 shadow-sm bg-white">
          <h3 className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">Impacto Secundario</h3>
          <p className="text-[10px] font-medium text-slate-700 leading-snug">{result.secondaryInsight}</p>
        </div>

        <div className="glass-card p-2 rounded-lg border border-slate-200 shadow-sm bg-white">
          <h3 className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">Detalle</h3>
          <p className="text-[10px] font-medium text-slate-600 leading-snug">{result.tertiaryInsight}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {result.metrics.map((m, i) => {
          const c = getMetricClasses(m.color);
          return (
            <div key={i} className={`${c.wrap} border p-1.5 rounded-md text-center`}>
              <p className={`text-[7px] font-bold uppercase tracking-wider mb-0.5 ${c.label}`}>{m.label}</p>
              <p className={`text-sm font-black ${c.value}`}>{m.value}</p>
            </div>
          );
        })}
      </div>

      <div className="chart-surface flex flex-1 flex-col rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm">
        <h3 className="mb-0.5 text-xs font-semibold tracking-tight text-slate-900">
          Crecimiento del patrimonio neto
        </h3>
        <p className="mb-2 text-[8px] leading-relaxed text-slate-500">
          Escenario acción (ámbar) frente a línea base (gris).
        </p>

        <div className="relative min-h-[180px] flex-1">
          {presentationLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80 text-[10px] font-medium text-slate-500 backdrop-blur-[1px]">
              Aplicando valuación…
            </div>
          ) : null}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={years} margin={chartMargins.default}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={CHART_PALETTE.gridMuted}
              />
              <XAxis
                dataKey="year"
                axisLine={false}
                tickLine={false}
                tick={{ ...axisTickProps, fontSize: 8 }}
                tickFormatter={(val) => `A${val}`}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ ...axisTickProps, fontSize: 8 }}
                tickFormatter={(val) => yTick(Number(val))}
              />
              <Tooltip
                formatter={(value, name) => [
                  tooltipFmt(value),
                  String(name) === 'scenarioNetWorth' ? 'Escenario acción' : 'Línea base',
                ]}
                labelFormatter={(label) => `Año ${label}`}
                contentStyle={{ ...tooltipContentStyle, fontSize: 11 }}
              />
              <Legend wrapperStyle={{ ...legendStyle, fontSize: 9, paddingTop: 0 }} iconSize={8} />
              <Line
                type="monotone"
                dataKey="baselineNetWorth"
                name="Línea base"
                stroke={CHART_PALETTE.simBaseline}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="scenarioNetWorth"
                name="Escenario acción"
                stroke={CHART_PALETTE.simScenario}
                strokeWidth={2}
                dot={{ r: 1.5, strokeWidth: 1 }}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
          <div className="text-slate-600 font-medium">
            Final Base:{' '}
            <strong className="text-slate-900">{tooltipFmt(finalBase)}</strong>
          </div>
          <div className="text-slate-600 font-medium">
            Final Acción:{' '}
            <strong className="text-amber-600">{tooltipFmt(finalScen)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
