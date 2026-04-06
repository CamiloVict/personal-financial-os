import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  PiggyBank,
  Scale,
  TrendingUp,
  Wallet,
} from 'lucide-react';

export type FinancialHealthKpiStripProps = {
  loading?: boolean;
  income: number | null;
  expense: number | null;
  savings: number | null;
  savingsRatePct: number | null;
  totalDebt: number | null;
  netWorthApprox: number | null;
  portfolioValue: number | null;
  totalReturn: number | null;
  returnPct: number | null;
  fmt: (n: number) => string;
};

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent: string;
  loading?: boolean;
}) {
  return (
    <div className="kpi-tile">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <div className={`rounded-md p-1 ${accent}`}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </div>
      </div>
      <p className="mt-1.5 text-lg font-bold tabular-nums tracking-tight text-slate-900">
        {loading ? '…' : value}
      </p>
      {sub ? (
        <p className="mt-0.5 text-[10px] text-slate-400 leading-snug">{sub}</p>
      ) : null}
    </div>
  );
}

export function FinancialHealthKpiStrip({
  loading,
  income,
  expense,
  savings,
  savingsRatePct,
  totalDebt,
  netWorthApprox,
  portfolioValue,
  totalReturn,
  returnPct,
  fmt,
}: FinancialHealthKpiStripProps) {
  const rateStr =
    savingsRatePct === null ? '—' : `${(savingsRatePct * 100).toFixed(1)} %`;
  const retPctStr =
    returnPct === null ? '—' : `${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(1)} %`;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Flujo, deudas y patrimonio (pasivos en Deudas; activos en posiciones)
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Ingresos (mes)"
          value={income === null ? '—' : fmt(income)}
          icon={ArrowUpRight}
          accent="bg-emerald-50 text-emerald-600"
          loading={loading}
        />
        <Kpi
          label="Gastos (mes)"
          value={expense === null ? '—' : fmt(expense)}
          icon={ArrowDownRight}
          accent="bg-rose-50 text-rose-600"
          loading={loading}
        />
        <Kpi
          label="Ahorro neto"
          value={savings === null ? '—' : fmt(savings)}
          icon={PiggyBank}
          accent="bg-indigo-50 text-indigo-600"
          loading={loading}
        />
        <Kpi
          label="Tasa de ahorro"
          value={loading ? '…' : rateStr}
          sub="Sobre ingresos modelados"
          icon={Wallet}
          accent="bg-sky-50 text-sky-600"
          loading={loading}
        />
        <Kpi
          label="Deuda total"
          value={totalDebt === null ? '—' : fmt(totalDebt)}
          icon={Scale}
          accent="bg-violet-50 text-violet-600"
          loading={loading}
        />
        <Kpi
          label="Patrimonio neto (est.)"
          value={netWorthApprox === null ? '—' : fmt(netWorthApprox)}
          sub="Todas las posiciones activas − deuda libro (incl. bienes de uso si los registrás)"
          icon={Landmark}
          accent="bg-slate-100 text-slate-700"
          loading={loading}
        />
        <Kpi
          label="Valor portafolio"
          value={portfolioValue === null ? '—' : fmt(portfolioValue)}
          sub="Solo categorías de portafolio financiero (excl. uso, ej. auto particular)"
          icon={TrendingUp}
          accent="bg-blue-50 text-blue-600"
          loading={loading}
        />
        <Kpi
          label="Retorno acumulado"
          value={
            loading
              ? '…'
              : totalReturn === null
                ? '—'
                : `${totalReturn >= 0 ? '+' : ''}${fmt(Math.abs(totalReturn))}`
          }
          sub={loading ? undefined : `Retorno ${retPctStr}`}
          icon={TrendingUp}
          accent={
            totalReturn !== null && totalReturn >= 0
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-rose-50 text-rose-600'
          }
          loading={loading}
        />
      </div>
    </div>
  );
}
