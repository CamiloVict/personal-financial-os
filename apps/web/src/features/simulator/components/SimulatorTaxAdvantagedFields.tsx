interface SimulatorTaxAdvantagedFieldsProps {
  monthlyContribution: string;
  setMonthlyContribution: (v: string) => void;
  taxInvestmentReturnAnnual: string;
  setTaxInvestmentReturnAnnual: (v: string) => void;
  marginalTaxRate: string;
  setMarginalTaxRate: (v: string) => void;
  yearsToSimulateTax: string;
  setYearsToSimulateTax: (v: string) => void;
}

export function SimulatorTaxAdvantagedFields({
  monthlyContribution,
  setMonthlyContribution,
  taxInvestmentReturnAnnual,
  setTaxInvestmentReturnAnnual,
  marginalTaxRate,
  setMarginalTaxRate,
  yearsToSimulateTax,
  setYearsToSimulateTax,
}: SimulatorTaxAdvantagedFieldsProps) {
  return (
    <>
      <div>
        <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Aporte Mensual</label>
        <div className="relative">
          <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">$</span>
          <input
            type="number"
            required
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(e.target.value)}
            className="glass-input w-full p-1.5 pl-5 rounded text-[10px] font-bold text-slate-800"
          />
        </div>
      </div>

      <div>
        <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Retorno Inversión Anual (%)</label>
        <input
          type="number"
          step="0.1"
          required
          value={taxInvestmentReturnAnnual}
          onChange={(e) => setTaxInvestmentReturnAnnual(e.target.value)}
          className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Tasa Impuestos (%)</label>
          <input
            type="number"
            step="0.1"
            required
            value={marginalTaxRate}
            onChange={(e) => setMarginalTaxRate(e.target.value)}
            className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
          />
        </div>
        <div>
          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Años Simulación</label>
          <input
            type="number"
            required
            value={yearsToSimulateTax}
            onChange={(e) => setYearsToSimulateTax(e.target.value)}
            className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
          />
        </div>
      </div>
    </>
  );
}
