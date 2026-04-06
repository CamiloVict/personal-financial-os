'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircle, Activity } from 'lucide-react';
import {
  useCashflowStreams,
  useCashflowAnalytics,
} from '@/features/cashflow/api/queries';
import { useTaxAnalytics } from '@/features/tax/api/queries';
import { useInvestmentPositions } from '@/features/investments/api/queries';
import {
  DashboardMetrics,
  CashflowCharts,
  TaxAnalysisChart,
  TopInvestments,
  QuickActions,
} from '@/features/dashboard/components';
import { ExplanationPanel } from '@/shared/ui/ExplanationPanel';

/** Al menos un flujo de caja (ingreso o gasto) o una inversión */
function hasFinancialSetup(
  streams: unknown[],
  positions: unknown[],
) {
  return streams.length > 0 || positions.length > 0;
}

export default function HomePage() {
  const router = useRouter();
  const { data: streams = [], isLoading: loadingStreams } = useCashflowStreams();
  const { data: cashflowAnalytics, isLoading: isLoadingCashflow } =
    useCashflowAnalytics();
  const { data: taxAnalytics, isLoading: isLoadingTax } = useTaxAnalytics();
  const { data: positions = [], isLoading: loadingPositions } =
    useInvestmentPositions();

  const gateReady = !loadingStreams && !loadingPositions;
  const hasSetup = useMemo(
    () => hasFinancialSetup(streams, positions),
    [streams, positions],
  );

  useEffect(() => {
    if (!gateReady || hasSetup) return;
    router.replace('/cashflow');
  }, [gateReady, hasSetup, router]);

  const totalInvested = positions.reduce(
    (acc: number, pos: { initialCapital?: number | string }) =>
      acc + Number(pos.initialCapital),
    0,
  );
  const totalEstimatedValue = positions.reduce(
    (acc: number, pos: { currentEstimatedValue?: number | string }) =>
      acc + Number(pos.currentEstimatedValue),
    0,
  );
  const totalReturn = totalEstimatedValue - totalInvested;
  const returnPercentage =
    totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  const showDashboard = gateReady && hasSetup;

  if (!showDashboard) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
        <Activity className="w-8 h-8 animate-spin" />
        <p className="text-xs text-slate-500">Preparando tu espacio…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end border-b border-slate-200 pb-4 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard Analítico
          </h1>
          <p className="text-slate-500 mt-1 text-xs leading-relaxed">
            Una visión 360° de tus inversiones, flujos de caja y planeación
            fiscal.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/investment-positions"
            className="glass-card hover:bg-blue-600 hover:text-white hover:border-blue-500 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Nueva Inversión
          </Link>
        </div>
      </header>

      <>
        <DashboardMetrics
          totalInvested={totalInvested}
          totalEstimatedValue={totalEstimatedValue}
          totalReturn={totalReturn}
          returnPercentage={returnPercentage}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <CashflowCharts
            isLoading={isLoadingCashflow}
            analytics={cashflowAnalytics}
          />

          <div className="lg:col-span-5 flex flex-col gap-4">
            <TaxAnalysisChart
              isLoading={isLoadingTax}
              analytics={taxAnalytics}
            />
            <ExplanationPanel explanation={taxAnalytics?.explanation} defaultOpen={false} />
            <QuickActions />
          </div>

          <div className="lg:col-span-3">
            <TopInvestments positions={positions} />
          </div>
        </div>
      </>
    </div>
  );
}
