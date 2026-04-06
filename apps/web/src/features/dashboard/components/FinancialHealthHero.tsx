import React from 'react';
import { Sparkles } from 'lucide-react';
import type { HeroRecommendation } from '@/features/dashboard/model/financialHealthRecommendation';

const toneStyles: Record<
  HeroRecommendation['tone'],
  { border: string; bg: string; icon: string; title: string }
> = {
  positive: {
    border: 'border-emerald-200/90',
    bg: 'from-emerald-50/90 to-white',
    icon: 'text-emerald-600',
    title: 'text-emerald-950',
  },
  warning: {
    border: 'border-amber-200/90',
    bg: 'from-amber-50/90 to-white',
    icon: 'text-amber-600',
    title: 'text-amber-950',
  },
  neutral: {
    border: 'border-slate-200/90',
    bg: 'from-slate-50/90 to-white',
    icon: 'text-slate-600',
    title: 'text-slate-900',
  },
};

export function FinancialHealthHero({ hero }: { hero: HeroRecommendation }) {
  const s = toneStyles[hero.tone];
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border ${s.border} bg-gradient-to-br ${s.bg} p-5 shadow-sm`}
    >
      <div className="flex gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm ${s.icon}`}
        >
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-bold uppercase tracking-wide ${s.title}`}>
            Insight principal
          </p>
          <h2 className="mt-1 text-base font-bold text-slate-900 leading-snug">
            {hero.title}
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{hero.detail}</p>
        </div>
      </div>
    </section>
  );
}
