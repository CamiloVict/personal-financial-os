import type { FinancialConfidence } from '@personal-finance-os/explanation';
import { Scale } from 'lucide-react';
import { ConfidenceBadge } from '@/shared/ui/ConfidenceBadge';

export function DebtsPageHeader({
  confidence,
}: {
  confidence?: FinancialConfidence | null;
}) {
  return (
    <header className="flex flex-wrap justify-between items-end gap-3 border-b border-slate-200/50 pb-3 mb-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <div className="p-1 bg-indigo-100 rounded-md">
            <Scale className="w-4 h-4 text-indigo-600" />
          </div>
          Deuda Inteligente y Apalancamiento
        </h1>
        <p className="text-slate-500 mt-1 text-[11px] leading-relaxed max-w-3xl">
          Separa la Deuda Mala (que empobrece) de la Deuda Buena (que apalanca activos). Monitorea
          tu ROI real (&quot;Cash-on-Cash&quot;) y tu salud de endeudamiento.
        </p>
      </div>
      <ConfidenceBadge confidence={confidence} />
    </header>
  );
}
