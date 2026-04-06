'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import type { NormalizedTaxFinancials } from '@personal-finance-os/tax-engine';
import { apiClient } from '../../../shared/api/client';
import { queryKeys } from '../../../shared/api/query-keys';
import { ME_SCOPE } from '../../../shared/api/query-scope';
import type { TaxPlanningOverview } from '../types/taxPlanningOverview';

export function useTaxProfile() {
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const { isLoaded, isSignedIn } = useAuth();
  const authReady = !hasClerk || (isLoaded && !!isSignedIn);

  return useQuery({
    queryKey: queryKeys.tax.profile(),
    queryFn: async () => {
      try {
        const raw = await apiClient.get<any | null | undefined>('/tax/profile');
        // v5: query data must not be undefined (empty body → parseJson returns undefined).
        return raw ?? null;
      } catch (e) {
        if (e instanceof Error && /\b404\b/.test(e.message)) {
          return null;
        }
        throw e;
      }
    },
    enabled: authReady,
    retry: (failureCount, error) => {
      if (error instanceof Error && /\b401\b/.test(error.message)) {
        return failureCount < 4;
      }
      return failureCount < 1;
    },
    retryDelay: (attempt) => Math.min(350 * (attempt + 1), 2000),
    staleTime: 60 * 1000,
  });
}

export function useTaxPlanningOverview(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.tax.planningOverview(),
    queryFn: () => apiClient.get<TaxPlanningOverview>('/tax/planning-overview'),
    enabled,
    staleTime: 30 * 1000,
  });
}

export type TaxClassificationsPayload = {
  classifications: any[];
  explanation?: import('@personal-finance-os/explanation').FinancialExplanation;
  confidence?: import('@personal-finance-os/explanation').FinancialConfidence;
};

export function useTaxClassifications(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.tax.classifications(),
    queryFn: async (): Promise<TaxClassificationsPayload> => {
      try {
        const res = await apiClient.get<any>('/tax/classifications');
        if (Array.isArray(res)) {
          return { classifications: res, explanation: undefined };
        }
        return {
          classifications: res.classifications ?? [],
          explanation: res.explanation,
          confidence: res.confidence,
        };
      } catch {
        return { classifications: [] };
      }
    },
    enabled,
  });
}

/** Plan almacenado + explicación; `normalizedForTax` existe tras migración y un análisis reciente. */
export type TaxPlanPayload = {
  id: string;
  profileId: string;
  generatedAt: string;
  scenarios: unknown[];
  normalizedForTax?: NormalizedTaxFinancials | null;
  explanation?: import('@personal-finance-os/explanation').FinancialExplanation;
  confidence?: import('@personal-finance-os/explanation').FinancialConfidence;
};

export function useTaxPlan(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.tax.plan(),
    queryFn: async (): Promise<TaxPlanPayload | null> => {
      try {
        return await apiClient.get<TaxPlanPayload>('/tax/plan');
      } catch {
        return null;
      }
    },
    enabled,
  });
}

export function useTaxDeclarationInsights(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.tax.declarationInsights(),
    queryFn: () => apiClient.get<any | null>('/tax/declaration-insights'),
    enabled,
    staleTime: 60 * 1000,
  });
}

export type TaxDeclarationPreview = {
  leverIds: string[];
  estimatedGrossIncome: number;
  estimatedTaxableBase: number;
  estimatedNetTaxPayable: number;
  savingsVsConservative: number;
  label: string;
  explanation?: import('@personal-finance-os/explanation').FinancialExplanation;
};

/** Vista previa del impuesto con varias palancas activas a la vez (POST /tax/declaration-preview). */
export function useTaxDeclarationPreview(enabled: boolean, leverIds: string[]) {
  const sortedKey = [...leverIds].sort().join('|');
  return useQuery({
    queryKey: queryKeys.tax.declarationPreview(sortedKey),
    queryFn: () =>
      apiClient.post<TaxDeclarationPreview>('/tax/declaration-preview', {
        leverIds,
      }),
    enabled: enabled && leverIds.length > 0,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useTaxAnalytics() {
  return useQuery({
    queryKey: queryKeys.tax.analytics(),
    queryFn: async () => {
      try {
        return await apiClient.get<any>('/analytics/tax');
      } catch {
        return null;
      }
    },
  });
}

export function useSaveTaxProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.post('/tax/profile', { ...data, analyze: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tax.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tax.classifications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tax.plan() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tax.analytics() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tax.declarationInsights() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tax.planningOverview() });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.tax.all, 'declaration-preview', ME_SCOPE],
      });
    },
  });
}

export type TaxAnalyzeResponse = {
  normalizedForTax?: NormalizedTaxFinancials;
  [key: string]: unknown;
};

export function useAnalyzeTax() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<TaxAnalyzeResponse>('/tax/analyze', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tax.classifications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tax.plan() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tax.analytics() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tax.declarationInsights() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tax.planningOverview() });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.tax.all, 'declaration-preview', ME_SCOPE],
      });
    },
  });
}
