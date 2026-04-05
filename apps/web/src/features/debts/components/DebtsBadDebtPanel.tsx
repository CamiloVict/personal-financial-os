import { CreditCard, TrendingDown } from 'lucide-react';
import type { BadDebtRow } from '../types';

interface DebtsBadDebtPanelProps {
  badDebts: BadDebtRow[];
}

export function DebtsBadDebtPanel({ badDebts }: DebtsBadDebtPanelProps) {
  return (
    <div className="glass-card rounded-xl p-4 shadow-sm border border-rose-100">
      <h3 className="text-sm font-bold text-rose-800 mb-1 flex items-center gap-1.5">
        <TrendingDown className="w-4 h-4 text-rose-600" /> Deuda Mala (Consumo)
      </h3>
      <p className="text-[10px] text-rose-700/80 mb-4 leading-relaxed">
        Deudas que no tienen un activo de respaldo o fueron usadas para consumo. Este capital no
        produce retornos y genera gastos por intereses puros.
      </p>

      {badDebts.length === 0 ? (
        <p className="text-xs text-slate-400 italic">¡Felicidades! No tienes deudas de consumo.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {badDebts.map((bd) => (
            <div key={bd.id} className="bg-white border border-rose-100 rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <CreditCard className="w-3.5 h-3.5 text-rose-500" />
                <h4 className="font-bold text-slate-800 text-xs">{bd.name}</h4>
              </div>
              <div className="flex justify-between items-end mt-3 pt-2 border-t border-rose-50/50">
                <div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase mb-0.5">Saldo Pendiente</p>
                  <p className="text-base font-bold text-slate-800">
                    ${Number(bd.remainingAmount).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-rose-400 font-bold uppercase mb-0.5">Tasa Interés</p>
                  <p className="text-xs font-black text-rose-600">
                    {Number(bd.interestRate).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
