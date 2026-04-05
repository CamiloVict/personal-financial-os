export const simulatorQueryKeys = {
  all: ['simulator'] as const,
  whatIfProperty: (userId: string) => [...simulatorQueryKeys.all, 'whatIfProperty', userId] as const,
};
