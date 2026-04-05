'use client';
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Banknote } from 'lucide-react';

import { useGlobalStore } from '@/shared/store/global';
import {
  useCategories,
  useCashflowStreams,
  useCashflowAnalytics,
  useSeedCategories,
  useCreateCashflowStream,
  useDeleteCashflowStream,
  useCreateCashflowEvent
} from '@/features/cashflow/api/queries';

import {
  CashflowMetrics,
  CashflowCharts,
  CashflowForm,
  CashflowList,
  CashflowEventModal
} from '@/features/cashflow/components';

export default function CashflowPage() {
  const { currentUserId } = useGlobalStore();
  const queryClient = useQueryClient();

  // Data Queries
  const { data: categories = [], isLoading: isLoadingCat } = useCategories(currentUserId);
  const { data: streams = [], isLoading: isLoadingStreams } = useCashflowStreams(currentUserId);
  const { data: cashflowAnalytics, isLoading: isLoadingAnalytics } = useCashflowAnalytics(currentUserId);

  // Mutations
  const seedCategoriesMutation = useSeedCategories(currentUserId);
  const createStreamMutation = useCreateCashflowStream(currentUserId);
  const deleteStreamMutation = useDeleteCashflowStream(currentUserId);
  const createEventMutation = useCreateCashflowEvent(currentUserId);

  // Form State
  const [name, setName] = useState('');
  const [flowType, setFlowType] = useState('INCOME');
  const [streamType, setStreamType] = useState('FIXED');
  const [categoryId, setCategoryId] = useState('');
  const [expectedAmount, setExpectedAmount] = useState<string>('');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [startDate, setStartDate] = useState('');
  
  // Event Modal state
  const [selectedStream, setSelectedStream] = useState<any>(null);
  const [eventAmount, setEventAmount] = useState<string>('');
  const [eventDate, setEventDate] = useState('');
  const [eventObs, setEventObs] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId && categories.length > 0) return alert('Selecciona una categoría válida');
    
    createStreamMutation.mutate({
      userId: currentUserId,
      name,
      categoryId: categoryId || categories[0]?.id,
      flowType,
      streamType,
      expectedAmount: Number(expectedAmount) || 0,
      currency: 'USD',
      frequency,
      startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      isActive: true
    });
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStream) return;
    createEventMutation.mutate({
      streamId: selectedStream.id,
      amount: Number(eventAmount) || 0,
      date: eventDate ? new Date(eventDate).toISOString() : new Date().toISOString(),
      observations: eventObs,
      currency: selectedStream.currency
    });
  };

  // Calculations
  const incomeStreams = streams.filter((s: any) => s.flowType === 'INCOME');
  const expenseStreams = streams.filter((s: any) => s.flowType === 'EXPENSE');
  
  const totalExpectedIncome = incomeStreams.reduce((acc: number, s: any) => acc + Number(s.expectedAmount), 0);
  const totalExpectedExpense = expenseStreams.reduce((acc: number, s: any) => acc + Number(s.expectedAmount), 0);
  const remainingExpected = totalExpectedIncome - totalExpectedExpense;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end border-b border-slate-200/50 pb-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-1 bg-blue-100 rounded-md">
              <Banknote className="w-4 h-4 text-blue-600" />
            </div>
            Ingresos y Gastos (Cashflow)
          </h1>
          <p className="text-slate-500 mt-1.5 text-xs leading-relaxed">
            Proyecta y registra tu flujo de caja recurrente. Define contratos (salario, arriendo) y registra sus pagos reales.
          </p>
        </div>
      </header>

      <CashflowMetrics 
        totalExpectedIncome={totalExpectedIncome}
        totalExpectedExpense={totalExpectedExpense}
        remainingExpected={remainingExpected}
        incomeStreamsCount={incomeStreams.length}
        expenseStreamsCount={expenseStreams.length}
      />

      <CashflowCharts 
        isLoadingAnalytics={isLoadingAnalytics}
        cashflowAnalytics={cashflowAnalytics}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        <CashflowForm 
          categories={categories}
          loadingCategories={isLoadingCat}
          seedCategoriesPending={seedCategoriesMutation.isPending}
          onSeedCategories={() => seedCategoriesMutation.mutate()}
          onSubmit={handleSubmit}
          isPending={createStreamMutation.isPending}
          flowType={flowType} setFlowType={setFlowType}
          name={name} setName={setName}
          streamType={streamType} setStreamType={setStreamType}
          categoryId={categoryId} setCategoryId={setCategoryId}
          expectedAmount={expectedAmount} setExpectedAmount={setExpectedAmount}
          frequency={frequency} setFrequency={setFrequency}
          startDate={startDate} setStartDate={setStartDate}
        />

        <CashflowList 
          streams={streams}
          isLoading={isLoadingStreams}
          onSelectStream={setSelectedStream}
          onDeleteStream={(id) => deleteStreamMutation.mutate(id)}
        />

      </div>

      <CashflowEventModal 
        selectedStream={selectedStream}
        setSelectedStream={setSelectedStream}
        onSubmit={handleEventSubmit}
        isPending={createEventMutation.isPending}
        eventAmount={eventAmount} setEventAmount={setEventAmount}
        eventDate={eventDate} setEventDate={setEventDate}
        eventObs={eventObs} setEventObs={setEventObs}
      />
    </div>
  );
}