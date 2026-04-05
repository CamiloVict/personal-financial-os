import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import { debtsQueryKeys } from './query-keys';

export function useLeverageAnalysis(userId: string) {
  return useQuery({
    queryKey: debtsQueryKeys.leverageAnalysis(userId),
    queryFn: () => apiClient.get<any>(`/debts/leverage-analysis/${userId}`),
  });
}