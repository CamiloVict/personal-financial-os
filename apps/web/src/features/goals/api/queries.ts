import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import { queryKeys } from '../../../shared/api/query-keys';
import type { GoalProjectionResponse } from '../types/goalProjection';

export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals.list(),
    queryFn: () => apiClient.get<any[]>('/goals'),
  });
}

export function useGoal(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.goals.detail(id),
    queryFn: () => apiClient.get<any>(`/goals/${id}`),
    enabled: Boolean(id) && enabled,
  });
}

export function useUpdateGoal(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const updated = await apiClient.patch<any>(`/goals/${id}`, body);
      try {
        await apiClient.post(`/goals/${id}/scenarios/simulate`, {});
      } catch {
        /* sin cashflow u otro error: la meta igual quedó guardada */
      }
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.scenarios(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.projection(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

export function useGoalScenarios(id: string) {
  return useQuery({
    queryKey: queryKeys.goals.scenarios(id),
    queryFn: () => apiClient.get<any>(`/goals/${id}/scenarios`),
    retry: false,
    enabled: Boolean(id),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newGoal: Record<string, unknown>) => apiClient.post('/goals', newGoal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

export function useSimulateGoalScenarios(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...queryKeys.goals.scenarios(id), 'simulate'],
    mutationFn: () => apiClient.post(`/goals/${id}/scenarios/simulate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.scenarios(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.projection(id) });
    },
  });
}

export function useGoalProjection(goalId: string) {
  return useQuery({
    queryKey: queryKeys.goals.projection(goalId),
    queryFn: () =>
      apiClient.get<GoalProjectionResponse>(`/goals/${goalId}/projection`),
    enabled: Boolean(goalId),
    staleTime: 30_000,
  });
}
