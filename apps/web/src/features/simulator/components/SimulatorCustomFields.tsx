interface SimulatorCustomFieldsProps {
  customBaselineInitialCapital: string;
  setCustomBaselineInitialCapital: (v: string) => void;
  customBaselineMonthlyContribution: string;
  setCustomBaselineMonthlyContribution: (v: string) => void;
  customBaselineAnnualReturn: string;
  setCustomBaselineAnnualReturn: (v: string) => void;
  customScenarioInitialCapital: string;
  setCustomScenarioInitialCapital: (v: string) => void;
  customScenarioMonthlyContribution: string;
  setCustomScenarioMonthlyContribution: (v: string) => void;
  customScenarioAnnualReturn: string;
  setCustomScenarioAnnualReturn: (v: string) => void;
  customScenarioAnnualCost: string;
  setCustomScenarioAnnualCost: (v: string) => void;
  customYearsToSimulate: string;
  setCustomYearsToSimulate: (v: string) => void;
}

export function SimulatorCustomFields({
  customBaselineInitialCapital,
  setCustomBaselineInitialCapital,
  customBaselineMonthlyContribution,
  setCustomBaselineMonthlyContribution,
  customBaselineAnnualReturn,
  setCustomBaselineAnnualReturn,
  customScenarioInitialCapital,
  setCustomScenarioInitialCapital,
  customScenarioMonthlyContribution,
  setCustomScenarioMonthlyContribution,
  customScenarioAnnualReturn,
  setCustomScenarioAnnualReturn,
  customScenarioAnnualCost,
  setCustomScenarioAnnualCost,
  customYearsToSimulate,
  setCustomYearsToSimulate,
}: SimulatorCustomFieldsProps) {
  return (
    <>
      <div className="bg-slate-50 border border-slate-100 p-2 rounded">
        <h3 className="text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Línea Base (Opción A)</h3>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Capital Inicial</label>
            <input
              type="number"
              required
              value={customBaselineInitialCapital}
              onChange={(e) => setCustomBaselineInitialCapital(e.target.value)}
              className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
            />
          </div>
          <div>
            <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Aporte Mensual</label>
            <input
              type="number"
              required
              value={customBaselineMonthlyContribution}
              onChange={(e) => setCustomBaselineMonthlyContribution(e.target.value)}
              className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
            />
          </div>
        </div>
        <div>
          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Retorno Anual (%)</label>
          <input
            type="number"
            step="0.1"
            required
            value={customBaselineAnnualReturn}
            onChange={(e) => setCustomBaselineAnnualReturn(e.target.value)}
            className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
          />
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-100 p-2 rounded">
        <h3 className="text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Escenario Propuesto (Opción B)</h3>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Capital Inicial</label>
            <input
              type="number"
              required
              value={customScenarioInitialCapital}
              onChange={(e) => setCustomScenarioInitialCapital(e.target.value)}
              className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
            />
          </div>
          <div>
            <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Aporte Mensual</label>
            <input
              type="number"
              required
              value={customScenarioMonthlyContribution}
              onChange={(e) => setCustomScenarioMonthlyContribution(e.target.value)}
              className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Retorno Anual (%)</label>
            <input
              type="number"
              step="0.1"
              required
              value={customScenarioAnnualReturn}
              onChange={(e) => setCustomScenarioAnnualReturn(e.target.value)}
              className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
            />
          </div>
          <div>
            <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Costo Anual (%)</label>
            <input
              type="number"
              step="0.1"
              required
              value={customScenarioAnnualCost}
              onChange={(e) => setCustomScenarioAnnualCost(e.target.value)}
              className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Años a Simular</label>
        <input
          type="number"
          required
          value={customYearsToSimulate}
          onChange={(e) => setCustomYearsToSimulate(e.target.value)}
          className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
        />
      </div>
    </>
  );
}
