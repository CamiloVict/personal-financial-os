import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/query-keys';
import type { DisplayValuationMode } from '@/shared/store/global';

export type PresentLineResult = {
  id: string;
  originalAmount: number;
  originalCurrency: string;
  presentedAmount: number;
  presentedCurrency: string;
  fxAsOfUsed: string;
  inflationFactor?: number;
  warnings: string[];
};

export type UserPreferencesDto = {
  id: string;
  userId: string;
  baseCurrency: string;
  displayValuationMode: string;
  realTermsBaseMonth: string | null;
  valuationAsOfDate: string | null;
};

export function useUserPreferences(enabled = true) {
  return useQuery({
    queryKey: queryKeys.currency.preferences(),
    queryFn: () => apiClient.get<UserPreferencesDto>('/preferences'),
    enabled,
    staleTime: 60_000,
  });
}

export function usePatchUserPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      displayValuationMode?: string;
      realTermsBaseMonth?: string | null;
      valuationAsOfDate?: string | null;
      baseCurrency?: string;
    }) => apiClient.patch<UserPreferencesDto>('/preferences', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.currency.preferences() });
      qc.invalidateQueries({ queryKey: [...queryKeys.currency.all] });
    },
  });
}

export function usePresentLinesQuery(
  lines: Array<{
    id: string;
    amount: number;
    currency: string;
    valueDate: string;
  }>,
  params: {
    display: DisplayValuationMode;
    asOfDate: string;
    realTermsBaseMonth?: string;
  },
  enabled: boolean,
) {
  const fingerprint = JSON.stringify({
    display: params.display,
    asOf: params.asOfDate,
    base: params.realTermsBaseMonth,
    lines: lines.map((l) => [l.id, l.amount, l.currency, l.valueDate]),
  });

  return useQuery({
    queryKey: queryKeys.currency.presentLines(fingerprint),
    queryFn: () =>
      apiClient.post<PresentLineResult[]>('/currency/present-lines', {
        display: params.display,
        asOfDate: params.asOfDate,
        realTermsBaseMonth:
          params.display === 'REAL_COP' ? params.realTermsBaseMonth : undefined,
        lines,
      }),
    enabled: enabled && lines.length > 0,
    staleTime: 30_000,
  });
}
