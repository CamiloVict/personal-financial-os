'use client';

import type { FinancialConfidence } from '@personal-finance-os/explanation';

const LEVEL_EMOJI: Record<FinancialConfidence['level'], string> = {
  HIGH: '🟢',
  MEDIUM: '🟡',
  LOW: '🔴',
};

const LEVEL_LABEL: Record<FinancialConfidence['level'], string> = {
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
};

function tooltipText(c: FinancialConfidence): string {
  const pct = Math.round(c.confidenceScore * 100);
  const reasons =
    c.reasons.length > 0
      ? c.reasons.map((r) => `• ${r}`).join('\n')
      : 'Sin detalles adicionales.';
  return `Confianza ${LEVEL_LABEL[c.level]} (${pct}%)\n${reasons}`;
}

export function ConfidenceBadge({
  confidence,
  className = '',
}: {
  confidence: FinancialConfidence | null | undefined;
  className?: string;
}) {
  if (!confidence) return null;
  const tip = tooltipText(confidence);
  return (
    <span
      className={`inline-flex max-w-full shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm cursor-help ${className}`}
      title={tip}
      role="status"
      aria-label={tip.replace(/\n/g, '. ')}
    >
      <span aria-hidden>{LEVEL_EMOJI[confidence.level]}</span>
      <span>Confianza {LEVEL_LABEL[confidence.level]}</span>
      <span className="font-normal text-slate-400">
        ({Math.round(confidence.confidenceScore * 100)}%)
      </span>
    </span>
  );
}
