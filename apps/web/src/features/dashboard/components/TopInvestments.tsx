import type { FinancialConfidence } from '@personal-finance-os/explanation';
import React from 'react';
import Link from 'next/link';
import { ConfidenceBadge } from '@/shared/ui/ConfidenceBadge';
import { formatPresentedAmount } from '@/features/currency/format';

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
        <h3 className="text-xs font-bold text-slate-800">Top Inversiones</h3>
        <div className="flex flex-wrap items-center gap-2">
          <ConfidenceBadge confidence={confidence} />
          <Link href="/investment-positions" className="text-[9px] text-blue-600 hover:underline">Ver todo</Link>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {positions.length === 0 ? (
          <div className="text-center text-slate-400 text-[10px] py-4">No hay inversiones</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {positions.slice(0, 5).map((pos: any) => (
              <li key={pos.id} className="py-2 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-800 text-xs">{pos.name}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{pos.type?.name}</p>
                </div>
                <div className="text-right">
                  {presentedById?.[pos.id] && !presentationLoading ? (
                    <>
                      <p className="font-bold text-slate-900 text-xs">
                        {formatPresentedAmount(
                          presentedById[pos.id].value,
                          presentedById[pos.id].currency,
                        )}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        Nom.: $
                        {Number(pos.currentEstimatedValue).toLocaleString()}{' '}
                        {pos.currency}
                      </p>
                      <p className="text-[9px] text-slate-400">
                        Cap nom.: $
                        {Number(pos.initialCapital).toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-slate-900 text-xs">
                        ${Number(pos.currentEstimatedValue).toLocaleString()}{' '}
                        <span className="text-slate-400 font-normal">
                          {pos.currency}
                        </span>
                      </p>
                      <p className="text-[9px] text-slate-400">
                        Cap: ${Number(pos.initialCapital).toLocaleString()}
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