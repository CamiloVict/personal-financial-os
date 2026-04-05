'use client';
import React, { useState } from 'react';
import { Sparkles, Activity, Home, TrendingUp, TrendingDown, Percent, Landmark, ArrowRight, Wallet, Briefcase, CreditCard, Settings2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useGlobalStore } from '@/shared/store/global';
import { 
  useSimulatePropertyPurchase,
  useSimulateDebtVsInvest,
  useSimulateTaxAdvantaged,
  useSimulateBusiness,
  useSimulateCustom
} from '@/features/simulator/api/queries';

type ScenarioType = 'PROPERTY' | 'DEBT_VS_INVEST' | 'TAX_ADVANTAGED' | 'BUSINESS' | 'CUSTOM';

export default function SimulatorPage() {
  const { currentUserId } = useGlobalStore();
  
  // Mutations
  const simProperty = useSimulatePropertyPurchase(currentUserId);
  const simDebt = useSimulateDebtVsInvest(currentUserId);
  const simTax = useSimulateTaxAdvantaged(currentUserId);
  const simBusiness = useSimulateBusiness(currentUserId);
  const simCustom = useSimulateCustom(currentUserId);
  
  const [activeScenario, setActiveScenario] = useState<ScenarioType>('PROPERTY');
  const [result, setResult] = useState<any>(null);

  // Property Inputs
  const [propertyValue, setPropertyValue] = useState('500000000');
  const [downPayment, setDownPayment] = useState('150000000');
  const [interestRateAnnual, setInterestRateAnnual] = useState('12');
  const [loanTermYears, setLoanTermYears] = useState('15');
  const [expectedMonthlyRent, setExpectedMonthlyRent] = useState('2500000');
  const [expectedAnnualAppreciation, setExpectedAnnualAppreciation] = useState('5');
  const [maintenanceAnnualPercentage, setMaintenanceAnnualPercentage] = useState('1');
  const [baselineInvestmentReturn, setBaselineInvestmentReturn] = useState('8');

  // Debt Vs Invest Inputs
  const [debtBalance, setDebtBalance] = useState('50000000');
  const [debtInterestRateAnnual, setDebtInterestRateAnnual] = useState('28');
  const [minimumMonthlyPayment, setMinimumMonthlyPayment] = useState('1500000');
  const [monthlyExtraCapital, setMonthlyExtraCapital] = useState('1000000');
  const [investmentReturnAnnual, setInvestmentReturnAnnual] = useState('10');
  const [yearsToSimulateDebt, setYearsToSimulateDebt] = useState('10');

  // Tax Advantaged Inputs
  const [monthlyContribution, setMonthlyContribution] = useState('2000000');
  const [marginalTaxRate, setMarginalTaxRate] = useState('35');
  const [taxInvestmentReturnAnnual, setTaxInvestmentReturnAnnual] = useState('8');
  const [yearsToSimulateTax, setYearsToSimulateTax] = useState('15');

  // Business Inputs
  const [initialCapital, setInitialCapital] = useState('30000000');
  const [monthlyOperatingCost, setMonthlyOperatingCost] = useState('2000000');
  const [expectedMonthlyRevenue, setExpectedMonthlyRevenue] = useState('4000000');
  const [passiveMarketReturnAnnual, setPassiveMarketReturnAnnual] = useState('10');
  const [yearsToSimulateBusiness, setYearsToSimulateBusiness] = useState('5');

  // Custom Inputs
  const [customBaselineInitialCapital, setCustomBaselineInitialCapital] = useState('10000000');
  const [customBaselineMonthlyContribution, setCustomBaselineMonthlyContribution] = useState('500000');
  const [customBaselineAnnualReturn, setCustomBaselineAnnualReturn] = useState('8');
  
  const [customScenarioInitialCapital, setCustomScenarioInitialCapital] = useState('10000000');
  const [customScenarioMonthlyContribution, setCustomScenarioMonthlyContribution] = useState('500000');
  const [customScenarioAnnualReturn, setCustomScenarioAnnualReturn] = useState('12');
  const [customScenarioAnnualCost, setCustomScenarioAnnualCost] = useState('2');
  const [customYearsToSimulate, setCustomYearsToSimulate] = useState('10');

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeScenario === 'PROPERTY') {
      simProperty.mutate({
        propertyValue: Number(propertyValue), downPayment: Number(downPayment),
        interestRateAnnual: Number(interestRateAnnual), loanTermYears: Number(loanTermYears),
        expectedMonthlyRent: Number(expectedMonthlyRent), expectedAnnualAppreciation: Number(expectedAnnualAppreciation),
        maintenanceAnnualPercentage: Number(maintenanceAnnualPercentage), baselineInvestmentReturn: Number(baselineInvestmentReturn)
      }, { onSuccess: (data) => setResult(data) });
    } else if (activeScenario === 'DEBT_VS_INVEST') {
      simDebt.mutate({
        debtBalance: Number(debtBalance), debtInterestRateAnnual: Number(debtInterestRateAnnual),
        minimumMonthlyPayment: Number(minimumMonthlyPayment), monthlyExtraCapital: Number(monthlyExtraCapital),
        investmentReturnAnnual: Number(investmentReturnAnnual), yearsToSimulate: Number(yearsToSimulateDebt)
      }, { onSuccess: (data) => setResult(data) });
    } else if (activeScenario === 'TAX_ADVANTAGED') {
      simTax.mutate({
        monthlyContribution: Number(monthlyContribution), marginalTaxRate: Number(marginalTaxRate),
        investmentReturnAnnual: Number(taxInvestmentReturnAnnual), yearsToSimulate: Number(yearsToSimulateTax)
      }, { onSuccess: (data) => setResult(data) });
    } else if (activeScenario === 'BUSINESS') {
      simBusiness.mutate({
        initialCapital: Number(initialCapital), monthlyOperatingCost: Number(monthlyOperatingCost),
        expectedMonthlyRevenue: Number(expectedMonthlyRevenue), passiveMarketReturnAnnual: Number(passiveMarketReturnAnnual),
        yearsToSimulate: Number(yearsToSimulateBusiness)
      }, { onSuccess: (data) => setResult(data) });
    } else if (activeScenario === 'CUSTOM') {
      simCustom.mutate({
        baselineInitialCapital: Number(customBaselineInitialCapital),
        baselineMonthlyContribution: Number(customBaselineMonthlyContribution),
        baselineAnnualReturn: Number(customBaselineAnnualReturn),
        scenarioInitialCapital: Number(customScenarioInitialCapital),
        scenarioMonthlyContribution: Number(customScenarioMonthlyContribution),
        scenarioAnnualReturn: Number(customScenarioAnnualReturn),
        scenarioAnnualCost: Number(customScenarioAnnualCost),
        yearsToSimulate: Number(customYearsToSimulate)
      }, { onSuccess: (data) => setResult(data) });
    }
  };

  const isPending = simProperty.isPending || simDebt.isPending || simTax.isPending || simBusiness.isPending || simCustom.isPending;

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <header className="flex justify-between items-end border-b border-slate-200/50 pb-2 mb-2">
        <div>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <div className="p-1 bg-amber-100 rounded-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            </div>
            La Máquina del Tiempo Financiera
          </h1>
          <p className="text-slate-500 mt-1 text-[10px] leading-relaxed max-w-3xl">
            Simula escenarios hipotéticos y descubre su impacto real a largo plazo. 
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
        <button onClick={() => {setActiveScenario('PROPERTY'); setResult(null);}} className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[10px] transition-all whitespace-nowrap ${activeScenario === 'PROPERTY' ? 'bg-slate-900 text-white shadow-sm' : 'glass-card text-slate-600 hover:bg-slate-50'}`}>
          <Home className="w-3 h-3" /> Propiedad
        </button>
        <button onClick={() => {setActiveScenario('DEBT_VS_INVEST'); setResult(null);}} className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[10px] transition-all whitespace-nowrap ${activeScenario === 'DEBT_VS_INVEST' ? 'bg-slate-900 text-white shadow-sm' : 'glass-card text-slate-600 hover:bg-slate-50'}`}>
          <CreditCard className="w-3 h-3" /> Deuda vs Invertir
        </button>
        <button onClick={() => {setActiveScenario('TAX_ADVANTAGED'); setResult(null);}} className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[10px] transition-all whitespace-nowrap ${activeScenario === 'TAX_ADVANTAGED' ? 'bg-slate-900 text-white shadow-sm' : 'glass-card text-slate-600 hover:bg-slate-50'}`}>
          <Landmark className="w-3 h-3" /> Exentas (AFC/FPV)
        </button>
        <button onClick={() => {setActiveScenario('BUSINESS'); setResult(null);}} className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[10px] transition-all whitespace-nowrap ${activeScenario === 'BUSINESS' ? 'bg-slate-900 text-white shadow-sm' : 'glass-card text-slate-600 hover:bg-slate-50'}`}>
          <Briefcase className="w-3 h-3" /> Negocio vs Pasividad
        </button>
        <button onClick={() => {setActiveScenario('CUSTOM'); setResult(null);}} className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[10px] transition-all whitespace-nowrap ${activeScenario === 'CUSTOM' ? 'bg-slate-900 text-white shadow-sm' : 'glass-card text-slate-600 hover:bg-slate-50'}`}>
          <Settings2 className="w-3 h-3" /> Personalizado (Otro)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* FORM / INPUTS */}
        <div className="lg:col-span-4 glass-card p-3 rounded-lg shadow-sm self-start">
          <form onSubmit={handleSimulate} className="space-y-2.5">
            
            {activeScenario === 'PROPERTY' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Valor Propiedad</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">$</span>
                      <input type="number" required value={propertyValue} onChange={e => setPropertyValue(e.target.value)} className="glass-input w-full p-1.5 pl-5 rounded text-[10px] font-bold text-slate-800" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Cuota Inicial</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">$</span>
                      <input type="number" required value={downPayment} onChange={e => setDownPayment(e.target.value)} className="glass-input w-full p-1.5 pl-5 rounded text-[10px] font-semibold" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Arriendo Mensual Esperado</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">$</span>
                    <input type="number" required value={expectedMonthlyRent} onChange={e => setExpectedMonthlyRent(e.target.value)} className="glass-input w-full p-1.5 pl-5 rounded text-[10px] font-semibold" />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-2 rounded flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Tasa E.A Crédito(%)</label>
                    <input type="number" step="0.1" required value={interestRateAnnual} onChange={e => setInterestRateAnnual(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Plazo (Años)</label>
                    <input type="number" required value={loanTermYears} onChange={e => setLoanTermYears(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Valorización (%)</label>
                    <input type="number" step="0.1" required value={expectedAnnualAppreciation} onChange={e => setExpectedAnnualAppreciation(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Mantenimiento (%)</label>
                    <input type="number" step="0.1" required value={maintenanceAnnualPercentage} onChange={e => setMaintenanceAnnualPercentage(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Tasa Oportunidad Base (%)</label>
                  <input type="number" step="0.1" required value={baselineInvestmentReturn} onChange={e => setBaselineInvestmentReturn(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                </div>
              </>
            )}

            {activeScenario === 'DEBT_VS_INVEST' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Saldo Deuda</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">$</span>
                      <input type="number" required value={debtBalance} onChange={e => setDebtBalance(e.target.value)} className="glass-input w-full p-1.5 pl-5 rounded text-[10px] font-bold text-slate-800" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Interés EA (%)</label>
                    <input type="number" step="0.1" required value={debtInterestRateAnnual} onChange={e => setDebtInterestRateAnnual(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Años a Simular</label>
                    <input type="number" required value={yearsToSimulateDebt} onChange={e => setYearsToSimulateDebt(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Cuota Mínima</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">$</span>
                      <input type="number" required value={minimumMonthlyPayment} onChange={e => setMinimumMonthlyPayment(e.target.value)} className="glass-input w-full p-1.5 pl-5 rounded text-[10px] font-semibold" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-2 rounded space-y-2">
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Capital EXTRA Disponible / mes</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">$</span>
                      <input type="number" required value={monthlyExtraCapital} onChange={e => setMonthlyExtraCapital(e.target.value)} className="glass-input w-full p-1.5 pl-5 rounded text-[10px] font-bold text-emerald-700" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Retorno de Inversión (%)</label>
                    <input type="number" step="0.1" required value={investmentReturnAnnual} onChange={e => setInvestmentReturnAnnual(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                  </div>
                </div>
              </>
            )}

            {activeScenario === 'TAX_ADVANTAGED' && (
              <>
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Aporte Mensual</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">$</span>
                    <input type="number" required value={monthlyContribution} onChange={e => setMonthlyContribution(e.target.value)} className="glass-input w-full p-1.5 pl-5 rounded text-[10px] font-bold text-slate-800" />
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Retorno Inversión Anual (%)</label>
                  <input type="number" step="0.1" required value={taxInvestmentReturnAnnual} onChange={e => setTaxInvestmentReturnAnnual(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Tasa Impuestos (%)</label>
                    <input type="number" step="0.1" required value={marginalTaxRate} onChange={e => setMarginalTaxRate(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Años Simulación</label>
                    <input type="number" required value={yearsToSimulateTax} onChange={e => setYearsToSimulateTax(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                  </div>
                </div>
              </>
            )}

            {activeScenario === 'BUSINESS' && (
              <>
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Capital Inicial a Invertir</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">$</span>
                    <input type="number" required value={initialCapital} onChange={e => setInitialCapital(e.target.value)} className="glass-input w-full p-1.5 pl-5 rounded text-[10px] font-bold text-slate-800" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Costos Mensuales</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">$</span>
                      <input type="number" required value={monthlyOperatingCost} onChange={e => setMonthlyOperatingCost(e.target.value)} className="glass-input w-full p-1.5 pl-5 rounded text-[10px] font-semibold" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Ventas Mensuales</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">$</span>
                      <input type="number" required value={expectedMonthlyRevenue} onChange={e => setExpectedMonthlyRevenue(e.target.value)} className="glass-input w-full p-1.5 pl-5 rounded text-[10px] font-semibold" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Retorno Mercado (%)</label>
                    <input type="number" step="0.1" required value={passiveMarketReturnAnnual} onChange={e => setPassiveMarketReturnAnnual(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Años a Simular</label>
                    <input type="number" required value={yearsToSimulateBusiness} onChange={e => setYearsToSimulateBusiness(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                  </div>
                </div>
              </>
            )}

            {activeScenario === 'CUSTOM' && (
              <>
                <div className="bg-slate-50 border border-slate-100 p-2 rounded">
                  <h3 className="text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Línea Base (Opción A)</h3>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Capital Inicial</label>
                      <input type="number" required value={customBaselineInitialCapital} onChange={e => setCustomBaselineInitialCapital(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Aporte Mensual</label>
                      <input type="number" required value={customBaselineMonthlyContribution} onChange={e => setCustomBaselineMonthlyContribution(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Retorno Anual (%)</label>
                    <input type="number" step="0.1" required value={customBaselineAnnualReturn} onChange={e => setCustomBaselineAnnualReturn(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-2 rounded">
                  <h3 className="text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Escenario Propuesto (Opción B)</h3>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Capital Inicial</label>
                      <input type="number" required value={customScenarioInitialCapital} onChange={e => setCustomScenarioInitialCapital(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Aporte Mensual</label>
                      <input type="number" required value={customScenarioMonthlyContribution} onChange={e => setCustomScenarioMonthlyContribution(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Retorno Anual (%)</label>
                      <input type="number" step="0.1" required value={customScenarioAnnualReturn} onChange={e => setCustomScenarioAnnualReturn(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Costo Anual (%)</label>
                      <input type="number" step="0.1" required value={customScenarioAnnualCost} onChange={e => setCustomScenarioAnnualCost(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Años a Simular</label>
                  <input type="number" required value={customYearsToSimulate} onChange={e => setCustomYearsToSimulate(e.target.value)} className="glass-input w-full p-1.5 rounded text-[10px] font-semibold" />
                </div>
              </>
            )}

            <button 
              type="submit" 
              disabled={isPending}
              className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white p-1.5 rounded font-bold flex justify-center items-center gap-1.5 transition-all shadow-sm text-[10px]"
            >
              {isPending ? <Activity className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {isPending ? 'Simulando...' : 'Simular Impacto'}
            </button>

          </form>
        </div>

        {/* RESULTS AREA */}
        <div className="lg:col-span-8">
          
          {!result ? (
            <div className="glass-card border-dashed border-slate-300 p-8 rounded-lg text-center text-slate-500 flex flex-col items-center gap-1.5 h-full justify-center">
              <Sparkles className="w-6 h-6 text-slate-300" />
              <div>
                <p className="font-bold text-xs text-slate-700">El futuro no está escrito</p>
                <p className="text-[9px] mt-0.5 max-w-sm mx-auto leading-relaxed">Ingresa los datos de tu escenario hipotético en el panel izquierdo para simular su impacto a largo plazo.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 animate-in slide-in-from-right-8 duration-500 h-full flex flex-col">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className={`glass-card p-2 rounded-lg border border-slate-200 shadow-sm bg-white`}>
                  <h3 className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">Veredicto</h3>
                  <p className={`text-[10px] font-bold tracking-tight text-slate-800 leading-snug`}>
                    {result.primaryInsight}
                  </p>
                </div>

                <div className="glass-card p-2 rounded-lg border border-slate-200 shadow-sm bg-white">
                  <h3 className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">Impacto Secundario</h3>
                  <p className="text-[10px] font-medium text-slate-700 leading-snug">{result.secondaryInsight}</p>
                </div>

                <div className={`glass-card p-2 rounded-lg border border-slate-200 shadow-sm bg-white`}>
                  <h3 className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">Detalle</h3>
                  <p className="text-[10px] font-medium text-slate-600 leading-snug">{result.tertiaryInsight}</p>
                </div>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-2">
                {result.metrics?.map((m: any, i: number) => (
                  <div key={i} className={`bg-${m.color}-50 border border-${m.color}-200 p-1.5 rounded-md text-center`}>
                    <p className={`text-[7px] font-bold text-${m.color}-600 uppercase tracking-wider mb-0.5`}>{m.label}</p>
                    <p className={`text-sm font-black text-${m.color}-700`}>{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="glass-card p-3 rounded-lg shadow-sm flex-1 flex flex-col bg-white">
                <h3 className="text-xs font-bold text-slate-800 mb-0.5">Crecimiento del Patrimonio Neto</h3>
                <p className="text-[8px] text-slate-500 mb-2">Línea Amarilla (Escenario Acción) vs Línea Gris (Línea Base / Inacción).</p>
                
                <div className="flex-1 min-h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.years} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 8}} tickFormatter={(val) => `A${val}`} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 8}} tickFormatter={(val) => `$${(val/1000000).toFixed(0)}M`} />
                      <Tooltip 
                        formatter={(value: any, name: any) => [`$${Number(value).toLocaleString()}`, name === 'scenarioNetWorth' ? 'Escenario Acción' : 'Línea Base']}
                        labelFormatter={(label) => `Año ${label}`}
                        contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '9px', padding: '4px 8px' }}
                      />
                      <Legend wrapperStyle={{fontSize: '9px', paddingTop: '0px'}} iconSize={8} />
                      <Line type="monotone" dataKey="baselineNetWorth" name="Línea Base" stroke="#cbd5e1" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="scenarioNetWorth" name="Escenario Acción" stroke="#f59e0b" strokeWidth={2} dot={{r: 1.5, strokeWidth: 1}} activeDot={{r: 3}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
                  <div className="text-slate-600 font-medium">Final Base: <strong className="text-slate-900">${result.finalBaselineNetWorth.toLocaleString()}</strong></div>
                  <div className="text-slate-600 font-medium">Final Acción: <strong className="text-amber-600">${result.finalScenarioNetWorth.toLocaleString()}</strong></div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}