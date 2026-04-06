'use client';
import React, { useMemo, useState } from 'react';
import { Banknote } from 'lucide-react';

import {
  useCategories,
  useCashflowStreams,
  useCashflowAnalytics,
  useCashflowIntelligence,
  useSeedCategories,
  useCreateCashflowStream,
  useDeleteCashflowStream,
  useCreateCashflowEvent,
} from '@/features/cashflow/api/queries';
import { useInvestmentPositions } from '@/features/investments/api/queries';

import {
  CashflowSetupWelcome,
  CashflowMetrics,
  CashflowCharts,
  CashflowForm,
  CashflowList,
  CashflowEventModal,
  CashflowIntelligenceSection,
} from '@/features/cashflow/components';
import { useProductInsights } from '@/features/dashboard/api/queries';
import { InsightsContextStrip } from '@/features/dashboard/components';
import { ErrorState } from '@/shared/ui/ErrorState';
import { valuationModeFootnote } from '@/features/currency/format';
import { useGlobalStore } from '@/shared/store/global';
import { useValuationPresentation } from '@/features/currency/hooks/useValuationPresentation';
import {
  linesFromStreams,
  rowsToMap,
  aggregateExpensePieByCategory,
  aggregateIncomeBarByType,
  presentedCurrencyFromRows,
} from '@/features/currency/valuationUtils';

