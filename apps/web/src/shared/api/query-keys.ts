import { ME_SCOPE } from './query-scope';

export const queryKeys = {
  cashflow: {
    all: ['cashflow'] as const,
    streams: () => [...queryKeys.cashflow.all, 'streams', ME_SCOPE] as const,
    analytics: () => [...queryKeys.cashflow.all, 'analytics', ME_SCOPE] as const,
  },
  categories: {
    all: ['categories'] as const,
    forUser: () => [...queryKeys.categories.all, ME_SCOPE] as const,
  },
  investments: {
    all: ['investments'] as const,
    types: () => [...queryKeys.investments.all, 'types', ME_SCOPE] as const,
    positions: () => [...queryKeys.investments.all, 'positions', ME_SCOPE] as const,
  },
  goals: {
    all: ['goals'] as const,
    list: () => [...queryKeys.goals.all, 'list', ME_SCOPE] as const,
    detail: (id: string) => [...queryKeys.goals.all, 'detail', id] as const,
    scenarios: (id: string) =>
      [...queryKeys.goals.detail(id), 'scenarios'] as const,
  },
  tax: {
    all: ['tax'] as const,
    profile: () => [...queryKeys.tax.all, 'profile', ME_SCOPE] as const,
    classifications: () => [...queryKeys.tax.all, 'classifications', ME_SCOPE] as const,
    plan: () => [...queryKeys.tax.all, 'plan', ME_SCOPE] as const,
    analytics: () => [...queryKeys.tax.all, 'analytics', ME_SCOPE] as const,
    declarationInsights: () =>
      [...queryKeys.tax.all, 'declaration-insights', ME_SCOPE] as const,
    declarationPreview: (leverKey: string) =>
      [...queryKeys.tax.all, 'declaration-preview', ME_SCOPE, leverKey] as const,
  },
};
