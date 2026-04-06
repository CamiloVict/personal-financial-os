import { Building, TrendingUp } from 'lucide-react';
import type { GoodDebtRow } from '../types';
import { formatPresentedAmount } from '@/features/currency/format';

interface DebtsGoodDebtPanelProps {
  goodDebts: GoodDebtRow[];
  presentedByDebtId?: Record<string, { amount: number; currency: string }>;
  presentationLoading?: boolean;
}

export function DebtsGoodDebtPanel({
  goodDebts,
  presentedByDebtId,
  presentationLoading,
}: DebtsGoodDebtPanelProps) {
  return (
    <div className="glass-card rounded-xl p-4 shadow-sm border border-emerald-100">
      <h3 className="text-sm font-bold text-emerald-800 mb-1 flex items-center gap-1.5">
        <TrendingUp className="w-4 h-4 text-emerald-600" /> Deuda Buena (Apalancamiento)
      </h3>
      <p className="text-[10px] text-emerald-700/80 mb-4 leading-relaxed">
        Esta es la deuda que usaste para adquirir activos. Si el retorno del activo (valorización +
        flujo) es mayor al costo efectivo de la deuda (tasa - escudo fiscal), te estás enriqueciendo
        con dinero del banco.
      </p>

      {goodDebts.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No tienes deudas buenas registradas.</p>
      ) : (
        <div className="space-y-3">
          {goodDebts.map((gd) => (
            <div
              key={gd.id}
              className="bg-white border border-emerald-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-2 border-b border-emerald-50/50 pb-2">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-emerald-600" /> {gd.name}
                  </h4>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5 space-y-0.5">
                    <p className="text-slate-600 normal-case font-bold text-[11px]">
                      {presentedByDebtId?.[gd.id] && !presentationLoading ? (
                        <>
                          Saldo:{' '}
                          {formatPresentedAmount(
                            presentedByDebtId[gd.id].amount,
                            presentedByDebtId[gd.id].currency,
                          )}
                        </>
                      ) : (
                        <>
                          Saldo: $
                          {Number(gd.remainingAmount).toLocaleString()}
                        </>
                      )}
                    </p>
                    {presentedByDebtId?.[gd.id] && !presentationLoading ? (
                      <p className="text-[8px] text-slate-400 font-normal normal-case">
                        Nom.: $
                        {Number(gd.remainingAmount).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                      gd.isPositiveLeverage
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {gd.isPositiveLeverage ? 'Apalancamiento Positivo' : 'Apalancamiento Negativo'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase mb-0.5">Costo Banco</p>
                  <p className="text-xs font-bold text-slate-700">
                    {Number(gd.interestRate).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p
                    className="text-[8px] text-indigo-400 font-bold uppercase mb-0.5"
                    title="Lo que te ahorras en impuestos por deducir estos intereses"
                  >
                    Escudo Fiscal
                  </p>
                  <p className="text-xs font-bold text-indigo-600">
                    -{Number(gd.taxShieldRate).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-slate-50 p-1.5 rounded-md -m-1.5">
                  <p className="text-[8px] text-slate-500 font-bold uppercase mb-0.5">Costo Efectivo</p>
                  <p className="text-xs font-black text-slate-800">
                    {Number(gd.effectiveCostOfDebt).toFixed(1)}%
                  </p>
                </div>
                <div
                  className={`${gd.isPositiveLeverage ? 'bg-emerald-50' : 'bg-rose-50'} p-1.5 rounded-md -m-1.5`}
                >
                  <p className="text-[8px] text-slate-500 font-bold uppercase mb-0.5">
                    ROI (Cash on Cash)
                  </p>
                  <p
                    className={`text-xs font-black ${gd.isPositiveLeverage ? 'text-emerald-600' : 'text-rose-600'}`}
                  >
                    {Number(gd.cashOnCashReturn).toFixed(1)}%
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
