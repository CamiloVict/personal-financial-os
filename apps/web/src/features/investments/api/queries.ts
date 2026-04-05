import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import { queryKeys } from '../../../shared/api/query-keys';

export function useInvestmentTypes(userId: string) {
  return useQuery({
    queryKey: queryKeys.investments.types(userId),
    queryFn: () => apiClient.getForUser<any[]>('/investments/types', userId),
    enabled: !!userId,
  });
}

export function useCreateInvestmentType(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newType: Record<string, unknown>) =>
      apiClient.post('/investments/types', { ...newType, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.types(userId) });
    },
  });
}

export function useDeleteInvestmentType(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/investments/types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.types(userId) });
    },
  });
}

export function useInvestmentPositions(userId: string) {
  return useQuery({
    queryKey: queryKeys.investments.positions(userId),
    queryFn: () => apiClient.getForUser<any[]>('/investments/positions', userId),
    enabled: !!userId,
  });
}

export function useCreateInvestmentPosition(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newPos: Record<string, unknown>) =>
      apiClient.post('/investments/positions', newPos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.positions(userId) });
    },
  });
}

export function useDeleteInvestmentPosition(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/investments/positions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.positions(userId) });
    },
  });
}

export function useCreateInvestmentEvent(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newEvent: { investmentId: string } & Record<string, unknown>) =>
      apiClient.post(
        `/investments/positions/${newEvent.investmentId}/events`,
        newEvent,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.positions(userId) });
    },
  });
}