export default function CashflowPage() {
  const { data: categories = [], isLoading: isLoadingCat } = useCategories();
  const {
    data: streams = [],
    isLoading: isLoadingStreams,
    isError: streamsError,
    refetch: refetchStreams,
  } = useCashflowStreams();
  const { data: positionsPayload, isLoading: isLoadingPositions } =
    useInvestmentPositions();
  const positions = positionsPayload?.positions ?? [];
  const {
    data: cashflowAnalytics,
    isLoading: isLoadingAnalytics,
    isError: analyticsError,
    refetch: refetchAnalytics,
  } = useCashflowAnalytics();
  const { data: cashflowIntelligence, isLoading: isLoadingIntelligence } =
    useCashflowIntelligence();
  const { data: productInsightsPayload, isLoading: loadingInsights } =
    useProductInsights();

  const setupHelpLoading = isLoadingStreams || isLoadingPositions;
  const showSetupHelp =
    !setupHelpLoading && streams.length === 0 && positions.length === 0;

  const seedCategoriesMutation = useSeedCategories();
  const createStreamMutation = useCreateCashflowStream();
  const deleteStreamMutation = useDeleteCashflowStream();
  const createEventMutation = useCreateCashflowEvent();

  // Form State
  const [name, setName] = useState('');
  const [flowType, setFlowType] = useState('INCOME');
  const [streamType, setStreamType] = useState('FIXED');
  const [categoryId, setCategoryId] = useState('');
  const [expectedAmount, setExpectedAmount] = useState<string>('');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [startDate, setStartDate] = useState('');
  const [streamCurrency, setStreamCurrency] = useState<'USD' | 'COP'>(() =>
    useGlobalStore.getState().displayValuationMode === 'NOMINAL_USD'
      ? 'USD'
      : 'COP',
  );
  
  // Event Modal state
  const [selectedStream, setSelectedStream] = useState<any>(null);
  const [eventAmount, setEventAmount] = useState<string>('');
  const [eventDate, setEventDate] = useState('');
  const [eventObs, setEventObs] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId && categories.length > 0) return alert('Selecciona una categoría válida');
    
    createStreamMutation.mutate({
      name,
      categoryId: categoryId || categories[0]?.id,
      flowType,
      streamType,
      expectedAmount: Number(expectedAmount) || 0,
      currency: streamCurrency,
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

  const totalExpectedIncome = incomeStreams.reduce(
    (acc: number, s: any) => acc + Number(s.expectedAmount),
    0,
  );
  const totalExpectedExpense = expenseStreams.reduce(
    (acc: number, s: any) => acc + Number(s.expectedAmount),
    0,
  );
  const remainingExpected = totalExpectedIncome - totalExpectedExpense;

  const displayValuationMode = useGlobalStore((s) => s.displayValuationMode);

  const streamLineInputs = useMemo(() => linesFromStreams(streams), [streams]);

  const { data: presentedRows, isLoading: presentationLoading } =
    useValuationPresentation(streamLineInputs, streamLineInputs.length > 0);

  const sumPresented = (ids: string[]) => {
    if (!presentedRows) return null;
    let t = 0;
    for (const id of ids) {
      const r = presentedRows.find((x) => x.id === id);
      if (!r) return null;
      t += r.presentedAmount;
    }
    return t;
  };

  const incomeIds = incomeStreams.map((s: any) => s.id);
  const expenseIds = expenseStreams.map((s: any) => s.id);
  const pInc = sumPresented(incomeIds);
  const pExp = sumPresented(expenseIds);
  const pRem = pInc != null && pExp != null ? pInc - pExp : null;
  const presCcy = presentedCurrencyFromRows(
    presentedRows,
    displayValuationMode,
  );

  const rowMap = useMemo(() => rowsToMap(presentedRows), [presentedRows]);
  const expenseChartData = useMemo(
    () => aggregateExpensePieByCategory(streams, rowMap),
    [streams, rowMap],
  );
  const incomeChartData = useMemo(
    () => aggregateIncomeBarByType(streams, rowMap),
    [streams, rowMap],
  );
  const hasPresentedCharts =
    streams.length > 0 &&
    !presentationLoading &&
    (presentedRows?.length ?? 0) > 0;

  const presentedByStreamId = useMemo(() => {
    if (!presentedRows?.length) return undefined;
    const ccy =
      presentedRows[0]?.presentedCurrency ??
      (displayValuationMode === 'NOMINAL_USD' ? 'USD' : 'COP');
    const m: Record<string, { amount: number; currency: string }> = {};
    for (const r of presentedRows) {
      m[r.id] = { amount: r.presentedAmount, currency: ccy };
    }
    return m;
  }, [presentedRows, displayValuationMode]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <CashflowSetupWelcome
        visible={showSetupHelp}
        needsCategoriesFirst={!isLoadingCat && categories.length === 0}
      />

      <InsightsContextStrip
        insights={productInsightsPayload?.insights}
        modules={['cashflow', 'debts']}
        loading={loadingInsights}
        max={2}
      />

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

      {streamsError ? (
        <ErrorState
          title="No se pudieron cargar tus streams"
          description="No podemos mostrar la lista de ingresos y gastos. Comprueba la conexión o reintenta."
          className="rounded-2xl"
        >
          <button
            type="button"
            onClick={() => void refetchStreams()}
            className="mx-auto rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Reintentar
          </button>
        </ErrorState>
      ) : null}

      {!streamsError && analyticsError ? (
        <ErrorState
          variant="compact"
          title="No se pudieron cargar las analíticas de cashflow"
          description="Los gráficos de distribución pueden faltar. El resto de la página sigue disponible."
          className="rounded-xl py-4"
        >
          <button
            type="button"
            onClick={() => void refetchAnalytics()}
            className="text-xs font-semibold text-rose-900 underline underline-offset-2 hover:text-rose-950"
          >
            Reintentar
          </button>
        </ErrorState>
      ) : null}

      <CashflowMetrics
        totalExpectedIncome={totalExpectedIncome}
        totalExpectedExpense={totalExpectedExpense}
        remainingExpected={remainingExpected}
        incomeStreamsCount={incomeStreams.length}
        expenseStreamsCount={expenseStreams.length}
        presentedIncome={pInc}
        presentedExpense={pExp}
        presentedRemaining={pRem}
        presentedCurrency={presCcy}
        presentationLoading={presentationLoading}
        presentationLabel={valuationModeFootnote(displayValuationMode)}
      />

      <CashflowIntelligenceSection
        data={cashflowIntelligence}
        isLoading={isLoadingIntelligence}
        chartCurrency={hasPresentedCharts ? presCcy : 'USD'}
      />

      <CashflowCharts
        isLoadingAnalytics={isLoadingAnalytics}
        cashflowAnalytics={cashflowAnalytics}
        expenseChartData={
          hasPresentedCharts ? expenseChartData : undefined
        }
        incomeChartData={
          hasPresentedCharts ? incomeChartData : undefined
        }
        chartCurrency={hasPresentedCharts ? presCcy : 'USD'}
        presentationLoading={
          streams.length > 0 && presentationLoading
        }
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
          streamCurrency={streamCurrency}
          setStreamCurrency={setStreamCurrency}
        />

        <CashflowList
          streams={streams}
          isLoading={isLoadingStreams}
          onSelectStream={setSelectedStream}
          onDeleteStream={(id) => deleteStreamMutation.mutate(id)}
          presentedByStreamId={presentedByStreamId}
          presentationLoading={presentationLoading}
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