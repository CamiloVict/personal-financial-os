import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import { debtsQueryKeys } from './query-keys';

export function useLeverageAnalysis() {
  return useQuery({
    queryKey: debtsQueryKeys.leverageAnalysis(),
    queryFn: () => apiClient.get<any>('/debts/leverage-analysis'),
  });
}
