import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import { queryKeys } from '../../../shared/api/query-keys';
import { debtsQueryKeys } from './query-keys';

export function useLeverageAnalysis() {
  return useQuery({
    queryKey: debtsQueryKeys.leverageAnalysis(),
    queryFn: () => apiClient.get<any>('/debts/leverage-analysis'),
  });
}

export function useDebtsList(enabled = true) {
  return useQuery({
    queryKey: debtsQueryKeys.list(),
    queryFn: () => apiClient.get<any[]>('/debts'),
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => apiClient.post('/debts', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: debtsQueryKeys.leverageAnalysis() });
      queryClient.invalidateQueries({ queryKey: debtsQueryKeys.list() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.investments.portfolioAnalytics(),
      });
    },
  });
}

export function usePatchDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiClient.patch<unknown>(`/debts/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: debtsQueryKeys.leverageAnalysis() });
      queryClient.invalidateQueries({ queryKey: debtsQueryKeys.list() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.investments.portfolioAnalytics(),
      });
    },
  });
}
