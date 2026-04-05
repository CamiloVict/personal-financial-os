import { ME_SCOPE } from '../../../shared/api/query-scope';

export const simulatorQueryKeys = {
  all: ['simulator'] as const,
  whatIfProperty: () => [...simulatorQueryKeys.all, 'whatIfProperty', ME_SCOPE] as const,
};
