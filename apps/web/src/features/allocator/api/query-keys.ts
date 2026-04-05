export const allocatorQueryKeys = {
  all: ['allocator'] as const,
  plan: (userId: string) => [...allocatorQueryKeys.all, 'plan', userId] as const,
};
