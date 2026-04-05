import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
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

// Hooks

export function useSimulatePropertyPurchase(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SimulatePropertyPurchaseInput) => 
      apiClient.post(`/simulator/what-if/property/${userId}`, input),
    onSuccess: (data) => {
      queryClient.setQueryData(simulatorQueryKeys.whatIfProperty(userId), data);
    }
  });
}

export function useSimulateDebtVsInvest(userId: string) {
  return useMutation({
    mutationFn: (input: SimulateDebtVsInvestInput) => 
      apiClient.post(`/simulator/what-if/debt-vs-invest/${userId}`, input)
  });
}

export function useSimulateTaxAdvantaged(userId: string) {
  return useMutation({
    mutationFn: (input: SimulateTaxAdvantagedInput) => 
      apiClient.post(`/simulator/what-if/tax-advantaged/${userId}`, input)
  });
}

export function useSimulateBusiness(userId: string) {
  return useMutation({
    mutationFn: (input: SimulateBusinessInput) => 
      apiClient.post(`/simulator/what-if/business/${userId}`, input)
  });
}

export function useSimulateCustom(userId: string) {
  return useMutation({
    mutationFn: (input: SimulateCustomInput) => 
      apiClient.post(`/simulator/what-if/custom/${userId}`, input)
  });
}