import type { ScenarioType } from '../types';

export type SimulatorInputSetters = {
  setPropertyValue: (v: string) => void;
  setDownPayment: (v: string) => void;
  setInterestRateAnnual: (v: string) => void;
  setLoanTermYears: (v: string) => void;
  setExpectedMonthlyRent: (v: string) => void;
  setExpectedAnnualAppreciation: (v: string) => void;
  setMaintenanceAnnualPercentage: (v: string) => void;
  setBaselineInvestmentReturn: (v: string) => void;
  setDebtBalance: (v: string) => void;
  setDebtInterestRateAnnual: (v: string) => void;
  setMinimumMonthlyPayment: (v: string) => void;
  setMonthlyExtraCapital: (v: string) => void;
  setInvestmentReturnAnnual: (v: string) => void;
  setYearsToSimulateDebt: (v: string) => void;
  setMonthlyContribution: (v: string) => void;
  setMarginalTaxRate: (v: string) => void;
  setTaxInvestmentReturnAnnual: (v: string) => void;
  setYearsToSimulateTax: (v: string) => void;
  setInitialCapital: (v: string) => void;
  setMonthlyOperatingCost: (v: string) => void;
  setExpectedMonthlyRevenue: (v: string) => void;
  setPassiveMarketReturnAnnual: (v: string) => void;
  setYearsToSimulateBusiness: (v: string) => void;
  setCustomBaselineInitialCapital: (v: string) => void;
  setCustomBaselineMonthlyContribution: (v: string) => void;
  setCustomBaselineAnnualReturn: (v: string) => void;
  setCustomScenarioInitialCapital: (v: string) => void;
  setCustomScenarioMonthlyContribution: (v: string) => void;
  setCustomScenarioAnnualReturn: (v: string) => void;
  setCustomScenarioAnnualCost: (v: string) => void;
  setCustomYearsToSimulate: (v: string) => void;
};

function str(x: unknown): string {
  return x === undefined || x === null ? '' : String(x);
}

/** Rellena el formulario del simulador desde el JSON guardado en servidor. */
export function applySimulatorSavedInputs(
  scenarioType: ScenarioType,
  inputs: Record<string, unknown>,
  s: SimulatorInputSetters,
): void {
  switch (scenarioType) {
    case 'PROPERTY':
      s.setPropertyValue(str(inputs.propertyValue));
      s.setDownPayment(str(inputs.downPayment));
      s.setInterestRateAnnual(str(inputs.interestRateAnnual));
      s.setLoanTermYears(str(inputs.loanTermYears));
      s.setExpectedMonthlyRent(str(inputs.expectedMonthlyRent));
      s.setExpectedAnnualAppreciation(str(inputs.expectedAnnualAppreciation));
      s.setMaintenanceAnnualPercentage(str(inputs.maintenanceAnnualPercentage));
      s.setBaselineInvestmentReturn(str(inputs.baselineInvestmentReturn));
      break;
    case 'DEBT_VS_INVEST':
      s.setDebtBalance(str(inputs.debtBalance));
      s.setDebtInterestRateAnnual(str(inputs.debtInterestRateAnnual));
      s.setMinimumMonthlyPayment(str(inputs.minimumMonthlyPayment));
      s.setMonthlyExtraCapital(str(inputs.monthlyExtraCapital));
      s.setInvestmentReturnAnnual(str(inputs.investmentReturnAnnual));
      s.setYearsToSimulateDebt(str(inputs.yearsToSimulate));
      break;
    case 'TAX_ADVANTAGED':
      s.setMonthlyContribution(str(inputs.monthlyContribution));
      s.setMarginalTaxRate(str(inputs.marginalTaxRate));
      s.setTaxInvestmentReturnAnnual(str(inputs.investmentReturnAnnual));
      s.setYearsToSimulateTax(str(inputs.yearsToSimulate));
      break;
    case 'BUSINESS':
      s.setInitialCapital(str(inputs.initialCapital));
      s.setMonthlyOperatingCost(str(inputs.monthlyOperatingCost));
      s.setExpectedMonthlyRevenue(str(inputs.expectedMonthlyRevenue));
      s.setPassiveMarketReturnAnnual(str(inputs.passiveMarketReturnAnnual));
      s.setYearsToSimulateBusiness(str(inputs.yearsToSimulate));
      break;
    case 'CUSTOM':
      s.setCustomBaselineInitialCapital(str(inputs.baselineInitialCapital));
      s.setCustomBaselineMonthlyContribution(str(inputs.baselineMonthlyContribution));
      s.setCustomBaselineAnnualReturn(str(inputs.baselineAnnualReturn));
      s.setCustomScenarioInitialCapital(str(inputs.scenarioInitialCapital));
      s.setCustomScenarioMonthlyContribution(str(inputs.scenarioMonthlyContribution));
      s.setCustomScenarioAnnualReturn(str(inputs.scenarioAnnualReturn));
      s.setCustomScenarioAnnualCost(str(inputs.scenarioAnnualCost));
      s.setCustomYearsToSimulate(str(inputs.yearsToSimulate));
      break;
    default:
      break;
  }
}

