'use client';

import React from 'react';
import Link from 'next/link';
import { PlusCircle, Activity } from 'lucide-react';
import { useCashflowAnalytics } from '@/features/cashflow/api/queries';
import { useTaxAnalytics } from '@/features/tax/api/queries';
import { useInvestmentPositions } from '@/features/investments/api/queries';
import { useGlobalStore } from '@/shared/store/global';

import {
  DashboardMetrics,
  CashflowCharts,
  TaxAnalysisChart,
  TopInvestments,
  QuickActions,
} from '@/features/dashboard/components';

export default function HomePage() {
  const { currentUserId } = useGlobalStore();

  const { data: cashflowAnalytics, isLoading: isLoadingCashflow } =
    useCashflowAnalytics(currentUserId);
  const { data: taxAnalytics, isLoading: isLoadingTax } =
    useTaxAnalytics(currentUserId);
  const { data: positions = [], isLoading: loadingPositions } =
    useInvestmentPositions(currentUserId);

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

  const loading = loadingPositions;

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

      {loading ? (
        <div className="flex justify-center items-center py-10 text-slate-400">
          <Activity className="w-5 h-5 animate-spin" />
        </div>
      ) : (
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
              <QuickActions />
            </div>

            <div className="lg:col-span-3">
              <TopInvestments positions={positions} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
