import React, { Dispatch, SetStateAction } from 'react';
import { Briefcase, RefreshCw } from 'lucide-react';

interface TaxProfileFormProps {
  isResident: boolean;
  setIsResident: Dispatch<SetStateAction<boolean>>;
  daysInCountry: string;
  setDaysInCountry: Dispatch<SetStateAction<string>>;
  hasDependents: boolean;
  setHasDependents: Dispatch<SetStateAction<boolean>>;
  hasPrepaidMedicine: boolean;
  setHasPrepaidMedicine: Dispatch<SetStateAction<boolean>>;
  hasHousingInterest: boolean;
  setHasHousingInterest: Dispatch<SetStateAction<boolean>>;
  hasAFC: boolean;
  setHasAFC: Dispatch<SetStateAction<boolean>>;
  hasVoluntaryPension: boolean;
  setHasVoluntaryPension: Dispatch<SetStateAction<boolean>>;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function TaxProfileForm({
  isResident, setIsResident, daysInCountry, setDaysInCountry,
  hasDependents, setHasDependents, hasPrepaidMedicine, setHasPrepaidMedicine,
  hasHousingInterest, setHasHousingInterest, hasAFC, setHasAFC,
  hasVoluntaryPension, setHasVoluntaryPension, onSubmit, isPending
}: TaxProfileFormProps) {
  return (
    <div className="glass-card rounded-xl p-4">
      <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-indigo-600" />
        Configurar Perfil Fiscal (Colombia)
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
          <h3 className="font-bold text-slate-700 text-xs">Residencia y Jurisdicción</h3>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-medium text-slate-700">¿Eres Residente Fiscal en Colombia?</span>
            <input type="checkbox" checked={isResident} onChange={e => setIsResident(e.target.checked)} className="w-3.5 h-3.5 text-indigo-600 rounded" />
          </label>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Días de permanencia en el país (año fiscal)</label>
            <input 
              type="number" value={daysInCountry} onChange={e => setDaysInCountry(e.target.value)}
              className="glass-input w-full p-2 rounded-md text-xs" 
            />
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-700 text-xs border-b border-slate-200 pb-1.5">Deducciones Legales Potenciales</h3>
          
          <div className="space-y-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={hasDependents} onChange={e => setHasDependents(e.target.checked)} className="mt-0.5 w-3.5 h-3.5 text-indigo-600 rounded" />
              <div>
                <span className="text-xs font-bold text-slate-800">Dependientes Económicos</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Hijos menores de edad, hijos estudiantes hasta 23 años, o padres/cónyuge que dependan de ti por falta de ingresos. Otorga deducción del 10% (max 32 UVT/mes).</p>
              </div>
            </label>
          </div>

          <div className="space-y-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={hasPrepaidMedicine} onChange={e => setHasPrepaidMedicine(e.target.checked)} className="mt-0.5 w-3.5 h-3.5 text-indigo-600 rounded" />
              <div>
                <span className="text-xs font-bold text-slate-800">Medicina Prepagada o Pólizas de Salud</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Pagos a planes de salud adicionales a la EPS para ti, cónyuge o hijos. Otorga deducción de hasta 16 UVT mensuales.</p>
              </div>
            </label>
          </div>

          <div className="space-y-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={hasHousingInterest} onChange={e => setHasHousingInterest(e.target.checked)} className="mt-0.5 w-3.5 h-3.5 text-indigo-600 rounded" />
              <div>
                <span className="text-xs font-bold text-slate-800">Intereses por Crédito de Vivienda</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Préstamos hipotecarios o leasing habitacional sobre vivienda. Otorga deducción de hasta 100 UVT mensuales.</p>
              </div>
            </label>
          </div>

          <div className="space-y-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={hasAFC} onChange={e => setHasAFC(e.target.checked)} className="mt-0.5 w-3.5 h-3.5 text-indigo-600 rounded" />
              <div>
                <span className="text-xs font-bold text-slate-800">Ahorro para Fomento a la Construcción (Cuenta AFC)</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Cuentas bancarias de destinación específica para pagar cuotas de vivienda o comprar casa nueva. Este dinero cuenta como Renta Exenta y reduce fuertemente tu base gravable (hasta 30% del ingreso).</p>
              </div>
            </label>
          </div>

          <div className="space-y-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={hasVoluntaryPension} onChange={e => setHasVoluntaryPension(e.target.checked)} className="mt-0.5 w-3.5 h-3.5 text-indigo-600 rounded" />
              <div>
                <span className="text-xs font-bold text-slate-800">Aportes Voluntarios a Pensión (FPV)</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Aportes adicionales a fondos de pensión voluntaria. El capital aportado es Renta Exenta (hasta 30% del ingreso mensual) si cumple permanencia de 10 años o se usa para vivienda.</p>
              </div>
            </label>
          </div>
        </div>

        <button type="submit" disabled={isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg font-bold flex justify-center items-center gap-1.5 shadow-sm text-xs">
          {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Guardar y Generar Escenarios'}
        </button>
      </form>
    </div>
  );
}