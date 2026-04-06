import React, { Dispatch, SetStateAction } from 'react';
import { Plus } from 'lucide-react';

interface CashflowFormProps {
  categories: any[];
  loadingCategories: boolean;
  seedCategoriesPending: boolean;
  onSeedCategories: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  
  // State from parent
  flowType: string;
  setFlowType: Dispatch<SetStateAction<string>>;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  streamType: string;
  setStreamType: Dispatch<SetStateAction<string>>;
  categoryId: string;
  setCategoryId: Dispatch<SetStateAction<string>>;
  expectedAmount: string;
  setExpectedAmount: Dispatch<SetStateAction<string>>;
  frequency: string;
  setFrequency: Dispatch<SetStateAction<string>>;
  startDate: string;
  setStartDate: Dispatch<SetStateAction<string>>;
}

export function CashflowForm({
  categories, loadingCategories, seedCategoriesPending, onSeedCategories, onSubmit, isPending,
  flowType, setFlowType, name, setName, streamType, setStreamType,
  categoryId, setCategoryId, expectedAmount, setExpectedAmount,
  frequency, setFrequency, startDate, setStartDate
}: CashflowFormProps) {
  
  const filteredCategories = categories.filter((c: any) => c.type === flowType);

  return (
    <div
      id="cashflow-nuevo-flujo"
      className="lg:col-span-4 glass-card p-4 rounded-xl self-start scroll-mt-24"
    >
      <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-4">Crear Flujo</h3>
      
      {categories.length === 0 && !loadingCategories ? (
        <div className="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200 text-xs">
          <p className="mb-2">No tienes categorías configuradas.</p>
          <button 
            onClick={onSeedCategories} 
            disabled={seedCategoriesPending}
            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-md font-semibold w-full transition-colors"
          >
            {seedCategoriesPending ? 'Creando...' : 'Generar Categorías base'}
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          
          <div className="flex gap-2 p-1 bg-slate-100 rounded-md">
            <button type="button" onClick={() => setFlowType('INCOME')} className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${flowType === 'INCOME' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}>Ingreso</button>
            <button type="button" onClick={() => setFlowType('EXPENSE')} className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${flowType === 'EXPENSE' ? 'bg-white shadow-sm text-rose-700' : 'text-slate-500 hover:text-slate-700'}`}>Gasto</button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Nombre (Ref)</label>
            <input 
              required 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="glass-input w-full p-2 rounded-lg text-sm" 
              placeholder={flowType === 'INCOME' ? 'Ej. Salario' : 'Ej. Arriendo'}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Tipo</label>
              <select value={streamType} onChange={e => setStreamType(e.target.value)} className="glass-input w-full p-2 rounded-lg text-sm">
                <option value="FIXED">Fijo</option>
                <option value="VARIABLE">Variable</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Categoría</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="glass-input w-full p-2 rounded-lg text-sm">
                <option value="">Selecciona...</option>
                {filteredCategories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Monto Esperado</label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-sm">$</span>
              <input 
                type="number" 
                required 
                value={expectedAmount} 
                onChange={e => setExpectedAmount(e.target.value)} 
                className="glass-input w-full p-2 pl-6 rounded-lg text-sm" 
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Frecuencia</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value)} className="glass-input w-full p-2 rounded-lg text-sm">
                <option value="WEEKLY">Semanal</option>
                <option value="BIWEEKLY">Quincenal</option>
                <option value="MONTHLY">Mensual</option>
                <option value="ANNUALLY">Anual</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Empezó en</label>
              <input 
                type="date" 
                required 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="glass-input w-full p-2 rounded-lg text-sm" 
              />
            </div>
          </div>

          <button type="submit" disabled={isPending} className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-semibold flex justify-center items-center gap-1.5 transition-all shadow-sm text-xs">
            <Plus className="w-3.5 h-3.5" />
            Crear Flujo
          </button>
        </form>
      )}
    </div>
  );
}