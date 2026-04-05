import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import type { SimulationResult } from '../types';
import { simulatorQueryKeys } from './query-keys';

export interface SimulatePropertyPurchaseInput {
  propertyValue: number;
  downPayment: number;
  interestRateAnnual: number;
  loanTermYears: number;
  expectedMonthlyRent: number;
  expectedAnnualAppreciation: number;
  maintenanceAnnualPercentage: number;
  baselineInvestmentReturn: number;
}

export interface SimulateDebtVsInvestInput {
  debtBalance: number;
  debtInterestRateAnnual: number;
  minimumMonthlyPayment: number;
  monthlyExtraCapital: number;
  investmentReturnAnnual: number;
  yearsToSimulate: number;
}

export interface SimulateTaxAdvantagedInput {
  monthlyContribution: number;
  marginalTaxRate: number;
  investmentReturnAnnual: number;
  yearsToSimulate: number;
}

export interface SimulateBusinessInput {
  initialCapital: number;
  monthlyOperatingCost: number;
  expectedMonthlyRevenue: number;
  passiveMarketReturnAnnual: number;
  yearsToSimulate: number;
}

export interface SimulateCustomInput {
  baselineInitialCapital: number;
  baselineMonthlyContribution: number;
  baselineAnnualReturn: number;
  scenarioInitialCapital: number;
  scenarioMonthlyContribution: number;
  scenarioAnnualReturn: number;
  scenarioAnnualCost: number;
  yearsToSimulate: number;
}

export function useSimulatePropertyPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SimulatePropertyPurchaseInput) =>
      apiClient.post<SimulationResult>('/simulator/what-if/property', input),
    onSuccess: (data) => {
      queryClient.setQueryData(simulatorQueryKeys.whatIfProperty(), data);
    },
  });
}

export function useSimulateDebtVsInvest() {
  return useMutation({
    mutationFn: (input: SimulateDebtVsInvestInput) =>
      apiClient.post<SimulationResult>('/simulator/what-if/debt-vs-invest', input),
  });
}

export function useSimulateTaxAdvantaged() {
  return useMutation({
    mutationFn: (input: SimulateTaxAdvantagedInput) =>
      apiClient.post<SimulationResult>('/simulator/what-if/tax-advantaged', input),
  });
}

export function useSimulateBusiness() {
  return useMutation({
    mutationFn: (input: SimulateBusinessInput) =>
      apiClient.post<SimulationResult>('/simulator/what-if/business', input),
  });
}

export function useSimulateCustom() {
  return useMutation({
    mutationFn: (input: SimulateCustomInput) =>
      apiClient.post<SimulationResult>('/simulator/what-if/custom', input),
  });
}
