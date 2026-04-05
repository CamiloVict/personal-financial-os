import React, { Dispatch, SetStateAction } from 'react';
import { X } from 'lucide-react';

interface PositionEventModalProps {
  selectedPosition: any;
  setSelectedPosition: (pos: any) => void;
  eventType: string;
  setEventType: Dispatch<SetStateAction<string>>;
  eventAmount: string;
  setEventAmount: Dispatch<SetStateAction<string>>;
  eventDate: string;
  setEventDate: Dispatch<SetStateAction<string>>;
  eventObs: string;
  setEventObs: Dispatch<SetStateAction<string>>;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function PositionEventModal({
  selectedPosition, setSelectedPosition, eventType, setEventType,
  eventAmount, setEventAmount, eventDate, setEventDate,
  eventObs, setEventObs, onSubmit, isPending
}: PositionEventModalProps) {
  if (!selectedPosition) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 tracking-tight">Registrar Evento</h3>
          <button onClick={() => setSelectedPosition(null)} className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 bg-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800 mb-2">
            Actualizando posición: <strong>{selectedPosition.name}</strong>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Naturaleza del Evento</label>
            <select value={eventType} onChange={e => setEventType(e.target.value)} className="glass-input w-full p-2.5 rounded-lg text-sm">
              {selectedPosition.type?.allowsProfitDistribution && <option value="PROFIT_DISTRIBUTION">Utilidad Repartida</option>}
              {selectedPosition.type?.allowsProfitDistribution && <option value="PROFIT_REINVESTMENT">Utilidad Reinvertida</option>}
              {selectedPosition.type?.allowsExtraContributions && <option value="CAPITAL_CONTRIBUTION">Aporte de Capital</option>}
              <option value="CAPITAL_WITHDRAWAL">Retiro de Capital</option>
              {selectedPosition.type?.hasManualValuation && <option value="VALUATION_INCREASE">Valorización (+)</option>}
              {selectedPosition.type?.hasManualValuation && <option value="VALUATION_DECREASE">Desvalorización (-)</option>}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                <input type="number" required value={eventAmount} onChange={e => setEventAmount(e.target.value)} className="glass-input w-full p-2.5 pl-7 rounded-lg text-sm" />
              </div>
            </div>
            <div className="w-1/3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
              <input value={selectedPosition.currency} disabled className="w-full p-2.5 rounded-lg bg-slate-100 text-slate-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
            <input type="date" required value={eventDate} onChange={e => setEventDate(e.target.value)} className="glass-input w-full p-2.5 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
            <textarea value={eventObs} onChange={e => setEventObs(e.target.value)} className="glass-input w-full p-2.5 rounded-lg text-sm min-h-20" placeholder="Detalles opcionales..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg font-semibold text-sm transition-colors">
              {isPending ? 'Confirmando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}