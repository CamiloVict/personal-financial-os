import type { FinancialConfidence } from '@personal-finance-os/explanation';
import React from 'react';
import Link from 'next/link';
import { ConfidenceBadge } from '@/shared/ui/ConfidenceBadge';
import { formatBookAmount, formatPresentedAmount } from '@/features/currency/format';

interface TopInvestmentsProps {
  positions: any[];
  confidence?: FinancialConfidence | null;
  presentedById?: Record<
    string,
    { capital: number; value: number; currency: string }
  >;
  presentationLoading?: boolean;
}

export function TopInvestments({
  positions,
  confidence,
  presentedById,
  presentationLoading,
}: TopInvestmentsProps) {
  return (
    <div className="glass-card rounded-xl p-4 flex-1 flex flex-col">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
        <h3 className="text-xs font-bold text-slate-800">Principales posiciones</h3>
        <div className="flex flex-wrap items-center gap-2">
          <ConfidenceBadge confidence={confidence} />
          <Link href="/investment-positions" className="text-[9px] text-blue-600 hover:underline">Ver todo</Link>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {positions.length === 0 ? (
          <div className="text-center text-slate-400 text-[10px] py-4">No hay posiciones registradas</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {positions.slice(0, 5).map((pos: any) => (
              <li key={pos.id} className="py-2 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-800 text-xs">{pos.name}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{pos.type?.name}</p>
                </div>
                <div className="text-right">
                  {presentationLoading && !presentedById?.[pos.id] ? (
                    <p className="font-bold text-slate-500 text-xs">…</p>
                  ) : presentedById?.[pos.id] ? (
                    <>
                      <p className="font-bold text-slate-900 text-xs">
                        {formatPresentedAmount(
                          presentedById[pos.id].value,
                          presentedById[pos.id].currency,
                        )}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        Nom.:{' '}
                        {formatBookAmount(
                          Number(pos.currentEstimatedValue),
                          pos.currency ?? 'USD',
                        )}
                      </p>
                      <p className="text-[9px] text-slate-400">
                        Cap nom.:{' '}
                        {formatBookAmount(
                          Number(pos.initialCapital),
                          pos.currency ?? 'USD',
                        )}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-slate-900 text-xs">
                        {formatBookAmount(
                          Number(pos.currentEstimatedValue),
                          pos.currency ?? 'USD',
                        )}
                      </p>
                      <p className="text-[9px] text-slate-400">
                        Cap:{' '}
                        {formatBookAmount(
                          Number(pos.initialCapital),
                          pos.currency ?? 'USD',
                        )}
                      </p>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}