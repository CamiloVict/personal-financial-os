interface SimulatorPropertyFieldsProps {
  propertyValue: string;
  setPropertyValue: (v: string) => void;
  downPayment: string;
  setDownPayment: (v: string) => void;
  expectedMonthlyRent: string;
  setExpectedMonthlyRent: (v: string) => void;
  interestRateAnnual: string;
  setInterestRateAnnual: (v: string) => void;
  loanTermYears: string;
  setLoanTermYears: (v: string) => void;
  expectedAnnualAppreciation: string;
  setExpectedAnnualAppreciation: (v: string) => void;
  maintenanceAnnualPercentage: string;
  setMaintenanceAnnualPercentage: (v: string) => void;
  baselineInvestmentReturn: string;
  setBaselineInvestmentReturn: (v: string) => void;
}

export function SimulatorPropertyFields({
  propertyValue,
  setPropertyValue,
  downPayment,
  setDownPayment,
  expectedMonthlyRent,
  setExpectedMonthlyRent,
  interestRateAnnual,
  setInterestRateAnnual,
  loanTermYears,
  setLoanTermYears,
  expectedAnnualAppreciation,
  setExpectedAnnualAppreciation,
  maintenanceAnnualPercentage,
  setMaintenanceAnnualPercentage,
  baselineInvestmentReturn,
  setBaselineInvestmentReturn,
}: SimulatorPropertyFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Valor Propiedad</label>
          <div className="relative">
            <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">$</span>
            <input
              type="number"
              required
              value={propertyValue}
              onChange={(e) => setPropertyValue(e.target.value)}
              className="glass-input w-full p-1.5 pl-5 rounded text-[10px] font-bold text-slate-800"
            />
          </div>
        </div>
        <div>
          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Cuota Inicial</label>
          <div className="relative">
            <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">$</span>
            <input
              type="number"
              required
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
              className="glass-input w-full p-1.5 pl-5 rounded text-[10px] font-semibold"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Arriendo Mensual Esperado</label>
        <div className="relative">
          <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">$</span>
          <input
            type="number"
            required
            value={expectedMonthlyRent}
            onChange={(e) => setExpectedMonthlyRent(e.target.value)}
            className="glass-input w-full p-1.5 pl-5 rounded text-[10px] font-semibold"
          />
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-100 p-2 rounded flex gap-2">
        <div className="flex-1">
          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Tasa E.A Crédito(%)</label>
          <input
            type="number"
            step="0.1"
            required
            value={interestRateAnnual}
            onChange={(e) => setInterestRateAnnual(e.target.value)}
            className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Plazo (Años)</label>
          <input
            type="number"
            required
            value={loanTermYears}
            onChange={(e) => setLoanTermYears(e.target.value)}
            className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Valorización (%)</label>
          <input
            type="number"
            step="0.1"
            required
            value={expectedAnnualAppreciation}
            onChange={(e) => setExpectedAnnualAppreciation(e.target.value)}
            className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
          />
        </div>
        <div>
          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Mantenimiento (%)</label>
          <input
            type="number"
            step="0.1"
            required
            value={maintenanceAnnualPercentage}
            onChange={(e) => setMaintenanceAnnualPercentage(e.target.value)}
            className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
          />
        </div>
      </div>

      <div className="pt-1">
        <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Tasa Oportunidad Base (%)</label>
        <input
          type="number"
          step="0.1"
          required
          value={baselineInvestmentReturn}
          onChange={(e) => setBaselineInvestmentReturn(e.target.value)}
          className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
        />
      </div>
    </>
  );
}
