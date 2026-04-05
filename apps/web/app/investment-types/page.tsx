'use client';
import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { useGlobalStore } from '@/shared/store/global';
import { useInvestmentTypes, useCreateInvestmentType, useDeleteInvestmentType } from '@/features/investments/api/queries';
import { TypeForm, TypeList } from '@/features/investments/components';

export default function InvestmentTypesPage() {
  const { currentUserId } = useGlobalStore();
  const { data: types = [], isLoading } = useInvestmentTypes(currentUserId);
  const createTypeMutation = useCreateInvestmentType(currentUserId);
  const deleteTypeMutation = useDeleteInvestmentType(currentUserId);

  // Form state
  const [name, setName] = useState('');
  const [generatesCashflow, setGeneratesCashflow] = useState(false);
  const [allowsProfitDistribution, setAllowsProfitDistribution] = useState(false);
  const [allowsExtraContributions, setAllowsExtraContributions] = useState(false);
  const [allowsLinkedDebt, setAllowsLinkedDebt] = useState(false);
  const [hasManualValuation, setHasManualValuation] = useState(false);
  const [expectedFrequency, setExpectedFrequency] = useState('MONTHLY');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTypeMutation.mutate({
      name,
      generatesCashflow,
      allowsProfitDistribution,
      allowsExtraContributions,
      allowsLinkedDebt,
      hasManualValuation,
      expectedFrequency: allowsProfitDistribution ? expectedFrequency : null
    }, {
      onSuccess: () => {
        setName('');
        setGeneratesCashflow(false);
        setAllowsProfitDistribution(false);
        setAllowsExtraContributions(false);
        setAllowsLinkedDebt(false);
        setHasManualValuation(false);
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-600" /> 
          Configuración de Tipos
        </h1>
        <p className="text-slate-500 mt-2">
          Crea tus propios modelos financieros. Define cómo se comporta cada clase de activo para tu seguimiento.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <TypeForm 
          name={name} setName={setName}
          generatesCashflow={generatesCashflow} setGeneratesCashflow={setGeneratesCashflow}
          allowsProfitDistribution={allowsProfitDistribution} setAllowsProfitDistribution={setAllowsProfitDistribution}
          allowsExtraContributions={allowsExtraContributions} setAllowsExtraContributions={setAllowsExtraContributions}
          allowsLinkedDebt={allowsLinkedDebt} setAllowsLinkedDebt={setAllowsLinkedDebt}
          hasManualValuation={hasManualValuation} setHasManualValuation={setHasManualValuation}
          expectedFrequency={expectedFrequency} setExpectedFrequency={setExpectedFrequency}
          onSubmit={handleSubmit}
          isPending={createTypeMutation.isPending}
        />

        <TypeList 
          types={types}
          isLoading={isLoading}
          onDeleteType={(id) => deleteTypeMutation.mutate(id)}
          isDeleting={deleteTypeMutation.isPending}
        />

      </div>
    </div>
  );
}