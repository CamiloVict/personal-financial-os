'use client';

import React, { useState } from 'react';
import { useGlobalStore } from '@/shared/store/global';
import { useGenerateAllocatorPlan } from '@/features/allocator/api/queries';
import type { AllocatorPlan } from '@/features/allocator/types';
import {
  AllocatorPageHeader,
  AllocatorCapitalForm,
  AllocatorRecommendationsSection,
} from '@/features/allocator/components';

export default function AllocatorPage() {
  const { currentUserId } = useGlobalStore();
  const generatePlanMutation = useGenerateAllocatorPlan(currentUserId);

  const [availableCapital, setAvailableCapital] = useState('');
  const [plan, setPlan] = useState<AllocatorPlan | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!availableCapital || Number(availableCapital) <= 0) return;

    generatePlanMutation.mutate(Number(availableCapital), {
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
        isPending={generatePlanMutation.isPending}
      />

      {plan && <AllocatorRecommendationsSection plan={plan} />}
    </div>
  );
}
