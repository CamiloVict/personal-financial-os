'use client';

import { Activity } from 'lucide-react';
import { useLeverageAnalysis } from '@/features/debts/api/queries';
import type { LeverageAnalysis } from '@/features/debts/types';
import {
  DebtsPageHeader,
  DebtsEmptyTotal,
  DebtsOverviewSidebar,
  DebtsGoodDebtPanel,
  DebtsBadDebtPanel,
} from '@/features/debts/components';
import { ExplanationPanel } from '@/shared/ui/ExplanationPanel';

export default function DebtsPage() {
  const { data: analysis, isLoading } = useLeverageAnalysis();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Activity className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!analysis) return null;

  const a = analysis as LeverageAnalysis;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <DebtsPageHeader confidence={a.confidence} />

      <ExplanationPanel explanation={a.explanation} defaultOpen={false} />

      {a.totalDebt === 0 ? (
        <DebtsEmptyTotal />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <DebtsOverviewSidebar analysis={a} />
          <div className="lg:col-span-8 space-y-4">
            <DebtsGoodDebtPanel goodDebts={a.goodDebts} />
            <DebtsBadDebtPanel badDebts={a.badDebts} />
          </div>
        </div>
      )}
    </div>
  );
}
