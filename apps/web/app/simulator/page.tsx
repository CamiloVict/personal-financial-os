'use client';

import React, { useMemo, useState } from 'react';
import {
  useSimulatePropertyPurchase,
  useSimulateDebtVsInvest,
  useSimulateTaxAdvantaged,
  useSimulateBusiness,
  useSimulateCustom,
  useSimulatorSavedLatest,
  useSaveSimulatorSnapshot,
  useDeleteSimulatorSnapshot,
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
  SimulatorSnapshotBar,
  SimulatorFramingBanner,
  SimulatorPresetChips,
} from '@/features/simulator/components';
import {
  applySimulatorSavedInputs,
  collectSimulatorInputs,
} from '@/features/simulator/utils/applySimulatorSavedInputs';
import { ExplanationPanel } from '@/shared/ui/ExplanationPanel';
import { useValuationPresentation } from '@/features/currency/hooks/useValuationPresentation';
import {
  linesFromSimulationResult,
  rowsToMap,
  presentedCurrencyFromRows,
} from '@/features/currency/valuationUtils';
import { useGlobalStore } from '@/shared/store/global';
import { getPropertyPresetValues } from '@/features/simulator/utils/propertyPresets';
import { getDebtPresetValues } from '@/features/simulator/utils/debtPresets';

