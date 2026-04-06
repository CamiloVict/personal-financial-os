import { ME_SCOPE } from '../../../shared/api/query-scope';

export const allocatorQueryKeys = {
  all: ['allocator'] as const,
  plan: () => [...allocatorQueryKeys.all, 'plan', ME_SCOPE] as const,
  savedLatest: () => [...allocatorQueryKeys.all, 'savedLatest', ME_SCOPE] as const,
};
