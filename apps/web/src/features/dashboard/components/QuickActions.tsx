import React from 'react';
import Link from 'next/link';
import {
  PieChart as PieChartIcon,
  PlusCircle,
  Settings,
  Settings2,
} from 'lucide-react';

export function QuickActions() {
  return (
    <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md relative overflow-hidden">
      <div className="absolute -right-5 -top-5 text-white/5 opacity-20 pointer-events-none">
        <PieChartIcon className="w-24 h-24" />
      </div>
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold mb-0.5">Administración</h3>
            <p className="text-slate-400 text-[9px] mb-0">Atajos rápidos del OS.</p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <Link
              href="/investment-positions"
              className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-md font-semibold transition-all text-[10px] flex items-center gap-1"
            >
              <PlusCircle className="w-3 h-3" /> Posición
            </Link>
            <Link
              href="/tax"
              className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-md font-semibold transition-all text-[10px] flex items-center gap-1"
            >
              <Settings className="w-3 h-3" /> Impuestos
            </Link>
          </div>
        </div>
        <div className="border-t border-white/10 pt-3">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
            Configuración del modelo
          </p>
          <p className="text-[9px] text-slate-400 leading-snug mb-2">
            Categorías que alimentan simulaciones y formularios (fondos, bienes, etc.).
          </p>
          <Link
            href="/investment-types"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-white transition-colors hover:bg-white/20"
          >
            <Settings2 className="w-3 h-3 shrink-0" aria-hidden />
            Categorías de patrimonio
          </Link>
        </div>
      </div>
    </div>
  );
}