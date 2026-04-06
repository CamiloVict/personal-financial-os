import { Landmark, CreditCard, Target, Zap } from 'lucide-react';

export function scenarioIcon(type: string) {
  switch (type) {
    case 'IMPACT_TAX_SHELTER':
      return <Landmark className="w-4 h-4 text-indigo-600" />;
    case 'IMPACT_DEBT_PAYDOWN':
      return <CreditCard className="w-4 h-4 text-rose-600" />;
    case 'IMPACT_GOAL_FUNDING':
      return <Target className="w-4 h-4 text-emerald-600" />;
    default:
      return <Zap className="w-4 h-4 text-blue-600" />;
  }
}

export function scenarioCardClass(type: string) {
  switch (type) {
    case 'IMPACT_TAX_SHELTER':
      return 'border-indigo-200 bg-indigo-50/30';
    case 'IMPACT_DEBT_PAYDOWN':
      return 'border-rose-200 bg-rose-50/30';
    case 'IMPACT_GOAL_FUNDING':
      return 'border-emerald-200 bg-emerald-50/30';
    default:
      return 'border-blue-200 bg-blue-50/30';
  }
}
