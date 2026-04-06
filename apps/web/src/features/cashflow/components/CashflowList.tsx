import React from 'react';
import { Banknote, TrendingUp, TrendingDown, CheckCircle2, Trash2, Activity } from 'lucide-react';
import { formatPresentedAmount } from '@/features/currency/format';

interface CashflowListProps {
  streams: any[];
  isLoading: boolean;
  onSelectStream: (stream: any) => void;
  onDeleteStream: (id: string) => void;
  presentedByStreamId?: Record<string, { amount: number; currency: string }>;
  presentationLoading?: boolean;
}

export function CashflowList({
  streams,
  isLoading,
  onSelectStream,
  onDeleteStream,
  presentedByStreamId,
  presentationLoading,
}: CashflowListProps) {
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
                <li
                  key={stream.id}
                  className="p-4 transition-colors group active:bg-slate-100 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-slate-50"
                >
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
                      {presentedByStreamId?.[stream.id] && !presentationLoading ? (
                        <>
                          <p
                            className={`text-base font-bold tracking-tight ${stream.flowType === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}
                          >
                            {stream.flowType === 'INCOME' ? '+' : '-'}
                            {formatPresentedAmount(
                              presentedByStreamId[stream.id].amount,
                              presentedByStreamId[stream.id].currency,
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Nom.: {stream.flowType === 'INCOME' ? '+' : '-'}$
                            {Number(stream.expectedAmount).toLocaleString()}{' '}
                            {stream.currency}
                          </p>
                        </>
                      ) : (
                        <p
                          className={`text-base font-bold tracking-tight ${stream.flowType === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}
                        >
                          {stream.flowType === 'INCOME' ? '+' : '-'}$
                          {Number(stream.expectedAmount).toLocaleString()}{' '}
                          <span className="text-slate-400 font-normal text-xs">
                            {stream.currency}
                          </span>
                        </p>
                      )}
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">
                        {stream.frequency}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap justify-end gap-2 transition-opacity hover-reveal-actions">
                    <button
                      type="button"
                      onClick={() => onSelectStream(stream)}
                      className="touch-manipulation flex items-center gap-1 bg-slate-100 active:bg-slate-300 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-slate-200 text-slate-700 px-2 py-1.5 min-h-9 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Registrar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if(confirm('¿Eliminar este flujo proyectado?')) onDeleteStream(stream.id);
                      }}
                      className="touch-manipulation flex items-center gap-1 bg-rose-50 active:bg-rose-200 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-rose-100 text-rose-700 px-2 py-1.5 min-h-9 min-w-9 justify-center rounded-md transition-colors"
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