import { ME_SCOPE } from '../../../shared/api/query-scope';

export const debtsQueryKeys = {
  all: ['debts'] as const,
  leverageAnalysis: () => [...debtsQueryKeys.all, 'leverageAnalysis', ME_SCOPE] as const,
  list: () => [...debtsQueryKeys.all, 'list', ME_SCOPE] as const,
};
