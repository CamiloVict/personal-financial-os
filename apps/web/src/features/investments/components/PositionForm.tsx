import React, { Dispatch, SetStateAction } from 'react';
import { Plus } from 'lucide-react';

interface PositionFormProps {
  types: any[];
  typeId: string;
  setTypeId: Dispatch<SetStateAction<string>>;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  initialCapital: string;
  setInitialCapital: Dispatch<SetStateAction<string>>;
  currency: string;
  setCurrency: Dispatch<SetStateAction<string>>;
  startDate: string;
  setStartDate: Dispatch<SetStateAction<string>>;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function PositionForm({
  types, typeId, setTypeId, name, setName,
  initialCapital, setInitialCapital, currency, setCurrency,
  startDate, setStartDate, onSubmit, isPending
}: PositionFormProps) {
  const selectedType = types.find(t => t.id === typeId);

  return (
    <div className="lg:col-span-4 glass-card p-6 rounded-xl self-start">
      <h3 className="text-base font-bold text-slate-800 tracking-tight mb-6">Añadir Posición</h3>
      
      {types.length === 0 ? (
        <div className="bg-rose-50 text-rose-800 p-4 rounded-lg border border-rose-200 text-sm">
          Primero debes crear al menos un <strong>Tipo de Inversión</strong> en la pestaña de Configuración.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Clase de Activo</label>
            <select value={typeId} onChange={e => setTypeId(e.target.value)} className="glass-input w-full p-2.5 rounded-lg text-sm">
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            
            {selectedType && (
              <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-semibold block mb-1">Reglas Activas:</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {selectedType.generatesCashflow && <li>Permite flujo de caja</li>}
                  {selectedType.allowsProfitDistribution && <li>Reparte Utilidad ({selectedType.expectedFrequency})</li>}
                  {selectedType.hasManualValuation && <li>Requiere valoración manual</li>}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Identificador / Nombre</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="glass-input w-full p-2.5 rounded-lg text-sm" placeholder="Ej. Casa de la playa, TSLA..." />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Capital Inicial</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                <input type="number" required value={initialCapital} onChange={e => setInitialCapital(e.target.value)} className="glass-input w-full p-2.5 pl-7 rounded-lg text-sm" placeholder="0.00" />
              </div>
            </div>
            <div className="w-1/3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="glass-input w-full p-2.5 rounded-lg text-sm">
                <option value="USD">USD</option><option value="EUR">EUR</option><option value="COP">COP</option><option value="MXN">MXN</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Inicio</label>
            <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="glass-input w-full p-2.5 rounded-lg text-sm" />
          </div>

          <button type="submit" disabled={isPending} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg font-semibold flex justify-center items-center gap-2 transition-all text-sm shadow-sm">
            <Plus className="w-4 h-4" />
            {isPending ? 'Registrando...' : 'Registrar Posición'}
          </button>
        </form>
      )}
    </div>
  );
}