'use client';

import React, { useState } from 'react';
import { useSimulateAllocatorScenarios } from '@/features/allocator/api/queries';
import type { AllocatorPlan } from '@/features/allocator/types';
import {
  AllocatorPageHeader,
  AllocatorCapitalForm,
  AllocatorScenariosSection,
} from '@/features/allocator/components';
import { ExplanationPanel } from '@/shared/ui/ExplanationPanel';
import { ConfidenceBadge } from '@/shared/ui/ConfidenceBadge';

export default function AllocatorPage() {
  const simulateMutation = useSimulateAllocatorScenarios();

  const [availableCapital, setAvailableCapital] = useState('');
  const [plan, setPlan] = useState<AllocatorPlan | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!availableCapital || Number(availableCapital) <= 0) return;

    simulateMutation.mutate(Number(availableCapital), {
      onSuccess: (data) => setPlan(data as AllocatorPlan),
    });
  };

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
          <AllocatorScenariosSection plan={plan} />
        </>
      ) : null}
    </div>
  );
}
