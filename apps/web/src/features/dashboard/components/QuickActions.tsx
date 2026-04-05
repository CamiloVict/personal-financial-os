import React from 'react';
import Link from 'next/link';
import { PieChart as PieChartIcon, PlusCircle, Settings } from 'lucide-react';

export function QuickActions() {
  return (
    <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md relative overflow-hidden">
      <div className="absolute -right-5 -top-5 text-white/5 opacity-20 pointer-events-none">
        <PieChartIcon className="w-24 h-24" />
      </div>
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold mb-0.5">Administración</h3>
          <p className="text-slate-400 text-[9px] mb-0">Atajos rápidos del OS.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/investment-positions" className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-md font-semibold transition-all text-[10px] flex items-center gap-1">
            <PlusCircle className="w-3 h-3" /> Inversión
          </Link>
          <Link href="/tax" className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-md font-semibold transition-all text-[10px] flex items-center gap-1">
            <Settings className="w-3 h-3" /> Impuestos
          </Link>
        </div>
      </div>
    </div>
  );
}