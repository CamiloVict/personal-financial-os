import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import { queryKeys } from '../../../shared/api/query-keys';
import type { PortfolioAnalyticsResponse } from '../types/portfolioAnalytics';

export type { PortfolioAnalyticsResponse };

export function useInvestmentTypes() {
  return useQuery({
    queryKey: queryKeys.investments.types(),
    queryFn: () => apiClient.get<any[]>('/investments/types'),
  });
}

export function useCreateInvestmentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newType: Record<string, unknown>) =>
      apiClient.post('/investments/types', newType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.types() });
    },
  });
}

export function useDeleteInvestmentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/investments/types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.types() });
    },
  });
}

export type InvestmentPositionsPayload = {
  positions: any[];
  confidence: import('@personal-finance-os/explanation').FinancialConfidence;
};

export function useInvestmentPositions() {
  return useQuery({
    queryKey: queryKeys.investments.positions(),
    queryFn: () =>
      apiClient.get<InvestmentPositionsPayload>('/investments/positions'),
  });
}

export function usePortfolioAnalytics(enabled = true) {
  return useQuery({
    queryKey: queryKeys.investments.portfolioAnalytics(),
    queryFn: () =>
      apiClient.get<PortfolioAnalyticsResponse>(
        '/investments/portfolio-analytics',
      ),
    enabled,
  });
}

export function useCreateInvestmentPosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newPos: Record<string, unknown>) =>
      apiClient.post('/investments/positions', newPos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.positions() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.investments.portfolioAnalytics(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

export function useDeleteInvestmentPosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/investments/positions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.positions() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.investments.portfolioAnalytics(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

export function useCreateInvestmentEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newEvent: { investmentId: string } & Record<string, unknown>) =>
      apiClient.post(
        `/investments/positions/${newEvent.investmentId}/events`,
        newEvent,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.positions() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.investments.portfolioAnalytics(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}
