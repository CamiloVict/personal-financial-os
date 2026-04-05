import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import { allocatorQueryKeys } from './query-keys';

export function useAllocatorPlan(userId: string) {
  return useQuery({
    queryKey: allocatorQueryKeys.plan(userId),
    queryFn: () => apiClient.get<any>(`/allocator/plan/${userId}`),
    enabled: false, // Don't fetch automatically, wait for manual trigger with available capital
  });
}

export function useGenerateAllocatorPlan(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (availableCapital: number) => 
      apiClient.post(`/allocator/plan/${userId}`, { userId, availableCapital }),
    onSuccess: (data) => {
      queryClient.setQueryData(allocatorQueryKeys.plan(userId), data);
    }
  });
}