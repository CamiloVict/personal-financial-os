export const queryKeys = {
  cashflow: {
    all: ['cashflow'] as const,
    streams: (userId: string) => [...queryKeys.cashflow.all, 'streams', userId] as const,
    analytics: (userId: string) => [...queryKeys.cashflow.all, 'analytics', userId] as const,
  },
  categories: {
    all: ['categories'] as const,
    forUser: (userId: string) => [...queryKeys.categories.all, userId] as const,
  },
  investments: {
    all: ['investments'] as const,
    types: (userId: string) => [...queryKeys.investments.all, 'types', userId] as const,
    positions: (userId: string) => [...queryKeys.investments.all, 'positions', userId] as const,
  },
  goals: {
    all: ['goals'] as const,
    list: (userId: string) => [...queryKeys.goals.all, 'list', userId] as const,
    detail: (id: string) => [...queryKeys.goals.all, 'detail', id] as const,
    recommendations: (id: string) =>
      [...queryKeys.goals.detail(id), 'recommendations'] as const,
  },
  tax: {
    all: ['tax'] as const,
    profile: (userId: string) => [...queryKeys.tax.all, 'profile', userId] as const,
    classifications: (userId: string) => [...queryKeys.tax.all, 'classifications', userId] as const,
    plan: (userId: string) => [...queryKeys.tax.all, 'plan', userId] as const,
    analytics: (userId: string) => [...queryKeys.tax.all, 'analytics', userId] as const,
  },
};
