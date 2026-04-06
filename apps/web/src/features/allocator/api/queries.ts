import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import { allocatorQueryKeys } from './query-keys';
import type { AllocatorPlan } from '../types';

export type AllocatorSavedLatestResponse = {
  plan: AllocatorPlan;
  savedAt: string;
  expiresAt: string;
} | null;

export function useAllocatorPlan() {
  return useQuery({
    queryKey: allocatorQueryKeys.plan(),
    queryFn: async () => null,
    enabled: false,
  });
}

export function useAllocatorSavedLatest(enabled = true) {
  return useQuery({
    queryKey: allocatorQueryKeys.savedLatest(),
    queryFn: () =>
      apiClient.get<AllocatorSavedLatestResponse>('/allocator/saved/latest'),
    enabled,
  });
}

export function useSaveAllocatorSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plan: AllocatorPlan) =>
      apiClient.post<{ savedAt: string; expiresAt: string }>(
        '/allocator/saved',
        { plan },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allocatorQueryKeys.savedLatest() });
    },
  });
}

export function useDeleteAllocatorSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete('/allocator/saved'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allocatorQueryKeys.savedLatest() });
    },
  });
}

export function useSimulateAllocatorScenarios() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (availableCapital: number) =>
      apiClient.post('/allocator/scenarios/simulate', { availableCapital }),
    onSuccess: (data) => {
      queryClient.setQueryData(allocatorQueryKeys.plan(), data);
    },
  });
}
