import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import type { ProductInsightsResponse } from '../types/productInsights';

export type MonthlyCashflowPoint = {
  month: string;
  income: number;
  expense: number;
  net: number;
};

export type CashflowMonthlyTrendResponse = {
  series: MonthlyCashflowPoint[];
  eventCount: number;
};

export type NetWorthAnalyticsResponse = {
  netWorth: number;
  totalReturn: number;
  composition: { name: string; value: number }[];
};

export function useCashflowMonthlyTrend(enabled = true) {
  return useQuery({
    queryKey: queryKeys.analytics.monthlyTrend(),
    queryFn: () =>
      apiClient.get<CashflowMonthlyTrendResponse>('/analytics/cashflow-monthly'),
    enabled,
    staleTime: 60_000,
  });
}

export function useNetWorthAnalytics(enabled = true) {
  return useQuery({
    queryKey: queryKeys.analytics.netWorth(),
    queryFn: () =>
      apiClient.get<NetWorthAnalyticsResponse>('/analytics/net-worth'),
    enabled,
    staleTime: 60_000,
  });
}

export function useProductInsights(enabled = true) {
  return useQuery({
    queryKey: queryKeys.analytics.insights(),
    queryFn: () =>
      apiClient.get<ProductInsightsResponse>('/analytics/insights'),
    enabled,
    staleTime: 45_000,
  });
}
