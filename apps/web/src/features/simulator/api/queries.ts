import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import type { ScenarioType, SimulationResult } from '../types';
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

export type SimulatorSavedLatestResponse = {
  scenarioType: string;
  inputs: Record<string, unknown>;
  result: SimulationResult;
  savedAt: string;
  expiresAt: string;
} | null;

export function useSimulatorSavedLatest(
  scenarioType: ScenarioType,
  enabled = true,
) {
  return useQuery({
    queryKey: simulatorQueryKeys.savedLatest(scenarioType),
    queryFn: () =>
      apiClient.get<SimulatorSavedLatestResponse>(
        `/simulator/saved/latest?scenarioType=${encodeURIComponent(scenarioType)}`,
      ),
    enabled,
  });
}

export function useSaveSimulatorSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      scenarioType: ScenarioType;
      inputs: Record<string, unknown>;
      result: SimulationResult;
    }) =>
      apiClient.post<{ savedAt: string; expiresAt: string }>(
        '/simulator/saved',
        body,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: simulatorQueryKeys.savedLatest(variables.scenarioType),
      });
    },
  });
}

export function useDeleteSimulatorSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scenarioType: ScenarioType) =>
      apiClient.delete(
        `/simulator/saved?scenarioType=${encodeURIComponent(scenarioType)}`,
      ),
    onSuccess: (_data, scenarioType) => {
      queryClient.invalidateQueries({
        queryKey: simulatorQueryKeys.savedLatest(scenarioType),
      });
    },
  });
}