export default function SimulatorPage() {
  const simProperty = useSimulatePropertyPurchase();
  const simDebt = useSimulateDebtVsInvest();
  const simTax = useSimulateTaxAdvantaged();
  const simBusiness = useSimulateBusiness();
  const simCustom = useSimulateCustom();

  const [activeScenario, setActiveScenario] = useState<ScenarioType>('PROPERTY');
  const [result, setResult] = useState<SimulationResult | null>(null);

  const { data: simSaved, isLoading: simSavedLoading } =
    useSimulatorSavedLatest(activeScenario);
  const saveSimSnapshot = useSaveSimulatorSnapshot();
  const deleteSimSnapshot = useDeleteSimulatorSnapshot();

  const valuationAsOfDate = useGlobalStore((s) => s.valuationAsOfDate);
  const displayValuationMode = useGlobalStore((s) => s.displayValuationMode);

  const simLines = useMemo(
    () => linesFromSimulationResult(result, valuationAsOfDate),
    [result, valuationAsOfDate],
  );

  const { data: simPresRows, isLoading: simPresLoading } = useValuationPresentation(
    simLines,
    simLines.length > 0,
  );

  const simRowMap = useMemo(() => rowsToMap(simPresRows), [simPresRows]);

  const simChartCurrency = presentedCurrencyFromRows(
    simPresRows,
    displayValuationMode,
  );

  const presentedSimYears = useMemo(() => {
    if (!result?.years?.length) return undefined;
    return result.years.map((y) => ({
      year: y.year,
      baselineNetWorth:
        simRowMap.get(`sim-y${y.year}-base`)?.presentedAmount ??
        y.baselineNetWorth,
      scenarioNetWorth:
        simRowMap.get(`sim-y${y.year}-scen`)?.presentedAmount ??
        y.scenarioNetWorth,
    }));
  }, [result, simRowMap]);

  const presentedFinalBaseline =
    result != null
      ? simRowMap.get('sim-final-base')?.presentedAmount ??
        result.finalBaselineNetWorth
      : undefined;
  const presentedFinalScenario =
    result != null
      ? simRowMap.get('sim-final-scen')?.presentedAmount ??
        result.finalScenarioNetWorth
      : undefined;

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

  const simulatorInputState = {
    propertyValue,
    downPayment,
    interestRateAnnual,
    loanTermYears,
    expectedMonthlyRent,
    expectedAnnualAppreciation,
    maintenanceAnnualPercentage,
    baselineInvestmentReturn,
    debtBalance,
    debtInterestRateAnnual,
    minimumMonthlyPayment,
    monthlyExtraCapital,
    investmentReturnAnnual,
    yearsToSimulateDebt,
    monthlyContribution,
    marginalTaxRate,
    taxInvestmentReturnAnnual,
    yearsToSimulateTax,
    initialCapital,
    monthlyOperatingCost,
    expectedMonthlyRevenue,
    passiveMarketReturnAnnual,
    yearsToSimulateBusiness,
    customBaselineInitialCapital,
    customBaselineMonthlyContribution,
    customBaselineAnnualReturn,
    customScenarioInitialCapital,
    customScenarioMonthlyContribution,
    customScenarioAnnualReturn,
    customScenarioAnnualCost,
    customYearsToSimulate,
  };

  const applySavedInputsToForm = (inputs: Record<string, unknown>) => {
    applySimulatorSavedInputs(activeScenario, inputs, {
      setPropertyValue,
      setDownPayment,
      setInterestRateAnnual,
      setLoanTermYears,
      setExpectedMonthlyRent,
      setExpectedAnnualAppreciation,
      setMaintenanceAnnualPercentage,
      setBaselineInvestmentReturn,
      setDebtBalance,
      setDebtInterestRateAnnual,
      setMinimumMonthlyPayment,
      setMonthlyExtraCapital,
      setInvestmentReturnAnnual,
      setYearsToSimulateDebt,
      setMonthlyContribution,
      setMarginalTaxRate,
      setTaxInvestmentReturnAnnual,
      setYearsToSimulateTax,
      setInitialCapital,
      setMonthlyOperatingCost,
      setExpectedMonthlyRevenue,
      setPassiveMarketReturnAnnual,
      setYearsToSimulateBusiness,
      setCustomBaselineInitialCapital,
      setCustomBaselineMonthlyContribution,
      setCustomBaselineAnnualReturn,
      setCustomScenarioInitialCapital,
      setCustomScenarioMonthlyContribution,
      setCustomScenarioAnnualReturn,
      setCustomScenarioAnnualCost,
      setCustomYearsToSimulate,
    });
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <SimulatorPageHeader />

      <SimulatorScenarioTabs activeScenario={activeScenario} onSelect={selectScenario} />

      <SimulatorFramingBanner />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-4 glass-card p-3 rounded-lg shadow-sm self-start">
          <form onSubmit={handleSimulate} className="space-y-2.5">
            {activeScenario === 'PROPERTY' ? (
              <SimulatorPresetChips
                variant="property"
                onSelect={(id) => {
                  const v = getPropertyPresetValues(id);
                  setPropertyValue(v.propertyValue);
                  setDownPayment(v.downPayment);
                  setInterestRateAnnual(v.interestRateAnnual);
                  setLoanTermYears(v.loanTermYears);
                  setExpectedMonthlyRent(v.expectedMonthlyRent);
                  setExpectedAnnualAppreciation(v.expectedAnnualAppreciation);
                  setMaintenanceAnnualPercentage(v.maintenanceAnnualPercentage);
                  setBaselineInvestmentReturn(v.baselineInvestmentReturn);
                }}
              />
            ) : null}
            {activeScenario === 'DEBT_VS_INVEST' ? (
              <SimulatorPresetChips
                variant="debt"
                onSelect={(id) => {
                  const v = getDebtPresetValues(id);
                  setDebtBalance(v.debtBalance);
                  setDebtInterestRateAnnual(v.debtInterestRateAnnual);
                  setMinimumMonthlyPayment(v.minimumMonthlyPayment);
                  setMonthlyExtraCapital(v.monthlyExtraCapital);
                  setInvestmentReturnAnnual(v.investmentReturnAnnual);
                  setYearsToSimulateDebt(v.yearsToSimulateDebt);
                }}
              />
            ) : null}
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

        <div className="lg:col-span-8 space-y-4">
          <SimulatorSnapshotBar
            activeScenario={activeScenario}
            saved={simSaved ?? null}
            savedLoading={simSavedLoading}
            hasResult={Boolean(result)}
            onSave={() => {
              if (!result) return;
              saveSimSnapshot.mutate({
                scenarioType: activeScenario,
                inputs: collectSimulatorInputs(
                  activeScenario,
                  simulatorInputState,
                ),
                result,
              });
            }}
            onRestore={() => {
              if (!simSaved) return;
              applySavedInputsToForm(simSaved.inputs);
              setResult(simSaved.result);
            }}
            onForget={() => deleteSimSnapshot.mutate(activeScenario)}
            isSaving={saveSimSnapshot.isPending}
            isForgetting={deleteSimSnapshot.isPending}
          />
          {!result ? (
            <SimulatorResultsEmpty />
          ) : (
            <SimulatorResultsPanel
              result={result}
              presentedYears={presentedSimYears}
              presentedFinalBaseline={presentedFinalBaseline}
              presentedFinalScenario={presentedFinalScenario}
              chartCurrency={simChartCurrency}
              presentationLoading={simPresLoading && simLines.length > 0}
            />
          )}
          {result ? (
            <ExplanationPanel explanation={result.explanation} defaultOpen={false} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
