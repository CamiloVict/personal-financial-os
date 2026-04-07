'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  useSimulateAllocatorScenarios,
  useAllocatorSavedLatest,
  useSaveAllocatorSnapshot,
  useDeleteAllocatorSnapshot,
} from '@/features/allocator/api/queries';
import type { AllocatorEntryMeta, AllocatorPlan } from '@/features/allocator/types';
import {
  AllocatorPageHeader,
  AllocatorCapitalForm,
  AllocatorScenariosSection,
  AllocatorSnapshotBar,
  AllocatorPrimaryRecommendation,
  AllocatorQuickCapitalChips,
} from '@/features/allocator/components';
import { ExplanationPanel } from '@/shared/ui/ExplanationPanel';
import { ConfidenceBadge } from '@/shared/ui/ConfidenceBadge';
import { useValuationPresentation } from '@/features/currency/hooks/useValuationPresentation';
import {
  linesFromAllocatorPlan,
  presentedCurrencyFromRows,
} from '@/features/currency/valuationUtils';
import { useGlobalStore } from '@/shared/store/global';
import {
  allocatorInputCurrency,
  allocatorInputHelpText,
} from '@/features/allocator/utils/allocatorInputCurrency';
import {
  toBookUsd,
  fromBookUsdToInputAmount,
} from '@/features/allocator/utils/bookUsdConversion';
import { ApiRequestError } from '@/shared/api/api-error';

export default function AllocatorPage() {
  const simulateMutation = useSimulateAllocatorScenarios();
  const { data: savedLatest, isLoading: savedLoading } =
    useAllocatorSavedLatest();
  const saveSnapshot = useSaveAllocatorSnapshot();
  const deleteSnapshot = useDeleteAllocatorSnapshot();
  const valuationAsOfDate = useGlobalStore((s) => s.valuationAsOfDate);
  const displayValuationMode = useGlobalStore((s) => s.displayValuationMode);

  const [availableCapital, setAvailableCapital] = useState('');
  const [plan, setPlan] = useState<AllocatorPlan | null>(null);
  const [capitalError, setCapitalError] = useState<string | null>(null);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [entryMeta, setEntryMeta] = useState<AllocatorEntryMeta | null>(null);

  const inputCurrency = useMemo(
    () => allocatorInputCurrency(displayValuationMode),
    [displayValuationMode],
  );
  const inputHelpText = useMemo(
    () => allocatorInputHelpText(displayValuationMode, valuationAsOfDate),
    [displayValuationMode, valuationAsOfDate],
  );

  useEffect(() => {
    setEntryMeta(null);
  }, [displayValuationMode, valuationAsOfDate]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!availableCapital || Number(availableCapital) <= 0) return;

    setCapitalError(null);
    setSubmitBusy(true);

    void (async () => {
      const raw = Number(availableCapital);
      try {
        const bookUsd = await toBookUsd(raw, inputCurrency, valuationAsOfDate);
        if (!Number.isFinite(bookUsd) || bookUsd <= 0) {
          setSubmitBusy(false);
          setCapitalError('Monto inválido tras la conversión a USD libro.');
          return;
        }
        simulateMutation.mutate(bookUsd, {
          onSuccess: (data) => {
            setPlan(data as AllocatorPlan);
            setEntryMeta({
              inputCurrency,
              inputAmount: raw,
              bookUsdAmount: bookUsd,
              valuationAsOfDate,
            });
          },
          onError: (err) => {
            const msg =
              err instanceof ApiRequestError
                ? err.message
                : err instanceof Error
                  ? err.message
                  : 'Error al simular.';
            setCapitalError(msg);
          },
          onSettled: () => setSubmitBusy(false),
        });
      } catch (err) {
        setSubmitBusy(false);
        const msg =
          err instanceof ApiRequestError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'No se pudo convertir a USD libro. Revisá la fecha de valuación y las cotizaciones.';
        setCapitalError(msg);
      }
    })();
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
    const assignedFromCards = plan.scenarios.reduce((acc, sc) => {
      const mod = find(`alloc-mod-${sc.id}`);
      return acc + (mod?.presentedAmount ?? 0);
    }, 0);
    const allMainLinesOk = plan.scenarios.every(
      (sc) => find(`alloc-mod-${sc.id}`) != null,
    );
    const assigned = allMainLinesOk
      ? assignedFromCards
      : available - un.presentedAmount;
    const unallocated = Math.max(0, available - assigned);
    const byScenario: Record<
      string,
      { modeled: number; expectedReturn: number }
    > = {};
    const fillByScenario = (sc: { id: string }) => {
      const mod = find(`alloc-mod-${sc.id}`);
      const ret = find(`alloc-ret-${sc.id}`);
      if (mod && ret) {
        byScenario[sc.id] = {
          modeled: mod.presentedAmount,
          expectedReturn: ret.presentedAmount,
        };
      }
    };
    for (const sc of plan.scenarios) {
      fillByScenario(sc);
    }
    for (const sc of plan.surplusAlternatives ?? []) {
      fillByScenario(sc);
    }
    for (const menu of plan.capitalBlendMenus ?? []) {
      for (const sc of menu.scenarios) {
        fillByScenario(sc);
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

  const formBusy = submitBusy || simulateMutation.isPending;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <AllocatorPageHeader />

      <AllocatorSnapshotBar
        saved={savedLatest ?? null}
        savedLoading={savedLoading}
        hasPlan={Boolean(plan)}
        onSave={() => {
          if (plan) saveSnapshot.mutate(plan);
        }}
        onRestore={() => {
          void (async () => {
            if (!savedLatest) return;
            const p = savedLatest.plan;
            setPlan(p);
            setEntryMeta(null);
            setCapitalError(null);
            try {
              const displayAmount = await fromBookUsdToInputAmount(
                p.availableCapital,
                inputCurrency,
                valuationAsOfDate,
              );
              const rounded =
                inputCurrency === 'COP'
                  ? Math.round(displayAmount)
                  : Math.round(displayAmount * 100) / 100;
              setAvailableCapital(String(rounded));
            } catch {
              setAvailableCapital(String(p.availableCapital));
            }
          })();
        }}
        onForget={() => {
          deleteSnapshot.mutate();
          setEntryMeta(null);
        }}
        isSaving={saveSnapshot.isPending}
        isForgetting={deleteSnapshot.isPending}
      />

      <AllocatorQuickCapitalChips
        inputCurrency={inputCurrency}
        onPick={(n) => setAvailableCapital(String(n))}
        disabled={formBusy}
      />
      <AllocatorCapitalForm
        availableCapital={availableCapital}
        onCapitalChange={setAvailableCapital}
        onSubmit={handleGenerate}
        isPending={formBusy}
        inputCurrency={inputCurrency}
        helpText={inputHelpText}
        errorMessage={capitalError}
      />

      {plan ? (
        <>
          <AllocatorPrimaryRecommendation plan={plan} />
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
            entryMeta={entryMeta}
          />
        </>
      ) : null}
    </div>
  );
}
