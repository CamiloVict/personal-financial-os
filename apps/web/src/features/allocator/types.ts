export interface AllocatorRecommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  suggestedAmount: number;
  expectedReturnAmount: number;
  returnPercentage: number;
  priorityScore: number;
}

export interface AllocatorPlan {
  userId?: string;
  availableCapital: number;
  unallocatedCapital: number;
  recommendations: AllocatorRecommendation[];
}
