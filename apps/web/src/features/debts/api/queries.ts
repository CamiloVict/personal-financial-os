import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import { debtsQueryKeys } from './query-keys';

export function useLeverageAnalysis() {
  return useQuery({
    queryKey: debtsQueryKeys.leverageAnalysis(),
    queryFn: () => apiClient.get<any>('/debts/leverage-analysis'),
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => apiClient.post('/debts', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: debtsQueryKeys.leverageAnalysis() });
      queryClient.invalidateQueries({ queryKey: debtsQueryKeys.list() });
    },
  });
}
