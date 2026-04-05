import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SimulationResult } from '../types';
import { getMetricClasses } from '../utils/metricStyles';

interface SimulatorResultsPanelProps {
  result: SimulationResult;
}

export function SimulatorResultsPanel({ result }: SimulatorResultsPanelProps) {
  return (
    <div className="space-y-3 animate-in slide-in-from-right-8 duration-500 h-full flex flex-col">
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

      <div className="glass-card p-3 rounded-lg shadow-sm flex-1 flex flex-col bg-white">
        <h3 className="text-xs font-bold text-slate-800 mb-0.5">Crecimiento del Patrimonio Neto</h3>
        <p className="text-[8px] text-slate-500 mb-2">
          Línea Amarilla (Escenario Acción) vs Línea Gris (Línea Base / Inacción).
        </p>

        <div className="flex-1 min-h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={result.years} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="year"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 8 }}
                tickFormatter={(val) => `A${val}`}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 8 }}
                tickFormatter={(val) => `$${(val / 1000000).toFixed(0)}M`}
              />
              <Tooltip
                formatter={(value, name) => [
                  `$${Number(value ?? 0).toLocaleString()}`,
                  String(name) === 'scenarioNetWorth' ? 'Escenario Acción' : 'Línea Base',
                ]}
                labelFormatter={(label) => `Año ${label}`}
                contentStyle={{
                  borderRadius: '6px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '9px',
                  padding: '4px 8px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '0px' }} iconSize={8} />
              <Line type="monotone" dataKey="baselineNetWorth" name="Línea Base" stroke="#cbd5e1" strokeWidth={2} dot={false} />
              <Line
                type="monotone"
                dataKey="scenarioNetWorth"
                name="Escenario Acción"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 1.5, strokeWidth: 1 }}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
          <div className="text-slate-600 font-medium">
            Final Base: <strong className="text-slate-900">${result.finalBaselineNetWorth.toLocaleString()}</strong>
          </div>
          <div className="text-slate-600 font-medium">
            Final Acción: <strong className="text-amber-600">${result.finalScenarioNetWorth.toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
