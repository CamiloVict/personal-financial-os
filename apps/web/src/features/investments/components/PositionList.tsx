import React from 'react';
import { Calendar, ListPlus, Trash2 } from 'lucide-react';

interface PositionListProps {
  positions: any[];
  onSelectPosition: (pos: any) => void;
  onDeletePosition: (id: string) => void;
  isDeleting: boolean;
}

export function PositionList({ positions, onSelectPosition, onDeletePosition, isDeleting }: PositionListProps) {
  return (
    <div className="space-y-4">
      {positions.map(pos => (
        <div key={pos.id} className="glass-card rounded-xl overflow-hidden hover:shadow-md transition-all group">
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
              <div className="text-lg font-bold text-slate-700 tracking-tight">${Number(pos.initialCapital).toLocaleString()} <span className="text-xs font-normal text-slate-400">{pos.currency}</span></div>
            </div>
            <div>
              <div className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-wide">Valorización Actual</div>
              <div className="text-lg font-bold text-blue-600 tracking-tight">${Number(pos.currentEstimatedValue).toLocaleString()} <span className="text-xs font-normal text-blue-400">{pos.currency}</span></div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold mb-1 flex items-center gap-1 uppercase tracking-wide">
                <Calendar className="w-3 h-3" /> Fecha Inicio
              </div>
              <div className="text-slate-800 font-medium text-sm">{new Date(pos.startDate).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onSelectPosition(pos)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
              <ListPlus className="w-3.5 h-3.5" /> Registrar Evento
            </button>
            <button 
              disabled={isDeleting}
              onClick={() => { if(confirm('¿Eliminar?')) { onDeletePosition(pos.id); } }} 
              className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 px-2 py-1.5 rounded-lg text-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}