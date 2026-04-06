import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import { queryKeys } from '../../../shared/api/query-keys';
import { ME_SCOPE } from '../../../shared/api/query-scope';

export function useTaxProfile() {
  return useQuery({
    queryKey: queryKeys.tax.profile(),
    queryFn: () => apiClient.get<any | null>('/tax/profile'),
    retry: 1,
    staleTime: 60 * 1000,
  });
}

export function useTaxClassifications(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.tax.classifications(),
    queryFn: async () => {
      try {
        return await apiClient.get<any[]>('/tax/classifications');
      } catch {
        return [];
      }
    },
    enabled,
  });
}

export function useTaxPlan(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.tax.plan(),
    queryFn: async () => {
      try {
        return await apiClient.get<any>('/tax/plan');
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
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.tax.all, 'declaration-preview', ME_SCOPE],
      });
    },
  });
}

export function useAnalyzeTax() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post('/tax/analyze', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tax.classifications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tax.plan() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tax.analytics() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tax.declarationInsights() });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.tax.all, 'declaration-preview', ME_SCOPE],
      });
    },
  });
}
