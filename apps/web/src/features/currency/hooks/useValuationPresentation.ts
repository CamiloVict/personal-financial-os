import { useGlobalStore } from '@/shared/store/global';
import { usePresentLinesQuery } from '@/features/currency/api/queries';
import type { ValuationLineInput } from '@/features/currency/valuationUtils';

/**
 * Batch de valuación alineado con la barra global (mismo modo, asOf, base IPC).
 */
export function useValuationPresentation(lines: ValuationLineInput[], enabled: boolean) {
  const displayValuationMode = useGlobalStore((s) => s.displayValuationMode);
  const realTermsBaseMonth = useGlobalStore((s) => s.realTermsBaseMonth);
  const valuationAsOfDate = useGlobalStore((s) => s.valuationAsOfDate);

  return usePresentLinesQuery(
    lines,
    {
      display: displayValuationMode,
      asOfDate: valuationAsOfDate,
      realTermsBaseMonth,
    },
    enabled && lines.length > 0,
  );
}
