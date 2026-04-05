import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import { queryKeys } from '../../../shared/api/query-keys';

export function useCashflowStreams(userId: string) {
  return useQuery({
    queryKey: queryKeys.cashflow.streams(userId),
    queryFn: () => apiClient.getForUser<any[]>('/cashflow/streams', userId),
    enabled: !!userId,
  });
}

export function useCashflowAnalytics(userId: string) {
  return useQuery({
    queryKey: queryKeys.cashflow.analytics(userId),
    queryFn: () => apiClient.get<any>(`/analytics/cashflow/${userId}`),
    enabled: !!userId,
  });
}

export function useCategories(userId: string) {
  return useQuery({
    queryKey: queryKeys.categories.forUser(userId),
    queryFn: () => apiClient.getForUser<any[]>('/categories', userId),
    enabled: !!userId,
  });
}

export function useCreateCashflowStream(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newStream: Record<string, unknown>) =>
      apiClient.post('/cashflow/streams', newStream),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashflow.streams(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashflow.analytics(userId) });
    },
  });
}

export function useDeleteCashflowStream(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/cashflow/streams/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashflow.streams(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashflow.analytics(userId) });
    },
  });
}

export function useCreateCashflowEvent(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newEvent: { streamId: string } & Record<string, unknown>) =>
      apiClient.post(`/cashflow/streams/${newEvent.streamId}/events`, newEvent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cashflow.streams(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cashflow.analytics(userId) });
    },
  });
}

export function useSeedCategories(userId: string) {
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
        await apiClient.post('/categories', { ...cat, userId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.forUser(userId) });
    },
  });
}
