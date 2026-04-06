import React from 'react';
import { Trash2, CheckCircle2, AlertCircle, Settings, Activity, Pencil } from 'lucide-react';

interface TypeListProps {
  types: any[];
  isLoading: boolean;
  editingId?: string | null;
  onEditType?: (type: any) => void;
  onDeleteType: (id: string) => void;
  isDeleting: boolean;
}

export function TypeList({
  types,
  isLoading,
  editingId,
  onEditType,
  onDeleteType,
  isDeleting,
}: TypeListProps) {
  return (
    <div className="lg:col-span-7">
      <div className="flex justify-between items-center mb-6 px-1">
        <h3 className="text-base font-bold text-slate-800 tracking-tight">Tus categorías</h3>
        {isLoading && <Activity className="w-4 h-4 text-blue-500 animate-spin" />}
      </div>

      <div className="grid gap-4">
        {types.map(type => (
          <div
            key={type.id}
            className={`glass-card rounded-2xl p-5 group relative overflow-hidden ${editingId === type.id ? 'ring-2 ring-blue-400/60' : ''}`}
          >
            <div className="hover-reveal-accent absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl transition-opacity" />
            
            <div className="flex justify-between items-start mb-4 gap-2">
              <h4 className="text-base font-bold text-slate-900 tracking-tight">{type.name}</h4>
              <div className="flex items-center gap-0.5 shrink-0">
                {onEditType ? (
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => onEditType(type)}
                    className="touch-manipulation min-h-10 min-w-10 flex items-center justify-center text-slate-400 active:text-blue-700 active:bg-blue-500/15 p-1.5 rounded-lg [@media(hover:hover)_and_(pointer:fine)]:hover:text-blue-700 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    if (
                      confirm(
                        '¿Eliminar esta categoría? Solo es posible si ninguna posición de patrimonio la usa.',
                      )
                    ) {
                      onDeleteType(type.id);
                    }
                  }}
                  className="touch-manipulation min-h-10 min-w-10 flex items-center justify-center text-slate-400 active:text-rose-600 active:bg-rose-500/15 p-1.5 rounded-lg [@media(hover:hover)_and_(pointer:fine)]:hover:text-rose-600 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              {type.countsInFinancialPortfolio === false && (
                <span className="bg-slate-500/10 text-slate-700 px-2 py-1 rounded-full border border-slate-500/20 flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm">
                  Patrimonio de uso — fuera de portafolio financiero
                </span>
              )}
              {type.generatesCashflow && (
                <span className="bg-blue-500/10 text-blue-700 px-2 py-1 rounded-full border border-blue-500/20 flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm">
                  <CheckCircle2 className="w-3 h-3" /> Flujo
                </span>
              )}
              {type.allowsProfitDistribution && (
                <span className="bg-emerald-500/10 text-emerald-700 px-2 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm">
                  <CheckCircle2 className="w-3 h-3" /> Utilidad ({type.expectedFrequency})
                </span>
              )}
              {type.allowsExtraContributions && (
                <span className="bg-amber-500/10 text-amber-700 px-2 py-1 rounded-full border border-amber-500/20 flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm">
                  <CheckCircle2 className="w-3 h-3" /> Aportes Extra
                </span>
              )}
              {type.allowsLinkedDebt && (
                <span className="bg-fuchsia-500/10 text-fuchsia-700 px-2 py-1 rounded-full border border-fuchsia-500/20 flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm">
                  <AlertCircle className="w-3 h-3" /> Deuda Asociada
                </span>
              )}
              {type.hasManualValuation && (
                <span className="bg-indigo-500/10 text-indigo-700 px-2 py-1 rounded-full border border-indigo-500/20 flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm">
                  <Settings className="w-3 h-3" /> Manual
                </span>
              )}
            </div>
          </div>
        ))}

        {types.length === 0 && !isLoading && (
          <div className="glass-card border-dashed border-slate-300/50 p-12 rounded-2xl text-center text-slate-400 flex flex-col items-center gap-3">
            <Settings className="w-10 h-10 text-slate-300/80" />
            <p className="font-semibold text-sm text-slate-500">Aún no tienes categorías de patrimonio.</p>
            <p className="text-xs max-w-xs leading-relaxed">
              Creá la primera con el formulario: activo financiero vs. bien de uso, flujos y deuda asociada a la posición (los pasivos siguen en Deudas).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}