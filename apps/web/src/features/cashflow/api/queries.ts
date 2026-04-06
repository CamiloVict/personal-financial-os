import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import { queryKeys } from '../../../shared/api/query-keys';
import type { CashflowIntelligenceResponse } from '../types/cashflowIntelligence';

export function useCashflowStreams() {
  return useQuery({
    queryKey: queryKeys.cashflow.streams(),
    queryFn: () => apiClient.get<any[]>('/cashflow/streams'),
  });
}

export function useCashflowAnalytics() {
  return useQuery({
    queryKey: queryKeys.cashflow.analytics(),
    queryFn: () => apiClient.get<any>('/analytics/cashflow'),
  });
}

export function useCashflowIntelligence(enabled = true) {
  return useQuery({
    queryKey: queryKeys.analytics.cashflowIntelligence(),
    queryFn: () =>
      apiClient.get<CashflowIntelligenceResponse>('/analytics/cashflow-intelligence'),
    enabled,
    staleTime: 45_000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.forUser(),
    queryFn: () => apiClient.get<any[]>('/categories'),
  });
}

export function useCreateCashflowStream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newStream: Record<string, unknown>) =>
      apiClient.post('/cashflow/streams', newStream),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashflow.streams() });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashflow.analytics() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

export function useDeleteCashflowStream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/cashflow/streams/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashflow.streams() });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashflow.analytics() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

export function useCreateCashflowEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newEvent: { streamId: string } & Record<string, unknown>) =>
      apiClient.post(`/cashflow/streams/${newEvent.streamId}/events`, newEvent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashflow.streams() });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashflow.analytics() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

export function useSeedCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const defaults = [
        { name: 'Salario', type: 'INCOME' },
        { name: 'Negocios', type: 'INCOME' },
        { name: 'Vivienda', type: 'EXPENSE' },
        { name: 'Alimentación', type: 'EXPENSE' },
        { name: 'Transporte', type: 'EXPENSE' },
        { name: 'Entretenimiento', type: 'EXPENSE' },
      ];
      for (const cat of defaults) {
        await apiClient.post('/categories', cat);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.forUser() });
    },
  });
}