export function collectSimulatorInputs(
  scenarioType: ScenarioType,
  state: {
    propertyValue: string;
    downPayment: string;
    interestRateAnnual: string;
    loanTermYears: string;
    expectedMonthlyRent: string;
    expectedAnnualAppreciation: string;
    maintenanceAnnualPercentage: string;
    baselineInvestmentReturn: string;
    debtBalance: string;
    debtInterestRateAnnual: string;
    minimumMonthlyPayment: string;
    monthlyExtraCapital: string;
    investmentReturnAnnual: string;
    yearsToSimulateDebt: string;
    monthlyContribution: string;
    marginalTaxRate: string;
    taxInvestmentReturnAnnual: string;
    yearsToSimulateTax: string;
    initialCapital: string;
    monthlyOperatingCost: string;
    expectedMonthlyRevenue: string;
    passiveMarketReturnAnnual: string;
    yearsToSimulateBusiness: string;
    customBaselineInitialCapital: string;
    customBaselineMonthlyContribution: string;
    customBaselineAnnualReturn: string;
    customScenarioInitialCapital: string;
    customScenarioMonthlyContribution: string;
    customScenarioAnnualReturn: string;
    customScenarioAnnualCost: string;
    customYearsToSimulate: string;
  },
): Record<string, unknown> {
  switch (scenarioType) {
    case 'PROPERTY':
      return {
        propertyValue: Number(state.propertyValue),
        downPayment: Number(state.downPayment),
        interestRateAnnual: Number(state.interestRateAnnual),
        loanTermYears: Number(state.loanTermYears),
        expectedMonthlyRent: Number(state.expectedMonthlyRent),
        expectedAnnualAppreciation: Number(state.expectedAnnualAppreciation),
        maintenanceAnnualPercentage: Number(state.maintenanceAnnualPercentage),
        baselineInvestmentReturn: Number(state.baselineInvestmentReturn),
      };
    case 'DEBT_VS_INVEST':
      return {
        debtBalance: Number(state.debtBalance),
        debtInterestRateAnnual: Number(state.debtInterestRateAnnual),
        minimumMonthlyPayment: Number(state.minimumMonthlyPayment),
        monthlyExtraCapital: Number(state.monthlyExtraCapital),
        investmentReturnAnnual: Number(state.investmentReturnAnnual),
        yearsToSimulate: Number(state.yearsToSimulateDebt),
      };
    case 'TAX_ADVANTAGED':
      return {
        monthlyContribution: Number(state.monthlyContribution),
        marginalTaxRate: Number(state.marginalTaxRate),
        investmentReturnAnnual: Number(state.taxInvestmentReturnAnnual),
        yearsToSimulate: Number(state.yearsToSimulateTax),
      };
    case 'BUSINESS':
      return {
        initialCapital: Number(state.initialCapital),
        monthlyOperatingCost: Number(state.monthlyOperatingCost),
        expectedMonthlyRevenue: Number(state.expectedMonthlyRevenue),
        passiveMarketReturnAnnual: Number(state.passiveMarketReturnAnnual),
        yearsToSimulate: Number(state.yearsToSimulateBusiness),
      };
    case 'CUSTOM':
      return {
        baselineInitialCapital: Number(state.customBaselineInitialCapital),
        baselineMonthlyContribution: Number(state.customBaselineMonthlyContribution),
        baselineAnnualReturn: Number(state.customBaselineAnnualReturn),
        scenarioInitialCapital: Number(state.customScenarioInitialCapital),
        scenarioMonthlyContribution: Number(state.customScenarioMonthlyContribution),
        scenarioAnnualReturn: Number(state.customScenarioAnnualReturn),
        scenarioAnnualCost: Number(state.customScenarioAnnualCost),
        yearsToSimulate: Number(state.customYearsToSimulate),
      };
    default:
      return {};
  }
}
