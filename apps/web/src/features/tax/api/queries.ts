import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import { queryKeys } from '../../../shared/api/query-keys';

export function useTaxProfile() {
  return useQuery({
    queryKey: queryKeys.tax.profile(),
    queryFn: async () => {
      try {
        return await apiClient.get<any>('/tax/profile');
      } catch {
        return null;
      }
    },
    retry: false,
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
    mutationFn: (data: Record<string, unknown>) => apiClient.post('/tax/profile', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tax.profile() }),
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
    },
  });
}
