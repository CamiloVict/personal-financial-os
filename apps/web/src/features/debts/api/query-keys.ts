export const debtsQueryKeys = {
  all: ['debts'] as const,
  leverageAnalysis: (userId: string) => [...debtsQueryKeys.all, 'leverageAnalysis', userId] as const,
};
