import { ME_SCOPE } from '../../../shared/api/query-scope';

import type { ScenarioType } from '../types';

export const simulatorQueryKeys = {
  all: ['simulator'] as const,
  whatIfProperty: () => [...simulatorQueryKeys.all, 'whatIfProperty', ME_SCOPE] as const,
  savedLatest: (scenarioType: ScenarioType) =>
    [...simulatorQueryKeys.all, 'savedLatest', scenarioType, ME_SCOPE] as const,
};
