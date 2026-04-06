'use client';

import React, { useMemo } from 'react';
import { Scale, Shield, AlertTriangle, RefreshCw, CheckCircle2, Circle } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { formatBookAmount } from '@/features/currency/format';
import type { TaxPlanningOverview } from '../types/taxPlanningOverview';

const PIE_COLORS = ['#4f46e5', '#059669', '#d97706', '#7c3aed', '#db2777', '#64748b'];

function fmtCop(n: number) {
  return formatBookAmount(n, 'COP');
}

function riskBadgeClass(level: string) {
  switch (level) {
    case 'BAJO':
      return 'bg-emerald-50 text-emerald-900 border-emerald-200';
    case 'MEDIO':
      return 'bg-amber-50 text-amber-900 border-amber-200';
    case 'ALTO':
      return 'bg-rose-50 text-rose-900 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-800 border-slate-200';
  }
}

export type TaxPlanningDashboardProps = {
  data: TaxPlanningOverview | undefined;
  loading: boolean;
};

export function TaxPlanningDashboard({ data, loading }: TaxPlanningDashboardProps) {
  const pieData = useMemo(() => {
    if (!data?.incomeComposition.length) return [];
    return data.incomeComposition.map((r) => ({
      name: r.label,
      value: r.annualAmount,
      sharePct: r.sharePct,
    }));
  }, [data]);

  const taxBarData = useMemo(() => {
    if (!data?.scenariosComparison.length) return [];
    return data.scenariosComparison.map((s) => ({
      name: s.name.length > 22 ? `${s.name.slice(0, 20)}…` : s.name,
      fullName: s.name,
      impuesto: s.estimatedNetTaxPayable,
      base: s.estimatedTaxableBase,
    }));
  }, [data]);

  const benefitsChart = useMemo(() => {
    if (!data?.benefits.length) return [];
    return data.benefits.map((b) => ({
      name: b.label.length > 28 ? `${b.label.slice(0, 26)}…` : b.label,
      fullLabel: b.label,
      activo: b.enabledInProfile ? 1 : 0,
      pendiente: b.enabledInProfile ? 0 : 1,
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/40 p-4 mb-4 animate-pulse">
        <div className="h-5 bg-indigo-100 rounded w-1/2 mb-3" />
        <div className="h-32 bg-white/80 rounded-lg" />
      </div>
    );
  }

  if (!data) return null;

  const { framing, profileSnapshot, routes, needsRecalculation } = data;

  return (
    <section className="space-y-4 mb-6">
      <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 shrink-0">
            <Scale className="w-5 h-5 text-indigo-700" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-indigo-950 tracking-tight">{framing.title}</h2>
            <p className="text-[11px] text-indigo-900/90 leading-relaxed mt-1">{framing.intro}</p>
            <ul className="mt-2 space-y-1 list-disc pl-4 text-[11px] text-indigo-900/85">
              {framing.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {needsRecalculation && profileSnapshot ? (
        <div
          className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-950"
          role="status"
        >
          <RefreshCw className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span>
            No hay plan fiscal reciente o está incompleto. Usa <strong>Recalcular motor</strong> para
            actualizar escenarios y esta vista.
          </span>
        </div>
      ) : null}

      {profileSnapshot ? (
        <div className="glass-card rounded-xl p-4 border border-slate-200/80">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-600" />
            Perfil fiscal (referencia)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div>
              <p className="text-slate-500 font-medium">Año / jurisdicción</p>
              <p className="font-semibold text-slate-900">
                {profileSnapshot.taxYear} · {profileSnapshot.jurisdiction}
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Residencia</p>
              <p className="font-semibold text-slate-900">
                {profileSnapshot.isResident ? 'Residente' : 'No residente'} ·{' '}
                {profileSnapshot.daysInCountry} días
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Exterior</p>
              <p className="font-semibold text-slate-900">
                Ingreso ext.: {profileSnapshot.hasForeignIncome ? 'Sí' : 'No'} · Patrim. ext.:{' '}
                {profileSnapshot.hasForeignAssets ? 'Sí' : 'No'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Motor</p>
              <p className="font-mono text-[10px] text-slate-800">{data.engineVersion}</p>
            </div>
          </div>
          <ul className="mt-3 text-[11px] text-slate-600 space-y-0.5 list-disc pl-4">
            {data.annualPlanHighlights.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4 border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Ruta más prudente</h3>
          <p className="text-[10px] text-slate-500 mb-3">
            Estimación sobre ingreso bruto sin asumir deducciones adicionales (enfoque conservador).
          </p>
          {routes.prudent ? (
            <>
              <p className="text-xs font-semibold text-slate-800 mb-2">{routes.prudent.name}</p>
              <p className="text-[11px] text-slate-600 leading-relaxed mb-3">{routes.prudent.description}</p>
              <div className="flex flex-wrap gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Base gravable</span>
                  <p className="font-bold text-slate-900 tabular-nums">
                    {fmtCop(routes.prudent.estimatedTaxableBase)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Impuesto estimado</span>
                  <p className="font-bold text-slate-900 tabular-nums">
                    {fmtCop(routes.prudent.estimatedNetTaxPayable)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500">Genera un plan fiscal para ver esta ruta.</p>
          )}
        </div>

        <div className="glass-card rounded-xl p-4 border-2 border-indigo-200 bg-indigo-50/30">
          <h3 className="text-sm font-bold text-indigo-950 mb-1">Ruta con beneficios del perfil</h3>
          <p className="text-[10px] text-indigo-900/80 mb-3">
            Eficiencia tributaria <strong>condicionada</strong> a validar beneficios con soportes y topes
            legales.
          </p>
          {routes.efficientSubjectToValidation ? (
            <>
              <p className="text-xs font-semibold text-indigo-950 mb-2">
                {routes.efficientSubjectToValidation.name}
              </p>
              <p className="text-[11px] text-indigo-900/85 leading-relaxed mb-2">
                {routes.efficientSubjectToValidation.description}
              </p>
              <p className="text-[10px] text-indigo-800/90 italic border-l-2 border-indigo-400 pl-2 mb-3">
                {routes.efficientSubjectToValidation.validationNote}
              </p>
              <div className="flex flex-wrap gap-4 text-xs mb-2">
                <div>
                  <span className="text-indigo-700/80">Base gravable</span>
                  <p className="font-bold text-indigo-950 tabular-nums">
                    {fmtCop(routes.efficientSubjectToValidation.estimatedTaxableBase)}
                  </p>
                </div>
                <div>
                  <span className="text-indigo-700/80">Impuesto neto estimado</span>
                  <p className="font-bold text-indigo-950 tabular-nums">
                    {fmtCop(routes.efficientSubjectToValidation.estimatedNetTaxPayable)}
                  </p>
                </div>
                <div>
                  <span className="text-indigo-700/80">Riesgo (motor)</span>
                  <p className="font-mono text-[10px] text-indigo-900">
                    {routes.efficientSubjectToValidation.riskLevel}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-indigo-800/80">Recalcula el motor para ver esta estimación.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4 border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Composición fiscal de ingresos (sugerida)</h3>
          {pieData.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={40}
                    outerRadius={68}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: unknown) => fmtCop(Number(v))}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Sin ingresos clasificados en Cashflow.</p>
          )}
        </div>

        <div className="glass-card rounded-xl p-4 border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Impuesto estimado por escenario</h3>
          {taxBarData.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taxBarData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} height={48} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(Number(v) / 1e6).toFixed(0)}M`} />
                  <Tooltip formatter={(v: unknown) => fmtCop(Number(v))} />
                  <Bar dataKey="impuesto" name="Impuesto neto" fill="#6366f1" radius={[2, 2, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Sin escenarios. Recalcula el motor.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4 border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Base gravable estimada por escenario</h3>
          {taxBarData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taxBarData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} height={48} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(Number(v) / 1e6).toFixed(0)}M`} />
                  <Tooltip formatter={(v: unknown) => fmtCop(Number(v))} />
                  <Bar dataKey="base" name="Base gravable" fill="#94a3b8" radius={[2, 2, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>

        <div className="glass-card rounded-xl p-4 border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Beneficios del perfil (activación)</h3>
          <p className="text-[10px] text-slate-500 mb-3">
            1 = marcado en perfil; revisa certificados aunque esté activo.
          </p>
          {benefitsChart.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={benefitsChart}
                  layout="vertical"
                  margin={{ top: 4, right: 8, left: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 1]} hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 8 }}
                  />
                  <Tooltip
                    formatter={(v: unknown, name) =>
                      String(name) === 'activo'
                        ? [`${v}`, 'Indicado en perfil']
                        : [`${v}`, 'Pendiente de indicar']
                    }
                  />
                  <Bar dataKey="activo" stackId="a" fill="#10b981" name="activo" barSize={14} />
                  <Bar dataKey="pendiente" stackId="a" fill="#e2e8f0" name="pendiente" barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 border border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Riesgo de cumplimiento por clasificación de ingreso
        </h3>
        <p className="text-[10px] text-slate-500 mb-3">
          Indica cuánto apoyo documental conviene reforzar antes de declarar (no es sanción ni probabilidad DIAN).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-2">Ingreso</th>
                <th className="py-2 pr-2">Cédula sugerida</th>
                <th className="py-2 pr-2">Nivel</th>
                <th className="py-2">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {data.classificationRiskRows.map((row, i) => (
                <tr key={`${row.referenceId}-${i}`} className="border-b border-slate-100 align-top">
                  <td className="py-2 pr-2 font-medium text-slate-800">{row.streamName}</td>
                  <td className="py-2 pr-2 font-mono text-[10px] text-slate-700">{row.suggestedCedula}</td>
                  <td className="py-2 pr-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold ${riskBadgeClass(row.complianceRiskLevel)}`}
                    >
                      {row.complianceRiskLevel}
                    </span>
                  </td>
                  <td className="py-2 text-slate-600">{row.complianceRiskDetail}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.classificationRiskRows.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">Sin filas; ejecuta el análisis fiscal.</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4 border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Checklist de soportes (mapa)</h3>
          <div className="space-y-4">
            {data.supportChecklist.map((sec) => (
              <div key={sec.category}>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-2">
                  {sec.category}
                </p>
                <ul className="space-y-2">
                  {sec.items.map((item, j) => (
                    <li key={j} className="flex gap-2 text-[11px] text-slate-700">
                      <Circle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {data.supportChecklist.length === 0 ? (
              <p className="text-xs text-slate-500">Sin ítems: recalcula o completa ingresos.</p>
            ) : null}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Beneficios posibles (detalle)</h3>
          <ul className="space-y-3">
            {data.benefits.map((b) => (
              <li
                key={b.id}
                className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 text-[11px]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-900">{b.label}</span>
                  {b.enabledInProfile ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-label="Indicado en perfil" />
                  ) : (
                    <span className="text-[10px] text-amber-800 font-medium">Revisar perfil</span>
                  )}
                </div>
                {b.typicalSupports.length ? (
                  <p className="text-[10px] text-slate-600 mt-1">
                    Soportes típicos: {b.typicalSupports.join(' ')}
                  </p>
                ) : null}
                {b.conditionsPending.map((c, idx) => (
                  <p key={idx} className="text-[10px] text-amber-900 mt-1">
                    {c}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {data.pendingConditions.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4">
          <h3 className="text-sm font-bold text-amber-950 mb-2">Condiciones pendientes (resumen)</h3>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-950/95">
            {data.pendingConditions.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.estimatedTaxBurden.conservativeNet != null &&
        data.estimatedTaxBurden.optimizedNet != null &&
        data.estimatedTaxBurden.difference != null ? (
        <div className="text-center text-[11px] text-slate-600 border border-dashed border-slate-200 rounded-lg py-2 px-3">
          Diferencia orientativa entre escenario prudente y escenario con beneficios del perfil:{' '}
          <strong className="text-slate-900 tabular-nums">{fmtCop(data.estimatedTaxBurden.difference)}</strong>{' '}
          (no es ahorro garantizado hasta validar soportes).
        </div>
      ) : null}
    </section>
  );
}
