'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PieChart as PieChartIcon, Activity, Settings2 } from 'lucide-react';
import {
  useInvestmentPositions,
  useInvestmentTypes,
  useCreateInvestmentPosition,
  useUpdateInvestmentPosition,
  useDeleteInvestmentPosition,
  useCreateInvestmentEvent,
  usePortfolioAnalytics,
} from '@/features/investments/api/queries';
import { useCreateDebt } from '@/features/debts/api/queries';

import {
  PortfolioAnalyticsSection,
  PositionForm,
  PositionList,
  PositionCharts,
  PositionEventModal,
  PositionEditModal,
} from '@/features/investments/components';
import { useProductInsights } from '@/features/dashboard/api/queries';
import { InsightsContextStrip } from '@/features/dashboard/components';
import { ConfidenceBadge } from '@/shared/ui/ConfidenceBadge';
import { ErrorState } from '@/shared/ui/ErrorState';
import { useGlobalStore } from '@/shared/store/global';
import { useValuationPresentation } from '@/features/currency/hooks/useValuationPresentation';
import { linesFromPositions, presentedCurrencyFromRows } from '@/features/currency/valuationUtils';

export default function InvestmentPositionsPage() {
  const {
    data: positionsPayload,
    isLoading: isLoadingPos,
    isError: positionsError,
    refetch: refetchPositions,
  } = useInvestmentPositions();
  const positions = positionsPayload?.positions ?? [];
  const positionsConfidence = positionsPayload?.confidence;
  const { data: types = [], isLoading: isLoadingTypes } = useInvestmentTypes();
  const {
    data: portfolioAnalytics,
    isLoading: loadingPortfolioAnalytics,
    isError: portfolioAnalyticsError,
    refetch: refetchPortfolioAnalytics,
  } = usePortfolioAnalytics(positions.length > 0);
  const { data: productInsightsPayload, isLoading: loadingProductInsights } =
    useProductInsights();

  const createPositionMutation = useCreateInvestmentPosition();
  const updatePositionMutation = useUpdateInvestmentPosition();
  const createDebtMutation = useCreateDebt();
  const deletePositionMutation = useDeleteInvestmentPosition();
  const createEventMutation = useCreateInvestmentEvent();

  const loading = isLoadingPos || isLoadingTypes;

  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState('');
  const [initialCapital, setInitialCapital] = useState<string>('');
  const [currency, setCurrency] = useState('USD');
  const [startDate, setStartDate] = useState('');

  const [linkDebt, setLinkDebt] = useState(false);
  const [debtName, setDebtName] = useState('');
  const [debtTotalAmount, setDebtTotalAmount] = useState('');
  const [debtRemainingAmount, setDebtRemainingAmount] = useState('');
  const [debtInterestRate, setDebtInterestRate] = useState('');
  const [debtMonthlyPayment, setDebtMonthlyPayment] = useState('');
  const [debtType, setDebtType] = useState('MORTGAGE');
  const [debtDueDate, setDebtDueDate] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [patrimonyLeg, setPatrimonyLeg] = useState<'ASSET' | 'LIABILITY'>('ASSET');
  const [generatesPeriodicIncome, setGeneratesPeriodicIncome] = useState(false);
  const [expectedPeriodicIncomeAmount, setExpectedPeriodicIncomeAmount] = useState('');
  const [incomeFrequency, setIncomeFrequency] = useState<
    'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'
  >('MONTHLY');
  const [nextExpectedDate, setNextExpectedDate] = useState('');

  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [editPosition, setEditPosition] = useState<any>(null);
  const [eventType, setEventType] = useState('PROFIT_DISTRIBUTION');
  const [eventAmount, setEventAmount] = useState<string>('');
  const [eventDate, setEventDate] = useState('');
  const [eventObs, setEventObs] = useState('');

  useEffect(() => {
    if (types.length > 0 && !typeId) {
      setTypeId(types[0].id);
    }
  }, [types, typeId]);

  useEffect(() => {
    const t = types.find((x) => x.id === typeId);
    if (t?.allowsLinkedDebt) setLinkDebt(true);
    else setLinkDebt(false);
  }, [typeId, types]);

  const selectedType = types.find((t) => t.id === typeId);
  const allowsLinkedDebt = Boolean(selectedType?.allowsLinkedDebt);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const parsedDate = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
    const positionNameSnapshot = name.trim();
    const selected = types.find((t) => t.id === typeId);

    if (selected?.allowsLinkedDebt && linkDebt) {
      const rem = Number(debtRemainingAmount);
      if (!Number.isFinite(rem) || rem <= 0) {
        setSubmitError('Si activas la deuda vinculada, indica el saldo pendiente (mayor que 0).');
        return;
      }
    }

    const genInc = generatesPeriodicIncome;
    createPositionMutation.mutate(
      {
        typeId,
        name: positionNameSnapshot,
        startDate: parsedDate,
        initialCapital: Number(initialCapital) || 0,
        currency,
        currentEstimatedValue: Number(initialCapital) || 0,
        status: 'ACTIVE',
        patrimonyLeg,
        generatesPeriodicIncome: genInc,
        expectedPeriodicIncomeAmount: genInc ? Number(expectedPeriodicIncomeAmount) || 0 : 0,
        frequency: genInc ? incomeFrequency : null,
        nextExpectedDate:
          genInc && nextExpectedDate
            ? new Date(nextExpectedDate).toISOString()
            : null,
      },
      {
        onSuccess: (data: unknown) => {
          const position = data as { id: string };
          const rem = Number(debtRemainingAmount);
          const totRaw = Number(debtTotalAmount);
          const totalAmount = Number.isFinite(totRaw) && totRaw > 0 ? totRaw : rem;

          setName('');
          setInitialCapital('');
          setStartDate('');
          setPatrimonyLeg('ASSET');
          setGeneratesPeriodicIncome(false);
          setExpectedPeriodicIncomeAmount('');
          setIncomeFrequency('MONTHLY');
          setNextExpectedDate('');

          if (selected?.allowsLinkedDebt && linkDebt && position?.id && rem > 0) {
            createDebtMutation.mutate({
              name: debtName.trim() || `${positionNameSnapshot} — financiamiento`,
              type: debtType,
              totalAmount,
              remainingAmount: rem,
              currency,
              interestRate: Number(debtInterestRate) || 0,
              monthlyPayment: Number(debtMonthlyPayment) || 0,
              dueDate: debtDueDate ? new Date(debtDueDate).toISOString() : null,
              linkedAssetId: position.id,
            });
          }

          setDebtName('');
          setDebtTotalAmount('');
          setDebtRemainingAmount('');
          setDebtInterestRate('');
          setDebtMonthlyPayment('');
          setDebtType('MORTGAGE');
          setDebtDueDate('');
        },
      },
    );
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPosition) return;

    const parsedDate = eventDate ? new Date(eventDate).toISOString() : new Date().toISOString();
    
    createEventMutation.mutate({
      investmentId: selectedPosition.id,
      type: eventType,
      amount: Number(eventAmount) || 0,
      date: parsedDate,
      observations: eventObs,
      currency: selectedPosition.currency
    }, {
      onSuccess: () => {
        setSelectedPosition(null);
        setEventType('PROFIT_DISTRIBUTION');
        setEventAmount('');
        setEventDate('');
        setEventObs('');
      }
    });
  };

  const displayValuationMode = useGlobalStore((s) => s.displayValuationMode);
  const valuationAsOfDate = useGlobalStore((s) => s.valuationAsOfDate);

  const positionLineInputs = useMemo(
    () => linesFromPositions(positions, valuationAsOfDate),
    [positions, valuationAsOfDate],
  );

  const { data: posPresRows, isLoading: posPresLoading } = useValuationPresentation(
    positionLineInputs,
    positionLineInputs.length > 0,
  );

  const chartCurrency = presentedCurrencyFromRows(
    posPresRows,
    displayValuationMode,
  );

  const presentedById = useMemo(() => {
    if (!posPresRows) return undefined;
    const m: Record<string, { capital: number; value: number; currency: string }> =
      {};
    for (const p of positions) {
      const c = posPresRows.find((r) => r.id === `${p.id}-cap`);
      const v = posPresRows.find((r) => r.id === `${p.id}-val`);
      if (c && v) {
        m[p.id] = {
          capital: c.presentedAmount,
          value: v.presentedAmount,
          currency: c.presentedCurrency,
        };
      }
    }
    return m;
  }, [posPresRows, positions]);

  const positionsPieData = useMemo(() => {
    return positions.reduce((acc: any[], curr: any) => {
      const typeName = curr.type?.name || 'Otro';
      const presented = presentedById?.[curr.id]?.value;
      const amount =
        presented != null ? presented : Number(curr.currentEstimatedValue);
      const existing = acc.find((item) => item.name === typeName);
      if (existing) existing.value += amount;
      else acc.push({ name: typeName, value: amount });
      return acc;
    }, []);
  }, [positions, presentedById]);

  const positionBarChartData = useMemo(() => {
    return positions.map((p: any) => {
      const pres = presentedById?.[p.id];
      return {
        name: p.name,
        capital: pres != null ? pres.capital : Number(p.initialCapital),
        valor: pres != null ? pres.value : Number(p.currentEstimatedValue),
      };
    });
  }, [positions, presentedById]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-wrap justify-between items-end gap-3 border-b border-slate-200/50 pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <PieChartIcon className="w-5 h-5 text-blue-600" />
            </div>
            Portafolio
          </h1>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            Registra tus activos y realiza un seguimiento detallado de capital, valorización y flujo.
          </p>
          <p className="text-slate-500 mt-2 text-[11px] leading-relaxed max-w-2xl">
            <Link
              href="/investment-types"
              className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 underline-offset-2 hover:underline"
            >
              <Settings2 className="w-3.5 h-3.5 shrink-0 text-slate-500" aria-hidden />
              Categorías de patrimonio
            </Link>
            <span className="font-normal text-slate-500">
              {' '}
              — definí vos las categorías usadas al crear cada posición.
            </span>
          </p>
        </div>
        <ConfidenceBadge confidence={positionsConfidence} />
      </header>

      <InsightsContextStrip
        insights={productInsightsPayload?.insights}
        modules={['investments']}
        includeGlobal={false}
        loading={loadingProductInsights}
        max={2}
      />

      {positionsError ? (
        <ErrorState
          title="No se pudieron cargar las posiciones"
          description="No podemos mostrar tu portafolio ahora. Comprueba la conexión o reintenta."
          className="rounded-2xl"
        >
          <button
            type="button"
            onClick={() => void refetchPositions()}
            className="mx-auto rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Reintentar
          </button>
        </ErrorState>
      ) : null}

      {positions.length > 0 && portfolioAnalyticsError ? (
        <ErrorState
          variant="compact"
          title="No se pudo cargar la analítica del portafolio"
          description="Los KPIs y gráficos de analítica no están disponibles. La lista de posiciones sí."
          className="rounded-xl py-4"
        >
          <button
            type="button"
            onClick={() => void refetchPortfolioAnalytics()}
            className="text-xs font-semibold text-rose-900 underline underline-offset-2 hover:text-rose-950"
          >
            Reintentar
          </button>
        </ErrorState>
      ) : null}

      {positions.length > 0 && !portfolioAnalyticsError && (
        <PortfolioAnalyticsSection
          analytics={portfolioAnalytics}
          loading={loadingPortfolioAnalytics}
          chartCurrency={chartCurrency}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        
        <PositionForm
          types={types}
          typeId={typeId}
          setTypeId={setTypeId}
          name={name}
          setName={setName}
          initialCapital={initialCapital}
          setInitialCapital={setInitialCapital}
          currency={currency}
          setCurrency={setCurrency}
          startDate={startDate}
          setStartDate={setStartDate}
          patrimonyLeg={patrimonyLeg}
          setPatrimonyLeg={setPatrimonyLeg}
          generatesPeriodicIncome={generatesPeriodicIncome}
          setGeneratesPeriodicIncome={setGeneratesPeriodicIncome}
          expectedPeriodicIncomeAmount={expectedPeriodicIncomeAmount}
          setExpectedPeriodicIncomeAmount={setExpectedPeriodicIncomeAmount}
          incomeFrequency={incomeFrequency}
          setIncomeFrequency={setIncomeFrequency}
          nextExpectedDate={nextExpectedDate}
          setNextExpectedDate={setNextExpectedDate}
          onSubmit={handleSubmit}
          isPending={createPositionMutation.isPending || createDebtMutation.isPending}
          allowsLinkedDebt={allowsLinkedDebt}
          linkDebt={linkDebt}
          setLinkDebt={setLinkDebt}
          debtName={debtName}
          setDebtName={setDebtName}
          debtTotalAmount={debtTotalAmount}
          setDebtTotalAmount={setDebtTotalAmount}
          debtRemainingAmount={debtRemainingAmount}
          setDebtRemainingAmount={setDebtRemainingAmount}
          debtInterestRate={debtInterestRate}
          setDebtInterestRate={setDebtInterestRate}
          debtMonthlyPayment={debtMonthlyPayment}
          setDebtMonthlyPayment={setDebtMonthlyPayment}
          debtType={debtType}
          setDebtType={setDebtType}
          debtDueDate={debtDueDate}
          setDebtDueDate={setDebtDueDate}
          submitError={submitError}
        />

        <div className="lg:col-span-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Posiciones</h3>
            {loading && <Activity className="w-5 h-5 text-blue-500 animate-spin" />}
          </div>

          <PositionCharts
            pieData={positionsPieData}
            positions={positions}
            barChartData={positionBarChartData}
            chartCurrency={chartCurrency}
          />
          
          <PositionList 
            positions={positions}
            presentedById={presentedById}
            presentationLoading={posPresLoading}
            onSelectPosition={setSelectedPosition}
            onEditPosition={setEditPosition}
            onDeletePosition={(id) => deletePositionMutation.mutate(id)}
            isDeleting={deletePositionMutation.isPending}
          />

          {positions.length === 0 && !loading && (
            <div className="glass-card border-dashed border-slate-300 p-12 rounded-xl text-center text-slate-500 flex flex-col items-center gap-3">
              <PieChartIcon className="w-10 h-10 text-slate-300" />
              <p className="font-semibold text-base">No tienes posiciones de patrimonio registradas.</p>
            </div>
          )}
        </div>

      </div>

      <PositionEventModal 
        selectedPosition={selectedPosition}
        setSelectedPosition={setSelectedPosition}
        eventType={eventType} setEventType={setEventType}
        eventAmount={eventAmount} setEventAmount={setEventAmount}
        eventDate={eventDate} setEventDate={setEventDate}
        eventObs={eventObs} setEventObs={setEventObs}
        onSubmit={handleEventSubmit}
        isPending={createEventMutation.isPending}
      />

      <PositionEditModal
        position={editPosition}
        types={types}
        onClose={() => setEditPosition(null)}
        isPending={updatePositionMutation.isPending}
        onSave={(body) => {
          if (!editPosition?.id) return;
          updatePositionMutation.mutate(
            { id: editPosition.id, body },
            { onSuccess: () => setEditPosition(null) },
          );
        }}
      />
    </div>
  );
}