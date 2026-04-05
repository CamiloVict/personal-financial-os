import React from 'react';
import { Banknote, TrendingUp, TrendingDown, CheckCircle2, Trash2, Activity } from 'lucide-react';

interface CashflowListProps {
  streams: any[];
  isLoading: boolean;
  onSelectStream: (stream: any) => void;
  onDeleteStream: (id: string) => void;
}

export function CashflowList({ streams, isLoading, onSelectStream, onDeleteStream }: CashflowListProps) {
  return (
    <div className="lg:col-span-8">
      <div className="glass-card rounded-xl flex flex-col h-full min-h-[300px]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Contratos Activos</h3>
        </div>
        
        <div className="p-0 flex-1">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500"><Activity className="w-5 h-5 animate-spin mx-auto" /></div>
          ) : streams.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <Banknote className="w-8 h-8 text-slate-300" />
              <p className="font-medium text-xs">No tienes ingresos ni gastos configurados.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {streams.map((stream: any) => (
                <li key={stream.id} className="p-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-start">
                      <div className={`p-1.5 rounded-md mt-0.5 ${stream.flowType === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {stream.flowType === 'INCOME' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 text-sm tracking-tight">{stream.name}</p>
                          <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                            {stream.streamType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          Categoría: <span className="font-medium text-slate-700">{stream.category?.name || 'General'}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-base font-bold tracking-tight ${stream.flowType === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {stream.flowType === 'INCOME' ? '+' : '-'}${Number(stream.expectedAmount).toLocaleString()}
                      </p>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">{stream.frequency}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onSelectStream(stream)}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Registrar
                    </button>
                    <button 
                      onClick={() => {
                        if(confirm('¿Eliminar este flujo proyectado?')) onDeleteStream(stream.id);
                      }}
                      className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 px-1.5 py-1 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}