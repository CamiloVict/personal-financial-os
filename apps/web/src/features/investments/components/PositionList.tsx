import React from 'react';
import { Calendar, ListPlus, Pencil, Trash2 } from 'lucide-react';
import { formatBookAmount, formatPresentedAmount } from '@/features/currency/format';
import { periodicIncomeMonthlyEquivalent } from '@/features/investments/utils/periodicIncomeMonthlyEquivalent';

function PositionProgressBlock({ pos }: { pos: any }) {
  const cap = Number(pos.initialCapital);
  const val = Number(pos.currentEstimatedValue);
  const roiPct = cap > 0 ? ((val - cap) / cap) * 100 : null;
  const ratioPct = cap > 0 ? Math.min(150, Math.max(0, (val / cap) * 100)) : 0;
  const events = pos._count?.events ?? 0;
  return (
    <div className="px-5 pb-3 border-b border-slate-100 bg-white/50">
      <div className="flex flex-wrap justify-between items-center gap-2 text-[10px] text-slate-500 mb-1">
        <span className="font-semibold uppercase tracking-wide">
          Progreso (nominal, libro)
        </span>
        {roiPct != null ? (
          <span
            className={`font-bold tabular-nums ${roiPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
          >
            {roiPct >= 0 ? '+' : ''}
            {roiPct.toFixed(1)}% rendimiento
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${ratioPct}%` }}
          title="Valor actual / capital (tope visual 150%)"
        />
      </div>
      <p className="text-[9px] text-slate-400 mt-1">
        {events} movimiento{events === 1 ? '' : 's'} registrado
        {events === 1 ? '' : 's'}
        {events > 0
          ? ' · Los aportes, retiros y reinversiones actualizan capital y valor vía “Registrar evento”.'
          : ' · Usa “Registrar evento” para aportes, reinversión de utilidades o cambios de valorización.'}
      </p>
    </div>
  );
}

function periodicIncomeLabel(freq: string | null | undefined): string {
  const m: Record<string, string> = {
    MONTHLY: 'mes',
    QUARTERLY: 'trimestre',
    ANNUALLY: 'año',
    WEEKLY: 'semana',
    BIWEEKLY: 'quincena',
    BIMONTHLY: 'bimestre',
    FOUR_MONTHLY: 'cuatrimestre',
    SEMIANNUALLY: 'semestre',
    CUSTOM: 'período personalizado',
  };
  return m[freq ?? ''] ?? 'período';
}

interface PositionListProps {
  positions: any[];
  onSelectPosition: (pos: any) => void;
  onEditPosition?: (pos: any) => void;
  onDeletePosition: (id: string) => void;
  isDeleting: boolean;
  /** Valuación coherente (mismo modo que barra global) */
  presentedById?: Record<
    string,
    { capital: number; value: number; currency: string }
  >;
  presentationLoading?: boolean;
}

export function PositionList({
  positions,
  onSelectPosition,
  onEditPosition,
  onDeletePosition,
  isDeleting,
  presentedById,
  presentationLoading,
}: PositionListProps) {
  return (
    <div className="space-y-4">
      {positions.map(pos => (
        <div
          key={pos.id}
          className="glass-card rounded-xl overflow-hidden transition-all group active:shadow-md [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-md"
        >
          <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50">
            <div>
              <h4 className="text-lg font-bold text-slate-900 tracking-tight">{pos.name}</h4>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="inline-block bg-indigo-100 text-indigo-900 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-indigo-200/80">
                  {pos.type?.name ?? 'Sin tipo'}
                </span>
                {pos.patrimonyLeg === 'LIABILITY' ? (
                  <span className="text-[10px] font-semibold text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                    Pasivo patrimonial
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-full">
                    Activo
                  </span>
                )}
                {pos.type?.generatesCashflow ? (
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                    Genera flujo
                  </span>
                ) : null}
                {pos.type?.fiscalAssetTreatment ? (
                  <span
                    className="text-[10px] text-slate-500 max-w-[220px] truncate"
                    title={pos.type.fiscalAssetTreatment}
                  >
                    {pos.type.fiscalAssetTreatment}
                  </span>
                ) : null}
              </div>
            </div>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
              {pos.status}
            </span>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wide">Capital Base</div>
              {presentationLoading && !presentedById?.[pos.id] ? (
                <div className="text-lg font-bold text-slate-500 tracking-tight">…</div>
              ) : presentedById?.[pos.id] ? (
                <>
                  <div className="text-lg font-bold text-slate-700 tracking-tight">
                    {formatPresentedAmount(
                      presentedById[pos.id].capital,
                      presentedById[pos.id].currency,
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Nom.:{' '}
                    {formatBookAmount(
                      Number(pos.initialCapital),
                      pos.currency ?? 'USD',
                    )}
                  </div>
                </>
              ) : (
                <div className="text-lg font-bold text-slate-700 tracking-tight">
                  {formatBookAmount(
                    Number(pos.initialCapital),
                    pos.currency ?? 'USD',
                  )}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-wide">Valorización Actual</div>
              {presentationLoading && !presentedById?.[pos.id] ? (
                <div className="text-lg font-bold text-blue-400 tracking-tight">…</div>
              ) : presentedById?.[pos.id] ? (
                <>
                  <div className="text-lg font-bold text-blue-600 tracking-tight">
                    {formatPresentedAmount(
                      presentedById[pos.id].value,
                      presentedById[pos.id].currency,
                    )}
                  </div>
                  <div className="text-[10px] text-blue-400/80 mt-0.5">
                    Nom.:{' '}
                    {formatBookAmount(
                      Number(pos.currentEstimatedValue),
                      pos.currency ?? 'USD',
                    )}
                  </div>
                </>
              ) : (
                <div className="text-lg font-bold text-blue-600 tracking-tight">
                  {formatBookAmount(
                    Number(pos.currentEstimatedValue),
                    pos.currency ?? 'USD',
                  )}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold mb-1 flex items-center gap-1 uppercase tracking-wide">
                <Calendar className="w-3 h-3" /> Fecha Inicio
              </div>
              <div className="text-slate-800 font-medium text-sm">{new Date(pos.startDate).toLocaleDateString()}</div>
            </div>
          </div>

          {pos.generatesPeriodicIncome &&
          Number(pos.expectedPeriodicIncomeAmount) > 0 &&
          pos.frequency ? (
            <div className="px-5 py-2 bg-emerald-50/80 border-b border-emerald-100/80 text-xs text-emerald-900">
              <span className="font-semibold">Ingreso esperado: </span>
              {formatBookAmount(
                Number(pos.expectedPeriodicIncomeAmount),
                pos.currency ?? 'USD',
              )}{' '}
              / {periodicIncomeLabel(pos.frequency)}
              {(() => {
                const mo = periodicIncomeMonthlyEquivalent(pos);
                if (mo == null || mo <= 0) return null;
                return (
                  <span className="text-emerald-800/90">
                    {' '}
                    (~
                    {formatBookAmount(mo, pos.currency ?? 'USD')}
                    /mes)
                  </span>
                );
              })()}
            </div>
          ) : null}

          <PositionProgressBlock pos={pos} />

          <div className="p-4 border-t border-slate-100 bg-white flex flex-wrap justify-end gap-3 transition-opacity hover-reveal-actions">
            {onEditPosition ? (
              <button
                type="button"
                onClick={() => onEditPosition(pos)}
                className="touch-manipulation flex items-center gap-2 bg-white border border-slate-200 active:bg-slate-100 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-slate-50 text-slate-700 px-3 py-2 min-h-10 rounded-lg text-xs font-semibold transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Editar
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onSelectPosition(pos)}
              className="touch-manipulation flex items-center gap-2 bg-slate-100 active:bg-slate-300 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-slate-200 text-slate-700 px-3 py-2 min-h-10 rounded-lg text-xs font-semibold transition-colors"
            >
              <ListPlus className="w-3.5 h-3.5" /> Registrar Evento
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => { if(confirm('¿Eliminar?')) { onDeletePosition(pos.id); } }}
              className="touch-manipulation flex items-center gap-2 bg-rose-50 active:bg-rose-200 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-rose-100 text-rose-600 px-3 py-2 min-h-10 rounded-lg text-xs transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}