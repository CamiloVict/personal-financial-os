import React from 'react';
import { HelpCircle } from 'lucide-react';

interface GoalSnapshotProps {
  monthlyAmountNeeded: number;
  targetAmount: number;
  currentMonthlySavings: number;
  monthlyShortfall: number;
  isAchievable: boolean;
  currentProjectedMonths: number | null;
  monthsRemaining: number;
}

export function GoalSnapshot({
  monthlyAmountNeeded,
  targetAmount,
  currentMonthlySavings,
  monthlyShortfall,
  isAchievable,
  currentProjectedMonths,
  monthsRemaining
}: GoalSnapshotProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="glass-card rounded-xl p-4">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Ahorro Mensual Requerido</p>
          <p className="text-xl font-bold text-slate-800 tracking-tight">${Number(monthlyAmountNeeded).toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-1">Para llegar a ${Number(targetAmount).toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tu Capacidad de Ahorro Actual</p>
          <p className="text-xl font-bold text-slate-800 tracking-tight">${Number(currentMonthlySavings).toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-1">Basado en tus ingresos menos gastos fijos/variables</p>
        </div>
        <div className={`glass-card rounded-xl p-4 border-l-4 ${isAchievable ? 'border-l-emerald-500 bg-emerald-50/10' : 'border-l-amber-500 bg-amber-50/10'}`}>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Brecha Mensual (Faltante)</p>
          <p className={`text-xl font-bold tracking-tight ${isAchievable ? 'text-emerald-600' : 'text-amber-600'}`}>
            ${isAchievable ? '0' : Number(monthlyShortfall).toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {isAchievable ? 'Estás en camino de lograrlo.' : 'Lo que necesitas ajustar cada mes.'}
          </p>
        </div>
      </div>

      {!isAchievable && currentMonthlySavings > 0 && currentProjectedMonths && (
        <div className="glass-card bg-blue-50 border-blue-200 p-4 rounded-xl flex items-center justify-between mb-5">
          <div>
            <h3 className="text-blue-900 font-bold text-xs mb-1 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> 
              ¿Qué pasa si no hago ningún ajuste?
            </h3>
            <p className="text-blue-800/80 text-[11px] leading-relaxed">
              Al ritmo actual de ${Number(currentMonthlySavings).toLocaleString()}/mes, alcanzarás la meta en <strong className="text-blue-900">{currentProjectedMonths} meses</strong> 
              (eso es {currentProjectedMonths - monthsRemaining} meses más tarde de tu objetivo original).
            </p>
          </div>
        </div>
      )}
    </>
  );
}