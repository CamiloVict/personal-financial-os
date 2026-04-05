'use client';
import React from 'react';
import { Scale, TrendingUp, TrendingDown, ShieldAlert, Activity, CreditCard, Building } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { useGlobalStore } from '@/shared/store/global';
import { useLeverageAnalysis } from '@/features/debts/api/queries';

export default function DebtsPage() {
  const { currentUserId } = useGlobalStore();
  const { data: analysis, isLoading } = useLeverageAnalysis(currentUserId);

  if (isLoading) {
    return <div className="flex justify-center items-center py-20"><Activity className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  if (!analysis) return null;

  const { 
    totalDebt, badDebtTotal, goodDebtTotal, 
    badDebts, goodDebts, 
    weightedAverageInterestRate, leverageRatio, leverageHealthStatus 
  } = analysis;

  const getHealthColor = (status: string) => {
    switch(status) {
      case 'EXCELLENT': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'GOOD': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'WARNING': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'CRITICAL': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getHealthText = (status: string) => {
    switch(status) {
      case 'EXCELLENT': return 'Excelente';
      case 'GOOD': return 'Saludable';
      case 'WARNING': return 'Precaución';
      case 'CRITICAL': return 'Crítico';
      default: return 'Desconocido';
    }
  };

  const pieData = [
    { name: 'Deuda Buena (Apalancamiento)', value: goodDebtTotal, color: '#10b981' },
    { name: 'Deuda Mala (Consumo)', value: badDebtTotal, color: '#ef4444' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <header className="flex justify-between items-end border-b border-slate-200/50 pb-3 mb-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-1 bg-indigo-100 rounded-md">
              <Scale className="w-4 h-4 text-indigo-600" />
            </div>
            Deuda Inteligente y Apalancamiento
          </h1>
          <p className="text-slate-500 mt-1 text-[11px] leading-relaxed max-w-3xl">
            Separa la Deuda Mala (que empobrece) de la Deuda Buena (que apalanca activos). Monitorea tu ROI real ("Cash-on-Cash") y tu salud de endeudamiento.
          </p>
        </div>
      </header>

      {totalDebt === 0 ? (
        <div className="glass-card border-dashed border-slate-300 p-8 rounded-xl text-center text-slate-500 flex flex-col items-center gap-2">
          <Scale className="w-8 h-8 text-slate-300" />
          <div>
            <p className="font-bold text-sm text-slate-700">Libre de Deudas</p>
            <p className="text-[10px] mt-1">Actualmente no tienes ninguna deuda registrada en el sistema.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* OVERVIEW PANEL */}
          <div className="lg:col-span-4 space-y-4">
            <div className="glass-card rounded-xl p-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 mb-3 tracking-tight">Salud del Endeudamiento</h3>
              
              <div className="mb-4">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Deuda Total</p>
                <p className="text-xl font-black text-slate-800 tracking-tight">${totalDebt.toLocaleString()}</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Tasa Promedio Ponderada</span>
                  <span className="font-bold text-slate-800 text-sm">{weightedAverageInterestRate.toFixed(1)}% EA</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Ratio Apalancamiento</span>
                  <span className="font-bold text-slate-800 text-sm">{(leverageRatio * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Estado General</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getHealthColor(leverageHealthStatus)}`}>
                    {getHealthText(leverageHealthStatus)}
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
                      <Pie data={pieData} innerRadius={40} outerRadius={55} paddingAngle={5} dataKey="value" nameKey="name">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
                      <Legend wrapperStyle={{fontSize: '9px'}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* DETAIL PANELS */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* GOOD DEBT */}
            <div className="glass-card rounded-xl p-4 shadow-sm border border-emerald-100">
              <h3 className="text-sm font-bold text-emerald-800 mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Deuda Buena (Apalancamiento)
              </h3>
              <p className="text-[10px] text-emerald-700/80 mb-4 leading-relaxed">
                Esta es la deuda que usaste para adquirir activos. Si el retorno del activo (valorización + flujo) es mayor al costo efectivo de la deuda (tasa - escudo fiscal), te estás enriqueciendo con dinero del banco.
              </p>

              {goodDebts.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No tienes deudas buenas registradas.</p>
              ) : (
                <div className="space-y-3">
                  {goodDebts.map((gd: any) => (
                    <div key={gd.id} className="bg-white border border-emerald-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2 border-b border-emerald-50/50 pb-2">
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-emerald-600" /> {gd.name}
                          </h4>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Saldo: ${Number(gd.remainingAmount).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${gd.isPositiveLeverage ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {gd.isPositiveLeverage ? 'Apalancamiento Positivo' : 'Apalancamiento Negativo'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <p className="text-[8px] text-slate-400 font-bold uppercase mb-0.5">Costo Banco</p>
                          <p className="text-xs font-bold text-slate-700">{Number(gd.interestRate).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-indigo-400 font-bold uppercase mb-0.5" title="Lo que te ahorras en impuestos por deducir estos intereses">Escudo Fiscal</p>
                          <p className="text-xs font-bold text-indigo-600">-{Number(gd.taxShieldRate).toFixed(1)}%</p>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-md -m-1.5">
                          <p className="text-[8px] text-slate-500 font-bold uppercase mb-0.5">Costo Efectivo</p>
                          <p className="text-xs font-black text-slate-800">{Number(gd.effectiveCostOfDebt).toFixed(1)}%</p>
                        </div>
                        <div className={`${gd.isPositiveLeverage ? 'bg-emerald-50' : 'bg-rose-50'} p-1.5 rounded-md -m-1.5`}>
                          <p className="text-[8px] text-slate-500 font-bold uppercase mb-0.5">ROI (Cash on Cash)</p>
                          <p className={`text-xs font-black ${gd.isPositiveLeverage ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {Number(gd.cashOnCashReturn).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BAD DEBT */}
            <div className="glass-card rounded-xl p-4 shadow-sm border border-rose-100">
              <h3 className="text-sm font-bold text-rose-800 mb-1 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-rose-600" /> Deuda Mala (Consumo)
              </h3>
              <p className="text-[10px] text-rose-700/80 mb-4 leading-relaxed">
                Deudas que no tienen un activo de respaldo o fueron usadas para consumo. Este capital no produce retornos y genera gastos por intereses puros.
              </p>

              {badDebts.length === 0 ? (
                <p className="text-xs text-slate-400 italic">¡Felicidades! No tienes deudas de consumo.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {badDebts.map((bd: any) => (
                    <div key={bd.id} className="bg-white border border-rose-100 rounded-lg p-3 shadow-sm">
                      <div className="flex items-center gap-1.5 mb-2">
                        <CreditCard className="w-3.5 h-3.5 text-rose-500" />
                        <h4 className="font-bold text-slate-800 text-xs">{bd.name}</h4>
                      </div>
                      <div className="flex justify-between items-end mt-3 pt-2 border-t border-rose-50/50">
                        <div>
                          <p className="text-[8px] text-slate-400 font-bold uppercase mb-0.5">Saldo Pendiente</p>
                          <p className="text-base font-bold text-slate-800">${Number(bd.remainingAmount).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] text-rose-400 font-bold uppercase mb-0.5">Tasa Interés</p>
                          <p className="text-xs font-black text-rose-600">{Number(bd.interestRate).toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}