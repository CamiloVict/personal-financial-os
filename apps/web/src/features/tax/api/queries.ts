import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import { queryKeys } from '../../../shared/api/query-keys';

export function useTaxProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.tax.profile(userId),
    queryFn: async () => {
      try {
        return await apiClient.get<any>(`/tax/profile/${userId}`);
      } catch {
        return null;
      }
    },
    retry: false,
  });
}

export function useTaxClassifications(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.tax.classifications(userId),
    queryFn: async () => {
      try {
        return await apiClient.get<any[]>(`/tax/classifications/${userId}`);
      } catch {
        return [];
      }
    },
    enabled,
  });
}

export function useTaxPlan(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.tax.plan(userId),
    queryFn: async () => {
      try {
        return await apiClient.get<any>(`/tax/plan/${userId}`);
      } catch {
        return null;
      }
    },
    enabled,
  });
}

export function useTaxAnalytics(userId: string) {
  return useQuery({
    queryKey: queryKeys.tax.analytics(userId),
    queryFn: async () => {
      try {
        return await apiClient.get<any>(`/analytics/tax/${userId}`);
      } catch {
        return null;
      }
    },
  });
}

export function useSaveTaxProfile(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/tax/profile', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tax.profile(userId) }),
  });
}

export function useAnalyzeTax(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post(`/tax/analyze/${userId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tax.classifications(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tax.plan(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tax.analytics(userId) });
    },
  });
}