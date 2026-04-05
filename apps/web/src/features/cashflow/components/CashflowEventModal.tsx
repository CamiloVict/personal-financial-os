import React, { Dispatch, SetStateAction } from 'react';
import { X } from 'lucide-react';

interface CashflowEventModalProps {
  selectedStream: any;
  setSelectedStream: (stream: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  
  eventAmount: string;
  setEventAmount: Dispatch<SetStateAction<string>>;
  eventDate: string;
  setEventDate: Dispatch<SetStateAction<string>>;
  eventObs: string;
  setEventObs: Dispatch<SetStateAction<string>>;
}

export function CashflowEventModal({
  selectedStream, setSelectedStream, onSubmit, isPending,
  eventAmount, setEventAmount, eventDate, setEventDate, eventObs, setEventObs
}: CashflowEventModalProps) {
  if (!selectedStream) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="glass-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-200/50 bg-white/40 backdrop-blur-sm">
          <h3 className="font-bold text-base text-slate-800 tracking-tight">
            Registrar Realidad: {selectedStream.flowType === 'INCOME' ? 'Ingreso Recibido' : 'Gasto Pagado'}
          </h3>
          <button onClick={() => setSelectedStream(null)} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-200/50 p-1.5 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-xs text-blue-800/90 mb-2 backdrop-blur-sm shadow-inner shadow-blue-500/5">
            Monto proyectado: <strong className="text-blue-900 text-sm">${Number(selectedStream.expectedAmount).toLocaleString()}</strong>
            <br/><span className="text-[10px] text-blue-800/60 mt-1 block">Puedes ajustarlo si la realidad fue diferente.</span>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Monto Real</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">$</span>
              <input 
                type="number" 
                required 
                defaultValue={selectedStream.expectedAmount}
                onChange={e => setEventAmount(e.target.value)} 
                className="glass-input w-full p-3 pl-8 rounded-xl font-bold text-base text-slate-800 shadow-sm" 
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Fecha Real de Ejecución</label>
            <input 
              type="date" 
              required 
              value={eventDate} 
              onChange={e => setEventDate(e.target.value)} 
              className="glass-input w-full p-2.5 rounded-xl text-sm shadow-sm" 
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Observaciones</label>
            <input 
              value={eventObs} 
              onChange={e => setEventObs(e.target.value)} 
              className="glass-input w-full p-2.5 rounded-xl text-sm shadow-sm" 
              placeholder="Nota opcional..."
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button type="submit" disabled={isPending} className="flex-1 bg-blue-600/90 hover:bg-blue-500 backdrop-blur-md border border-blue-500/50 text-white p-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 text-xs">
              {isPending ? 'Guardando...' : 'Confirmar'}
            </button>
            <button type="button" onClick={() => setSelectedStream(null)} className="px-5 glass-card hover:bg-white/80 text-slate-700 rounded-xl font-bold text-xs transition-all shadow-sm">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}