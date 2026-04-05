import React, { Dispatch, SetStateAction } from 'react';
import { Plus } from 'lucide-react';

interface GoalFormProps {
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  targetAmount: string;
  setTargetAmount: Dispatch<SetStateAction<string>>;
  currentAmount: string;
  setCurrentAmount: Dispatch<SetStateAction<string>>;
  targetDate: string;
  setTargetDate: Dispatch<SetStateAction<string>>;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function GoalForm({
  name, setName, targetAmount, setTargetAmount,
  currentAmount, setCurrentAmount, targetDate, setTargetDate,
  onSubmit, isPending
}: GoalFormProps) {
  return (
    <div className="lg:col-span-4 glass-card p-4 rounded-xl self-start">
      <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-4">Crear Nueva Meta</h3>
      
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Nombre de la Meta</label>
          <input 
            required 
            value={name} 
            onChange={e => setName(e.target.value)} 
            className="glass-input w-full p-2 rounded-lg text-sm" 
            placeholder="Ej. Casa propia, Fondo de emergencia..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Monto Objetivo</label>
          <div className="relative">
            <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-sm">$</span>
            <input 
              type="number" 
              required 
              value={targetAmount} 
              onChange={e => setTargetAmount(e.target.value)} 
              className="glass-input w-full p-2 pl-6 rounded-lg text-sm" 
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Ahorro Actual Inicial</label>
          <div className="relative">
            <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-sm">$</span>
            <input 
              type="number" 
              value={currentAmount} 
              onChange={e => setCurrentAmount(e.target.value)} 
              className="glass-input w-full p-2 pl-6 rounded-lg text-sm" 
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Fecha Objetivo</label>
          <input 
            type="date" 
            required 
            value={targetDate} 
            onChange={e => setTargetDate(e.target.value)} 
            className="glass-input w-full p-2 rounded-lg text-sm" 
          />
        </div>

        <button type="submit" disabled={isPending} className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-semibold flex justify-center items-center gap-1.5 transition-all text-xs shadow-sm">
          <Plus className="w-3.5 h-3.5" />
          {isPending ? 'Creando...' : 'Guardar Meta'}
        </button>
      </form>
    </div>
  );
}