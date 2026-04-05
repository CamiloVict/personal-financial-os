import { Home, Briefcase, CreditCard, Landmark, Settings2 } from 'lucide-react';
import type { ScenarioType } from '../types';

interface SimulatorScenarioTabsProps {
  activeScenario: ScenarioType;
  onSelect: (scenario: ScenarioType) => void;
}

export function SimulatorScenarioTabs({ activeScenario, onSelect }: SimulatorScenarioTabsProps) {
  const tabClass = (scenario: ScenarioType) =>
    `flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[10px] transition-all whitespace-nowrap ${
      activeScenario === scenario
        ? 'bg-slate-900 text-white shadow-sm'
        : 'glass-card text-slate-600 hover:bg-slate-50'
    }`;

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
      <button type="button" onClick={() => onSelect('PROPERTY')} className={tabClass('PROPERTY')}>
        <Home className="w-3 h-3" /> Propiedad
      </button>
      <button type="button" onClick={() => onSelect('DEBT_VS_INVEST')} className={tabClass('DEBT_VS_INVEST')}>
        <CreditCard className="w-3 h-3" /> Deuda vs Invertir
      </button>
      <button type="button" onClick={() => onSelect('TAX_ADVANTAGED')} className={tabClass('TAX_ADVANTAGED')}>
        <Landmark className="w-3 h-3" /> Exentas (AFC/FPV)
      </button>
      <button type="button" onClick={() => onSelect('BUSINESS')} className={tabClass('BUSINESS')}>
        <Briefcase className="w-3 h-3" /> Negocio vs Pasividad
      </button>
      <button type="button" onClick={() => onSelect('CUSTOM')} className={tabClass('CUSTOM')}>
        <Settings2 className="w-3 h-3" /> Personalizado (Otro)
      </button>
    </div>
  );
}
