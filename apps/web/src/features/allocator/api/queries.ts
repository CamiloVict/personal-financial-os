import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import { allocatorQueryKeys } from './query-keys';

export function useAllocatorPlan() {
  return useQuery({
    queryKey: allocatorQueryKeys.plan(),
    queryFn: async () => null,
    enabled: false,
  });
}

export function useGenerateAllocatorPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (availableCapital: number) =>
      apiClient.post('/allocator/plan', { availableCapital }),
    onSuccess: (data) => {
      queryClient.setQueryData(allocatorQueryKeys.plan(), data);
    },
  });
}
