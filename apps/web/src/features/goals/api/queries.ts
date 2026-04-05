import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import { queryKeys } from '../../../shared/api/query-keys';

export function useGoals(userId: string) {
  return useQuery({
    queryKey: queryKeys.goals.list(userId),
    queryFn: () => apiClient.getForUser<any[]>('/goals', userId),
    enabled: !!userId,
  });
}

export function useGoalRecommendations(id: string) {
  return useQuery({
    queryKey: queryKeys.goals.recommendations(id),
    queryFn: () => apiClient.get<any>(`/goals/${id}/recommendations`),
    retry: false,
  });
}

export function useCreateGoal(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newGoal: Record<string, unknown>) => apiClient.post('/goals', newGoal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.list(userId) });
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
