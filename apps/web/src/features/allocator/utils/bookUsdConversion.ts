import { apiClient } from '@/shared/api/client';

type ConvertResponse = { amount: number; warnings?: string[] };

export async function toBookUsd(
  amount: number,
  inputCurrency: 'USD' | 'COP',
  asOfDate: string,
): Promise<number> {
  if (inputCurrency === 'USD') return amount;
  const r = await apiClient.post<ConvertResponse>('/currency/convert', {
    amount,
    from: 'COP',
    to: 'USD',
    date: asOfDate,
  });
  return r.amount;
}

export async function fromBookUsdToInputAmount(
  bookUsd: number,
  inputCurrency: 'USD' | 'COP',
  asOfDate: string,
): Promise<number> {
  if (inputCurrency === 'USD') return bookUsd;
  const r = await apiClient.post<ConvertResponse>('/currency/convert', {
    amount: bookUsd,
    from: 'USD',
    to: 'COP',
    date: asOfDate,
  });
  return r.amount;
}
