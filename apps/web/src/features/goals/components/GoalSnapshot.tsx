import React from 'react';
import { HelpCircle } from 'lucide-react';
import { formatBookAmount, formatPresentedAmount } from '@/features/currency/format';

interface GoalSnapshotProps {
  monthlyAmountNeeded: number;
  targetAmount: number;
  currentMonthlySavings: number;
  monthlyShortfall: number;
  isAchievable: boolean;
  currentProjectedMonths: number | null;
  monthsRemaining: number;
  bookCurrency?: string;
  presented?: {
    monthlyAmountNeeded: number;
    targetAmount: number;
    currentMonthlySavings: number;
    monthlyShortfall: number;
    currency: string;
  } | null;
  presentationLoading?: boolean;
}

export function GoalSnapshot({
  monthlyAmountNeeded,
  targetAmount,
  currentMonthlySavings,
  monthlyShortfall,
  isAchievable,
  currentProjectedMonths,
  monthsRemaining,
  bookCurrency = 'COP',
  presented,
  presentationLoading,
}: GoalSnapshotProps) {
  const useP = presented != null && !presentationLoading;
  const fmt = (n: number) =>
    useP
      ? formatPresentedAmount(n, presented!.currency)
      : formatBookAmount(n, bookCurrency);
  const needed = useP ? presented!.monthlyAmountNeeded : monthlyAmountNeeded;
  const target = useP ? presented!.targetAmount : targetAmount;
  const savings = useP ? presented!.currentMonthlySavings : currentMonthlySavings;
  const shortfall = useP ? presented!.monthlyShortfall : monthlyShortfall;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="glass-card rounded-xl p-4">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Ahorro Mensual Requerido</p>
          <p className="text-xl font-bold text-slate-800 tracking-tight">
            {presentationLoading ? '…' : fmt(needed)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {presentationLoading
              ? '…'
              : useP
                ? (
                    <>
                      Para llegar a {fmt(target)}
                      <span className="block text-[9px] mt-0.5">
                        Nom.:{' '}
                        {formatBookAmount(Number(targetAmount), bookCurrency)}
                      </span>
                    </>
                  )
                : `Para llegar a ${formatBookAmount(Number(targetAmount), bookCurrency)}`}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tu Capacidad de Ahorro Actual</p>
          <p className="text-xl font-bold text-slate-800 tracking-tight">
            {presentationLoading ? '…' : fmt(savings)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Basado en tus ingresos menos gastos fijos/variables</p>
          {useP ? (
            <p className="text-[9px] text-slate-400 mt-0.5">
              Nom.:{' '}
              {formatBookAmount(Number(currentMonthlySavings), bookCurrency)}
            </p>
          ) : null}
        </div>
        <div className={`glass-card rounded-xl p-4 border-l-4 ${isAchievable ? 'border-l-emerald-500 bg-emerald-50/10' : 'border-l-amber-500 bg-amber-50/10'}`}>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Brecha Mensual (Faltante)</p>
          <p className={`text-xl font-bold tracking-tight ${isAchievable ? 'text-emerald-600' : 'text-amber-600'}`}>
            {presentationLoading
              ? '…'
              : isAchievable
                ? fmt(0)
                : fmt(shortfall)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {isAchievable
              ? 'El modelo no muestra brecha mensual.'
              : 'Diferencia mensual que el modelo usa para armar escenarios.'}
          </p>
          {useP && !isAchievable ? (
            <p className="text-[9px] text-slate-400 mt-0.5">
              Nom.:{' '}
              {formatBookAmount(Number(monthlyShortfall), bookCurrency)}
            </p>
          ) : null}
        </div>
      </div>

      {!isAchievable &&
        currentMonthlySavings > 0 &&
        currentProjectedMonths != null &&
        currentProjectedMonths > 0 && (
        <div className="glass-card bg-blue-50 border-blue-200 p-4 rounded-xl flex items-center justify-between mb-5">
          <div>
            <h3 className="text-blue-900 font-bold text-xs mb-1 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> 
              ¿Qué pasa si no hago ningún ajuste?
            </h3>
            <p className="text-blue-800/80 text-[11px] leading-relaxed">
              Si el ahorro se mantuviera en{' '}
              {presentationLoading ? '…' : fmt(savings)}
              /mes, el modelo proyecta cubrir el faltante en{' '}
              <strong className="text-blue-900">{currentProjectedMonths} meses</strong>
              {(() => {
                const delta = currentProjectedMonths - monthsRemaining;
                if (delta > 0) {
                  return (
                    <>
                      {' '}
                      (unos <strong>{delta}</strong> meses después del plazo usado en el modelo).
                    </>
                  );
                }
                if (delta < 0) {
                  return (
                    <>
                      {' '}
                      (antes del plazo del modelo: ~{Math.abs(delta)} meses).
                    </>
                  );
                }
                return <> (alineado con el plazo del modelo).</>;
              })()}
            </p>
          </div>
        </div>
      )}
    </>
  );
}