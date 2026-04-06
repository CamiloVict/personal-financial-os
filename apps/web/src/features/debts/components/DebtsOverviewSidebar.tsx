import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { LeverageAnalysis } from '../types';
import { leverageHealthBadgeClass, leverageHealthLabel } from '../utils';
import { formatBookAmount, formatPresentedAmount } from '@/features/currency/format';

interface DebtsOverviewSidebarProps {
  analysis: LeverageAnalysis;
  /** Montos alineados con la barra global (FX / términos reales). Si no hay, se usan los del análisis en USD nominal. */
  presentedTotals?: {
    totalDebt: number;
    goodDebtTotal: number;
    badDebtTotal: number;
    currency: string;
  } | null;
  presentationLoading?: boolean;
  /** Moneda nominal para totales del API cuando aún no hay presentación (evita mostrar COP con prefijo $). */
  fallbackBookCurrency?: string;
}

export function DebtsOverviewSidebar({
  analysis,
  presentedTotals,
  presentationLoading,
  fallbackBookCurrency = 'COP',
}: DebtsOverviewSidebarProps) {
  const {
    totalDebt,
    goodDebtTotal,
    badDebtTotal,
    weightedAverageInterestRate,
    leverageRatio,
    leverageHealthStatus,
  } = analysis;

  const usePresented = presentedTotals != null;

  const displayTotal = usePresented
    ? presentedTotals.totalDebt
    : totalDebt;
  const displayGood = usePresented
    ? presentedTotals.goodDebtTotal
    : goodDebtTotal;
  const displayBad = usePresented
    ? presentedTotals.badDebtTotal
    : badDebtTotal;
  const displayCcy = usePresented
    ? presentedTotals.currency
    : fallbackBookCurrency;

  const fmtMoney = (n: number) =>
    usePresented
      ? formatPresentedAmount(n, displayCcy)
      : formatBookAmount(n, fallbackBookCurrency);

  const pieData = [
    { name: 'Deuda Buena (Apalancamiento)', value: displayGood, color: '#10b981' },
    { name: 'Deuda Mala (Consumo)', value: displayBad, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  return (
    <div className="lg:col-span-4 space-y-4">
      <div className="glass-card rounded-xl p-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 mb-3 tracking-tight">Salud del Endeudamiento</h3>

        <div className="mb-4">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            Deuda Total
          </p>
          <p className="text-xl font-black text-slate-800 tracking-tight">
            {presentationLoading ? '…' : fmtMoney(displayTotal)}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">
              Tasa Promedio Ponderada
            </span>
            <span className="font-bold text-slate-800 text-sm">
              {weightedAverageInterestRate.toFixed(1)}% EA
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Ratio Apalancamiento</span>
            <span className="font-bold text-slate-800 text-sm">{(leverageRatio * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Estado General</span>
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${leverageHealthBadgeClass(leverageHealthStatus)}`}
            >
              {leverageHealthLabel(leverageHealthStatus)}
            </span>
          </div>
        </div>
      </div>

      {pieData.length > 0 && (
        <div className="glass-card rounded-xl p-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 mb-2 tracking-tight">Composición de la Deuda</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={40}
                  outerRadius={55}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown) =>
                    fmtMoney(Number(value ?? 0))
                  }
                />
                <Legend wrapperStyle={{ fontSize: '9px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
