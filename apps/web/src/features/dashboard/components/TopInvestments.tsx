import React from 'react';
import Link from 'next/link';

interface TopInvestmentsProps {
  positions: any[];
}

export function TopInvestments({ positions }: TopInvestmentsProps) {
  return (
    <div className="glass-card rounded-xl p-4 flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-bold text-slate-800">Top Inversiones</h3>
        <Link href="/investment-positions" className="text-[9px] text-blue-600 hover:underline">Ver todo</Link>
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
                  <p className="font-bold text-slate-900 text-xs">${pos.currentEstimatedValue.toLocaleString()}</p>
                  <p className="text-[9px] text-slate-400">Cap: ${pos.initialCapital.toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}