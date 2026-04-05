import { Landmark, CreditCard, Target, Zap } from 'lucide-react';

export function recommendationIcon(type: string) {
  switch (type) {
    case 'TAX_OPTIMIZATION':
      return <Landmark className="w-4 h-4 text-indigo-600" />;
    case 'DEBT_REDUCTION':
      return <CreditCard className="w-4 h-4 text-rose-600" />;
    case 'GOAL_ACCELERATION':
      return <Target className="w-4 h-4 text-emerald-600" />;
    default:
      return <Zap className="w-4 h-4 text-blue-600" />;
  }
}

export function recommendationCardClass(type: string) {
  switch (type) {
    case 'TAX_OPTIMIZATION':
      return 'border-indigo-200 bg-indigo-50/30';
    case 'DEBT_REDUCTION':
      return 'border-rose-200 bg-rose-50/30';
    case 'GOAL_ACCELERATION':
      return 'border-emerald-200 bg-emerald-50/30';
    default:
      return 'border-blue-200 bg-blue-50/30';
  }
}
