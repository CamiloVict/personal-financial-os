'use client';

import React, { useMemo, useState } from 'react';
import { useSimulateAllocatorScenarios } from '@/features/allocator/api/queries';
import type { AllocatorPlan } from '@/features/allocator/types';
import {
  AllocatorPageHeader,
  AllocatorCapitalForm,
  AllocatorScenariosSection,
} from '@/features/allocator/components';
import { ExplanationPanel } from '@/shared/ui/ExplanationPanel';
import { ConfidenceBadge } from '@/shared/ui/ConfidenceBadge';
import { useValuationPresentation } from '@/features/currency/hooks/useValuationPresentation';
import {
  linesFromAllocatorPlan,
  presentedCurrencyFromRows,
} from '@/features/currency/valuationUtils';
import { useGlobalStore } from '@/shared/store/global';

export default function AllocatorPage() {
  const simulateMutation = useSimulateAllocatorScenarios();
  const valuationAsOfDate = useGlobalStore((s) => s.valuationAsOfDate);
  const displayValuationMode = useGlobalStore((s) => s.displayValuationMode);

  const [availableCapital, setAvailableCapital] = useState('');
  const [plan, setPlan] = useState<AllocatorPlan | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!availableCapital || Number(availableCapital) <= 0) return;

    simulateMutation.mutate(Number(availableCapital), {
      onSuccess: (data) => setPlan(data as AllocatorPlan),
    });
  };

  const allocLines = useMemo(
    () =>
      plan ? linesFromAllocatorPlan(plan, valuationAsOfDate) : [],
    [plan, valuationAsOfDate],
  );

  const { data: allocPresRows, isLoading: allocPresLoading } =
    useValuationPresentation(allocLines, allocLines.length > 0);

  const allocPresented = useMemo(() => {
    if (!plan || !allocPresRows?.length) {
      return {
        available: null as number | null,
        unallocated: null as number | null,
        assigned: null as number | null,
        currency: 'USD',
        byScenario: undefined as
          | Record<string, { modeled: number; expectedReturn: number }>
          | undefined,
      };
    }
    const find = (id: string) => allocPresRows.find((r) => r.id === id);
    const av = find('alloc-avail');
    const un = find('alloc-unalloc');
    if (!av || !un) {
      return {
        available: null,
        unallocated: null,
        assigned: null,
        currency: presentedCurrencyFromRows(
          allocPresRows,
          displayValuationMode,
        ),
        byScenario: undefined,
      };
    }
    const ccy = presentedCurrencyFromRows(allocPresRows, displayValuationMode);
    const available = av.presentedAmount;
    const unallocated = un.presentedAmount;
    const assigned = available - unallocated;
    const byScenario: Record<
      string,
      { modeled: number; expectedReturn: number }
    > = {};
    for (const sc of plan.scenarios) {
      const mod = find(`alloc-mod-${sc.id}`);
      const ret = find(`alloc-ret-${sc.id}`);
      if (mod && ret) {
        byScenario[sc.id] = {
          modeled: mod.presentedAmount,
          expectedReturn: ret.presentedAmount,
        };
      }
    }
    return {
      available,
      unallocated,
      assigned,
      currency: ccy,
      byScenario:
        Object.keys(byScenario).length > 0 ? byScenario : undefined,
    };
  }, [plan, allocPresRows, displayValuationMode]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <AllocatorPageHeader />

      <AllocatorCapitalForm
        availableCapital={availableCapital}
        onCapitalChange={setAvailableCapital}
        onSubmit={handleGenerate}
        isPending={simulateMutation.isPending}
      />

      {plan ? (
        <>
          <div className="flex justify-end">
            <ConfidenceBadge confidence={plan.confidence} />
          </div>
          <ExplanationPanel explanation={plan.explanation} defaultOpen={false} />
          <AllocatorScenariosSection
            plan={plan}
            presentedAvailable={allocPresented.available}
            presentedUnallocated={allocPresented.unallocated}
            presentedAssigned={allocPresented.assigned}
            presentedCurrency={allocPresented.currency}
            presentedByScenarioId={allocPresented.byScenario}
            presentationLoading={allocPresLoading}
          />
        </>
      ) : null}
    </div>
  );
}
