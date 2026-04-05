'use client';
import React, { useState } from 'react';
import { Network, Activity, ArrowRight, Zap, Target, Landmark, CreditCard, ShieldAlert } from 'lucide-react';
import { useGlobalStore } from '@/shared/store/global';
import { useGenerateAllocatorPlan } from '@/features/allocator/api/queries';

export default function AllocatorPage() {
  const { currentUserId } = useGlobalStore();
  const generatePlanMutation = useGenerateAllocatorPlan(currentUserId);
  
  const [availableCapital, setAvailableCapital] = useState<string>('');
  const [plan, setPlan] = useState<any>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!availableCapital || Number(availableCapital) <= 0) return;
    
    generatePlanMutation.mutate(Number(availableCapital), {
      onSuccess: (data) => setPlan(data)
    });
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'TAX_OPTIMIZATION': return <Landmark className="w-4 h-4 text-indigo-600" />;
      case 'DEBT_REDUCTION': return <CreditCard className="w-4 h-4 text-rose-600" />;
      case 'GOAL_ACCELERATION': return <Target className="w-4 h-4 text-emerald-600" />;
      default: return <Zap className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStyleForType = (type: string) => {
    switch (type) {
      case 'TAX_OPTIMIZATION': return 'border-indigo-200 bg-indigo-50/30';
      case 'DEBT_REDUCTION': return 'border-rose-200 bg-rose-50/30';
      case 'GOAL_ACCELERATION': return 'border-emerald-200 bg-emerald-50/30';
      default: return 'border-blue-200 bg-blue-50/30';
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <header className="flex justify-between items-end border-b border-slate-200/50 pb-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-1 bg-fuchsia-100 rounded-md">
              <Network className="w-4 h-4 text-fuchsia-600" />
            </div>
            Capital Allocator (IA)
          </h1>
          <p className="text-slate-500 mt-1 text-[11px] leading-relaxed max-w-3xl">
            El motor inteligente que cruza tus impuestos, deudas y metas. 
            Dinos cuánto dinero extra tienes para invertir este mes y te diremos exactamente dónde ponerlo para maximizar tu retorno garantizado.
          </p>
        </div>
      </header>

      <div className="glass-card max-w-2xl mx-auto rounded-xl p-4 md:p-5 shadow-sm">
        <div className="text-center mb-4">
          <h2 className="text-sm font-bold text-slate-800 mb-1">¿Cuánto capital disponible tienes?</h2>
          <p className="text-[10px] text-slate-500">Capital libre después de tus gastos fijos y variables.</p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-3">
          <div className="relative max-w-xs mx-auto">
            <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">$</span>
            <input 
              type="number" 
              required 
              value={availableCapital} 
              onChange={e => setAvailableCapital(e.target.value)} 
              className="glass-input w-full p-2 pl-7 rounded-lg text-sm font-bold text-slate-800 shadow-sm text-center" 
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-center pt-1">
            <button 
              type="submit" 
              disabled={generatePlanMutation.isPending}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-sm text-xs"
            >
              {generatePlanMutation.isPending ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {generatePlanMutation.isPending ? 'Procesando cruce...' : 'Generar Plan'}
            </button>
          </div>
        </form>
      </div>

      {plan && (
        <div className="mt-6 animate-in slide-in-from-bottom-8 duration-500">
          <h2 className="text-sm font-bold text-slate-800 tracking-tight mb-3 flex items-center gap-1.5">
            Ruta de Asignación Óptima
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="glass-card rounded-lg p-3 bg-slate-50 border-slate-200">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Capital Original</p>
              <p className="text-base font-bold text-slate-800">${Number(plan.availableCapital).toLocaleString()}</p>
            </div>
            <div className="glass-card rounded-lg p-3 bg-emerald-50/50 border-emerald-100">
              <p className="text-[9px] font-bold text-emerald-600/80 uppercase tracking-wider mb-0.5">Capital Asignado</p>
              <p className="text-base font-bold text-emerald-700">${(Number(plan.availableCapital) - Number(plan.unallocatedCapital)).toLocaleString()}</p>
            </div>
            <div className="glass-card rounded-lg p-3 bg-amber-50/50 border-amber-100">
              <p className="text-[9px] font-bold text-amber-600/80 uppercase tracking-wider mb-0.5">Sobrante</p>
              <p className="text-base font-bold text-amber-700">${Number(plan.unallocatedCapital).toLocaleString()}</p>
            </div>
          </div>

          {plan.recommendations.length === 0 ? (
            <div className="glass-card border-dashed border-slate-300 p-8 rounded-lg text-center text-slate-500 flex flex-col items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-slate-300" />
              <p className="font-semibold text-sm">No encontramos estrategias de alto retorno garantizado.</p>
              <p className="text-[10px] max-w-xs leading-relaxed">
                Revisa que tengas tu Perfil Fiscal actualizado, metas creadas o deudas registradas.
              </p>
            </div>
          ) : (
            <div className="space-y-3 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {plan.recommendations.map((rec: any, index: number) => (
                <div key={rec.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-slate-100 text-slate-500 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <span className="text-[10px] font-bold">{index + 1}</span>
                  </div>
                  
                  <div className={`glass-card w-[calc(100%-2.5rem)] md:w-[calc(50%-2rem)] p-3.5 rounded-xl shadow-sm border ${getStyleForType(rec.type)} transition-all hover:shadow-md`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-1.5">
                        {getIconForType(rec.type)}
                        <h3 className="font-bold text-slate-900 text-xs">{rec.title}</h3>
                      </div>
                      <span className="bg-white text-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm border border-slate-100">
                        Puntaje: {rec.priorityScore}
                      </span>
                    </div>
                    
                    <p className="text-[10px] text-slate-600 mb-3 leading-relaxed">
                      {rec.description}
                    </p>

                    <div className="bg-white/60 p-2 rounded-md flex justify-between items-center border border-white/40">
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Sugerido</p>
                        <p className="font-black text-slate-800 text-sm">${Number(rec.suggestedAmount).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Impacto / Retorno</p>
                        {rec.expectedReturnAmount > 0 ? (
                          <p className="font-bold text-emerald-600 text-xs">+${Number(rec.expectedReturnAmount).toLocaleString()} <span className="text-[9px]">({rec.returnPercentage}%)</span></p>
                        ) : (
                          <p className="font-bold text-blue-600 text-xs flex items-center gap-1 justify-end">Acelera Meta <ArrowRight className="w-3 h-3" /></p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}