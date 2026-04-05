interface SimulatorDebtVsInvestFieldsProps {
  debtBalance: string;
  setDebtBalance: (v: string) => void;
  debtInterestRateAnnual: string;
  setDebtInterestRateAnnual: (v: string) => void;
  yearsToSimulateDebt: string;
  setYearsToSimulateDebt: (v: string) => void;
  minimumMonthlyPayment: string;
  setMinimumMonthlyPayment: (v: string) => void;
  monthlyExtraCapital: string;
  setMonthlyExtraCapital: (v: string) => void;
  investmentReturnAnnual: string;
  setInvestmentReturnAnnual: (v: string) => void;
}

export function SimulatorDebtVsInvestFields({
  debtBalance,
  setDebtBalance,
  debtInterestRateAnnual,
  setDebtInterestRateAnnual,
  yearsToSimulateDebt,
  setYearsToSimulateDebt,
  minimumMonthlyPayment,
  setMinimumMonthlyPayment,
  monthlyExtraCapital,
  setMonthlyExtraCapital,
  investmentReturnAnnual,
  setInvestmentReturnAnnual,
}: SimulatorDebtVsInvestFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Saldo Deuda</label>
          <div className="relative">
            <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">$</span>
            <input
              type="number"
              required
              value={debtBalance}
              onChange={(e) => setDebtBalance(e.target.value)}
              className="glass-input w-full p-1.5 pl-5 rounded text-[10px] font-bold text-slate-800"
            />
          </div>
        </div>
        <div>
          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Interés EA (%)</label>
          <input
            type="number"
            step="0.1"
            required
            value={debtInterestRateAnnual}
            onChange={(e) => setDebtInterestRateAnnual(e.target.value)}
            className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Años a Simular</label>
          <input
            type="number"
            required
            value={yearsToSimulateDebt}
            onChange={(e) => setYearsToSimulateDebt(e.target.value)}
            className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
          />
        </div>
        <div>
          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Cuota Mínima</label>
          <div className="relative">
            <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">$</span>
            <input
              type="number"
              required
              value={minimumMonthlyPayment}
              onChange={(e) => setMinimumMonthlyPayment(e.target.value)}
              className="glass-input w-full p-1.5 pl-5 rounded text-[10px] font-semibold"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-100 p-2 rounded space-y-2">
        <div>
          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Capital EXTRA Disponible / mes</label>
          <div className="relative">
            <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">$</span>
            <input
              type="number"
              required
              value={monthlyExtraCapital}
              onChange={(e) => setMonthlyExtraCapital(e.target.value)}
              className="glass-input w-full p-1.5 pl-5 rounded text-[10px] font-bold text-emerald-700"
            />
          </div>
        </div>
        <div>
          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Retorno de Inversión (%)</label>
          <input
            type="number"
            step="0.1"
            required
            value={investmentReturnAnnual}
            onChange={(e) => setInvestmentReturnAnnual(e.target.value)}
            className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
          />
        </div>
      </div>
    </>
  );
}
