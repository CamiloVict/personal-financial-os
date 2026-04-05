'use client';

import React, { useState } from 'react';
import {
  useSimulatePropertyPurchase,
  useSimulateDebtVsInvest,
  useSimulateTaxAdvantaged,
  useSimulateBusiness,
  useSimulateCustom,
} from '@/features/simulator/api/queries';
import type { ScenarioType, SimulationResult } from '@/features/simulator/types';
import {
  SimulatorPageHeader,
  SimulatorScenarioTabs,
  SimulatorPropertyFields,
  SimulatorDebtVsInvestFields,
  SimulatorTaxAdvantagedFields,
  SimulatorBusinessFields,
  SimulatorCustomFields,
  SimulatorFormSubmit,
  SimulatorResultsEmpty,
  SimulatorResultsPanel,
} from '@/features/simulator/components';

export default function SimulatorPage() {
  const simProperty = useSimulatePropertyPurchase();
  const simDebt = useSimulateDebtVsInvest();
  const simTax = useSimulateTaxAdvantaged();
  const simBusiness = useSimulateBusiness();
  const simCustom = useSimulateCustom();

  const [activeScenario, setActiveScenario] = useState<ScenarioType>('PROPERTY');
  const [result, setResult] = useState<SimulationResult | null>(null);

  const [propertyValue, setPropertyValue] = useState('500000000');
  const [downPayment, setDownPayment] = useState('150000000');
  const [interestRateAnnual, setInterestRateAnnual] = useState('12');
  const [loanTermYears, setLoanTermYears] = useState('15');
  const [expectedMonthlyRent, setExpectedMonthlyRent] = useState('2500000');
  const [expectedAnnualAppreciation, setExpectedAnnualAppreciation] = useState('5');
  const [maintenanceAnnualPercentage, setMaintenanceAnnualPercentage] = useState('1');
  const [baselineInvestmentReturn, setBaselineInvestmentReturn] = useState('8');

  const [debtBalance, setDebtBalance] = useState('50000000');
  const [debtInterestRateAnnual, setDebtInterestRateAnnual] = useState('28');
  const [minimumMonthlyPayment, setMinimumMonthlyPayment] = useState('1500000');
  const [monthlyExtraCapital, setMonthlyExtraCapital] = useState('1000000');
  const [investmentReturnAnnual, setInvestmentReturnAnnual] = useState('10');
  const [yearsToSimulateDebt, setYearsToSimulateDebt] = useState('10');

  const [monthlyContribution, setMonthlyContribution] = useState('2000000');
  const [marginalTaxRate, setMarginalTaxRate] = useState('35');
  const [taxInvestmentReturnAnnual, setTaxInvestmentReturnAnnual] = useState('8');
  const [yearsToSimulateTax, setYearsToSimulateTax] = useState('15');

  const [initialCapital, setInitialCapital] = useState('30000000');
  const [monthlyOperatingCost, setMonthlyOperatingCost] = useState('2000000');
  const [expectedMonthlyRevenue, setExpectedMonthlyRevenue] = useState('4000000');
  const [passiveMarketReturnAnnual, setPassiveMarketReturnAnnual] = useState('10');
  const [yearsToSimulateBusiness, setYearsToSimulateBusiness] = useState('5');

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
    const onSuccess = (data: SimulationResult) => setResult(data);

    if (activeScenario === 'PROPERTY') {
      simProperty.mutate(
        {
          propertyValue: Number(propertyValue),
          downPayment: Number(downPayment),
          interestRateAnnual: Number(interestRateAnnual),
          loanTermYears: Number(loanTermYears),
          expectedMonthlyRent: Number(expectedMonthlyRent),
          expectedAnnualAppreciation: Number(expectedAnnualAppreciation),
          maintenanceAnnualPercentage: Number(maintenanceAnnualPercentage),
          baselineInvestmentReturn: Number(baselineInvestmentReturn),
        },
        { onSuccess },
      );
    } else if (activeScenario === 'DEBT_VS_INVEST') {
      simDebt.mutate(
        {
          debtBalance: Number(debtBalance),
          debtInterestRateAnnual: Number(debtInterestRateAnnual),
          minimumMonthlyPayment: Number(minimumMonthlyPayment),
          monthlyExtraCapital: Number(monthlyExtraCapital),
          investmentReturnAnnual: Number(investmentReturnAnnual),
          yearsToSimulate: Number(yearsToSimulateDebt),
        },
        { onSuccess },
      );
    } else if (activeScenario === 'TAX_ADVANTAGED') {
      simTax.mutate(
        {
          monthlyContribution: Number(monthlyContribution),
          marginalTaxRate: Number(marginalTaxRate),
          investmentReturnAnnual: Number(taxInvestmentReturnAnnual),
          yearsToSimulate: Number(yearsToSimulateTax),
        },
        { onSuccess },
      );
    } else if (activeScenario === 'BUSINESS') {
      simBusiness.mutate(
        {
          initialCapital: Number(initialCapital),
          monthlyOperatingCost: Number(monthlyOperatingCost),
          expectedMonthlyRevenue: Number(expectedMonthlyRevenue),
          passiveMarketReturnAnnual: Number(passiveMarketReturnAnnual),
          yearsToSimulate: Number(yearsToSimulateBusiness),
        },
        { onSuccess },
      );
    } else if (activeScenario === 'CUSTOM') {
      simCustom.mutate(
        {
          baselineInitialCapital: Number(customBaselineInitialCapital),
          baselineMonthlyContribution: Number(customBaselineMonthlyContribution),
          baselineAnnualReturn: Number(customBaselineAnnualReturn),
          scenarioInitialCapital: Number(customScenarioInitialCapital),
          scenarioMonthlyContribution: Number(customScenarioMonthlyContribution),
          scenarioAnnualReturn: Number(customScenarioAnnualReturn),
          scenarioAnnualCost: Number(customScenarioAnnualCost),
          yearsToSimulate: Number(customYearsToSimulate),
        },
        { onSuccess },
      );
    }
  };

  const isPending =
    simProperty.isPending ||
    simDebt.isPending ||
    simTax.isPending ||
    simBusiness.isPending ||
    simCustom.isPending;

  const selectScenario = (scenario: ScenarioType) => {
    setActiveScenario(scenario);
    setResult(null);
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <SimulatorPageHeader />

      <SimulatorScenarioTabs activeScenario={activeScenario} onSelect={selectScenario} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-4 glass-card p-3 rounded-lg shadow-sm self-start">
          <form onSubmit={handleSimulate} className="space-y-2.5">
            {activeScenario === 'PROPERTY' && (
              <SimulatorPropertyFields
                propertyValue={propertyValue}
                setPropertyValue={setPropertyValue}
                downPayment={downPayment}
                setDownPayment={setDownPayment}
                expectedMonthlyRent={expectedMonthlyRent}
                setExpectedMonthlyRent={setExpectedMonthlyRent}
                interestRateAnnual={interestRateAnnual}
                setInterestRateAnnual={setInterestRateAnnual}
                loanTermYears={loanTermYears}
                setLoanTermYears={setLoanTermYears}
                expectedAnnualAppreciation={expectedAnnualAppreciation}
                setExpectedAnnualAppreciation={setExpectedAnnualAppreciation}
                maintenanceAnnualPercentage={maintenanceAnnualPercentage}
                setMaintenanceAnnualPercentage={setMaintenanceAnnualPercentage}
                baselineInvestmentReturn={baselineInvestmentReturn}
                setBaselineInvestmentReturn={setBaselineInvestmentReturn}
              />
            )}

            {activeScenario === 'DEBT_VS_INVEST' && (
              <SimulatorDebtVsInvestFields
                debtBalance={debtBalance}
                setDebtBalance={setDebtBalance}
                debtInterestRateAnnual={debtInterestRateAnnual}
                setDebtInterestRateAnnual={setDebtInterestRateAnnual}
                yearsToSimulateDebt={yearsToSimulateDebt}
                setYearsToSimulateDebt={setYearsToSimulateDebt}
                minimumMonthlyPayment={minimumMonthlyPayment}
                setMinimumMonthlyPayment={setMinimumMonthlyPayment}
                monthlyExtraCapital={monthlyExtraCapital}
                setMonthlyExtraCapital={setMonthlyExtraCapital}
                investmentReturnAnnual={investmentReturnAnnual}
                setInvestmentReturnAnnual={setInvestmentReturnAnnual}
              />
            )}

            {activeScenario === 'TAX_ADVANTAGED' && (
              <SimulatorTaxAdvantagedFields
                monthlyContribution={monthlyContribution}
                setMonthlyContribution={setMonthlyContribution}
                taxInvestmentReturnAnnual={taxInvestmentReturnAnnual}
                setTaxInvestmentReturnAnnual={setTaxInvestmentReturnAnnual}
                marginalTaxRate={marginalTaxRate}
                setMarginalTaxRate={setMarginalTaxRate}
                yearsToSimulateTax={yearsToSimulateTax}
                setYearsToSimulateTax={setYearsToSimulateTax}
              />
            )}

            {activeScenario === 'BUSINESS' && (
              <SimulatorBusinessFields
                initialCapital={initialCapital}
                setInitialCapital={setInitialCapital}
                monthlyOperatingCost={monthlyOperatingCost}
                setMonthlyOperatingCost={setMonthlyOperatingCost}
                expectedMonthlyRevenue={expectedMonthlyRevenue}
                setExpectedMonthlyRevenue={setExpectedMonthlyRevenue}
                passiveMarketReturnAnnual={passiveMarketReturnAnnual}
                setPassiveMarketReturnAnnual={setPassiveMarketReturnAnnual}
                yearsToSimulateBusiness={yearsToSimulateBusiness}
                setYearsToSimulateBusiness={setYearsToSimulateBusiness}
              />
            )}

            {activeScenario === 'CUSTOM' && (
              <SimulatorCustomFields
                customBaselineInitialCapital={customBaselineInitialCapital}
                setCustomBaselineInitialCapital={setCustomBaselineInitialCapital}
                customBaselineMonthlyContribution={customBaselineMonthlyContribution}
                setCustomBaselineMonthlyContribution={setCustomBaselineMonthlyContribution}
                customBaselineAnnualReturn={customBaselineAnnualReturn}
                setCustomBaselineAnnualReturn={setCustomBaselineAnnualReturn}
                customScenarioInitialCapital={customScenarioInitialCapital}
                setCustomScenarioInitialCapital={setCustomScenarioInitialCapital}
                customScenarioMonthlyContribution={customScenarioMonthlyContribution}
                setCustomScenarioMonthlyContribution={setCustomScenarioMonthlyContribution}
                customScenarioAnnualReturn={customScenarioAnnualReturn}
                setCustomScenarioAnnualReturn={setCustomScenarioAnnualReturn}
                customScenarioAnnualCost={customScenarioAnnualCost}
                setCustomScenarioAnnualCost={setCustomScenarioAnnualCost}
                customYearsToSimulate={customYearsToSimulate}
                setCustomYearsToSimulate={setCustomYearsToSimulate}
              />
            )}

            <SimulatorFormSubmit isPending={isPending} />
          </form>
        </div>

        <div className="lg:col-span-8">
          {!result ? <SimulatorResultsEmpty /> : <SimulatorResultsPanel result={result} />}
        </div>
      </div>
    </div>
  );
}
