import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import { queryKeys } from '../../../shared/api/query-keys';

export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals.list(),
    queryFn: () => apiClient.get<any[]>('/goals'),
  });
}

export function useGoalRecommendations(id: string) {
  return useQuery({
    queryKey: queryKeys.goals.recommendations(id),
    queryFn: () => apiClient.get<any>(`/goals/${id}/recommendations`),
    retry: false,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newGoal: Record<string, unknown>) => apiClient.post('/goals', newGoal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.list() });
    },
  });
}

export function useRecalculateRecommendations(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post(`/goals/${id}/recommendations/recalculate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.recommendations(id) });
    },
  });
}
