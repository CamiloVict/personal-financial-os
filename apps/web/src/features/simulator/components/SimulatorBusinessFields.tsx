interface SimulatorBusinessFieldsProps {
  initialCapital: string;
  setInitialCapital: (v: string) => void;
  monthlyOperatingCost: string;
  setMonthlyOperatingCost: (v: string) => void;
  expectedMonthlyRevenue: string;
  setExpectedMonthlyRevenue: (v: string) => void;
  passiveMarketReturnAnnual: string;
  setPassiveMarketReturnAnnual: (v: string) => void;
  yearsToSimulateBusiness: string;
  setYearsToSimulateBusiness: (v: string) => void;
}

export function SimulatorBusinessFields({
  initialCapital,
  setInitialCapital,
  monthlyOperatingCost,
  setMonthlyOperatingCost,
  expectedMonthlyRevenue,
  setExpectedMonthlyRevenue,
  passiveMarketReturnAnnual,
  setPassiveMarketReturnAnnual,
  yearsToSimulateBusiness,
  setYearsToSimulateBusiness,
}: SimulatorBusinessFieldsProps) {
  return (
    <>
      <div>
        <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Capital Inicial a Invertir</label>
        <div className="relative">
          <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">$</span>
          <input
            type="number"
            required
            value={initialCapital}
            onChange={(e) => setInitialCapital(e.target.value)}
            className="glass-input w-full p-1.5 pl-5 rounded text-[10px] font-bold text-slate-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Costos Mensuales</label>
          <div className="relative">
            <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">$</span>
            <input
              type="number"
              required
              value={monthlyOperatingCost}
              onChange={(e) => setMonthlyOperatingCost(e.target.value)}
              className="glass-input w-full p-1.5 pl-5 rounded text-[10px] font-semibold"
            />
          </div>
        </div>
        <div>
          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Ventas Mensuales</label>
          <div className="relative">
            <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">$</span>
            <input
              type="number"
              required
              value={expectedMonthlyRevenue}
              onChange={(e) => setExpectedMonthlyRevenue(e.target.value)}
              className="glass-input w-full p-1.5 pl-5 rounded text-[10px] font-semibold"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Retorno Mercado (%)</label>
          <input
            type="number"
            step="0.1"
            required
            value={passiveMarketReturnAnnual}
            onChange={(e) => setPassiveMarketReturnAnnual(e.target.value)}
            className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
          />
        </div>
        <div>
          <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Años a Simular</label>
          <input
            type="number"
            required
            value={yearsToSimulateBusiness}
            onChange={(e) => setYearsToSimulateBusiness(e.target.value)}
            className="glass-input w-full p-1.5 rounded text-[10px] font-semibold"
          />
        </div>
      </div>
    </>
  );
}
