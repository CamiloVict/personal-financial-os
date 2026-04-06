import React, { Dispatch, SetStateAction } from 'react';
import { Save } from 'lucide-react';

interface TypeFormProps {
  formTitle?: string;
  submitLabel?: string;
  showCancel?: boolean;
  onCancel?: () => void;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  generatesCashflow: boolean;
  setGeneratesCashflow: Dispatch<SetStateAction<boolean>>;
  allowsProfitDistribution: boolean;
  setAllowsProfitDistribution: Dispatch<SetStateAction<boolean>>;
  allowsExtraContributions: boolean;
  setAllowsExtraContributions: Dispatch<SetStateAction<boolean>>;
  allowsLinkedDebt: boolean;
  setAllowsLinkedDebt: Dispatch<SetStateAction<boolean>>;
  hasManualValuation: boolean;
  setHasManualValuation: Dispatch<SetStateAction<boolean>>;
  countsInFinancialPortfolio: boolean;
  setCountsInFinancialPortfolio: Dispatch<SetStateAction<boolean>>;
  expectedFrequency: string;
  setExpectedFrequency: Dispatch<SetStateAction<string>>;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function TypeForm({
  formTitle = 'Nueva categoría de patrimonio',
  submitLabel,
  showCancel = false,
  onCancel,
  name, setName, generatesCashflow, setGeneratesCashflow,
  allowsProfitDistribution, setAllowsProfitDistribution,
  allowsExtraContributions, setAllowsExtraContributions,
  allowsLinkedDebt, setAllowsLinkedDebt,
  hasManualValuation, setHasManualValuation,
  countsInFinancialPortfolio, setCountsInFinancialPortfolio,
  expectedFrequency, setExpectedFrequency,
  onSubmit, isPending
}: TypeFormProps) {
  const primaryLabel = isPending ? 'Guardando…' : (submitLabel ?? 'Guardar');
  return (
    <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm self-start">
      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        {formTitle}
      </h3>
      
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre o Categoría</label>
          <input 
            required 
            value={name} 
            onChange={e => setName(e.target.value)} 
            className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" 
            placeholder="Ej. Propiedad Raíz, Crypto..."
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Activo financiero vs. bien de uso
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Los <span className="font-semibold text-slate-700">pasivos</span> (deudas, préstamos) se registran en{' '}
            <span className="font-semibold text-slate-700">Deudas</span>. Acá definís si la categoría suma al{' '}
            <span className="font-semibold text-slate-700">portafolio financiero</span> (inversiones, activos que
            valorás para rendimiento) o solo al <span className="font-semibold text-slate-700">registro patrimonial</span>{' '}
            (ej. vehículo particular: no entra en valor ni retorno de portafolio).
          </p>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={countsInFinancialPortfolio}
              onChange={(e) => setCountsInFinancialPortfolio(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer shrink-0"
            />
            <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors leading-snug">
              Cuenta en portafolio financiero (valor, retorno y analytics de inversión)
            </span>
          </label>
        </div>
        
        <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" checked={generatesCashflow} onChange={e => setGeneratesCashflow(e.target.checked)} 
                   className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
            <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">Genera Flujo de Caja</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" checked={allowsProfitDistribution} onChange={e => setAllowsProfitDistribution(e.target.checked)} 
                   className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
            <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">Permite Reparto de Utilidades</span>
          </label>

          {allowsProfitDistribution && (
            <div className="pl-7 pt-1 animate-in fade-in slide-in-from-top-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Frecuencia Esperada</label>
              <select 
                value={expectedFrequency} 
                onChange={e => setExpectedFrequency(e.target.value)} 
                className="w-full p-2 rounded-md border border-slate-300 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
              >
                <option value="MONTHLY">Mensual</option>
                <option value="QUARTERLY">Trimestral</option>
                <option value="SEMIANNUALLY">Semestral</option>
                <option value="ANNUALLY">Anual</option>
              </select>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" checked={allowsExtraContributions} onChange={e => setAllowsExtraContributions(e.target.checked)} 
                   className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
            <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">Permite Aportes Extra (Adiciones)</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" checked={allowsLinkedDebt} onChange={e => setAllowsLinkedDebt(e.target.checked)} 
                   className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
            <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">Admite Deuda Asociada (Ej. Hipoteca)</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" checked={hasManualValuation} onChange={e => setHasManualValuation(e.target.checked)} 
                   className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
            <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">Requiere Valorización Manual</span>
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          {showCancel && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="w-full sm:w-auto sm:flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
          ) : null}
          <button type="submit" disabled={isPending} className="w-full flex-1 bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl font-semibold flex justify-center items-center gap-2 transition-all shadow-md shadow-blue-500/20 text-sm disabled:opacity-60">
            <Save className="w-4 h-4" />
            {primaryLabel}
          </button>
        </div>
      </form>
    </div>
  );
}