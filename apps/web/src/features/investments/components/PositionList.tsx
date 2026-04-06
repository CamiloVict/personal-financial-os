import React from 'react';
import { Calendar, ListPlus, Trash2 } from 'lucide-react';
import { formatBookAmount, formatPresentedAmount } from '@/features/currency/format';

interface PositionListProps {
  positions: any[];
  onSelectPosition: (pos: any) => void;
  onDeletePosition: (id: string) => void;
  isDeleting: boolean;
  /** Valuación coherente (mismo modo que barra global) */
  presentedById?: Record<
    string,
    { capital: number; value: number; currency: string }
  >;
  presentationLoading?: boolean;
}

export function PositionList({
  positions,
  onSelectPosition,
  onDeletePosition,
  isDeleting,
  presentedById,
  presentationLoading,
}: PositionListProps) {
  return (
    <div className="space-y-4">
      {positions.map(pos => (
        <div
          key={pos.id}
          className="glass-card rounded-xl overflow-hidden transition-all group active:shadow-md [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-md"
        >
          <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50">
            <div>
              <h4 className="text-lg font-bold text-slate-900 tracking-tight">{pos.name}</h4>
              <span className="inline-block mt-1 bg-slate-200 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                {pos.type?.name}
              </span>
            </div>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
              {pos.status}
            </span>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wide">Capital Base</div>
              {presentationLoading && !presentedById?.[pos.id] ? (
                <div className="text-lg font-bold text-slate-500 tracking-tight">…</div>
              ) : presentedById?.[pos.id] ? (
                <>
                  <div className="text-lg font-bold text-slate-700 tracking-tight">
                    {formatPresentedAmount(
                      presentedById[pos.id].capital,
                      presentedById[pos.id].currency,
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Nom.:{' '}
                    {formatBookAmount(
                      Number(pos.initialCapital),
                      pos.currency ?? 'USD',
                    )}
                  </div>
                </>
              ) : (
                <div className="text-lg font-bold text-slate-700 tracking-tight">
                  {formatBookAmount(
                    Number(pos.initialCapital),
                    pos.currency ?? 'USD',
                  )}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-wide">Valorización Actual</div>
              {presentationLoading && !presentedById?.[pos.id] ? (
                <div className="text-lg font-bold text-blue-400 tracking-tight">…</div>
              ) : presentedById?.[pos.id] ? (
                <>
                  <div className="text-lg font-bold text-blue-600 tracking-tight">
                    {formatPresentedAmount(
                      presentedById[pos.id].value,
                      presentedById[pos.id].currency,
                    )}
                  </div>
                  <div className="text-[10px] text-blue-400/80 mt-0.5">
                    Nom.:{' '}
                    {formatBookAmount(
                      Number(pos.currentEstimatedValue),
                      pos.currency ?? 'USD',
                    )}
                  </div>
                </>
              ) : (
                <div className="text-lg font-bold text-blue-600 tracking-tight">
                  {formatBookAmount(
                    Number(pos.currentEstimatedValue),
                    pos.currency ?? 'USD',
                  )}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold mb-1 flex items-center gap-1 uppercase tracking-wide">
                <Calendar className="w-3 h-3" /> Fecha Inicio
              </div>
              <div className="text-slate-800 font-medium text-sm">{new Date(pos.startDate).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-white flex flex-wrap justify-end gap-3 transition-opacity hover-reveal-actions">
            <button
              type="button"
              onClick={() => onSelectPosition(pos)}
              className="touch-manipulation flex items-center gap-2 bg-slate-100 active:bg-slate-300 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-slate-200 text-slate-700 px-3 py-2 min-h-10 rounded-lg text-xs font-semibold transition-colors"
            >
              <ListPlus className="w-3.5 h-3.5" /> Registrar Evento
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => { if(confirm('¿Eliminar?')) { onDeletePosition(pos.id); } }}
              className="touch-manipulation flex items-center gap-2 bg-rose-50 active:bg-rose-200 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-rose-100 text-rose-600 px-3 py-2 min-h-10 rounded-lg text-xs transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}