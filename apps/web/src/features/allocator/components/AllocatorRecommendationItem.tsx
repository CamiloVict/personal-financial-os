import { ArrowRight } from 'lucide-react';
import type { AllocatorRecommendation } from '../types';
import { recommendationCardClass, recommendationIcon } from './recommendationMeta';

interface AllocatorRecommendationItemProps {
  rec: AllocatorRecommendation;
  index: number;
}

export function AllocatorRecommendationItem({ rec, index }: AllocatorRecommendationItemProps) {
  return (
    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
      <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-slate-100 text-slate-500 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
        <span className="text-[10px] font-bold">{index + 1}</span>
      </div>

      <div
        className={`glass-card w-[calc(100%-2.5rem)] md:w-[calc(50%-2rem)] p-3.5 rounded-xl shadow-sm border ${recommendationCardClass(rec.type)} transition-all hover:shadow-md`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1.5">
            {recommendationIcon(rec.type)}
            <h3 className="font-bold text-slate-900 text-xs">{rec.title}</h3>
          </div>
          <span className="bg-white text-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm border border-slate-100">
            Puntaje: {rec.priorityScore}
          </span>
        </div>

        <p className="text-[10px] text-slate-600 mb-3 leading-relaxed">{rec.description}</p>

        <div className="bg-white/60 p-2 rounded-md flex justify-between items-center border border-white/40">
          <div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Sugerido
            </p>
            <p className="font-black text-slate-800 text-sm">
              ${Number(rec.suggestedAmount).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Impacto / Retorno
            </p>
            {rec.expectedReturnAmount > 0 ? (
              <p className="font-bold text-emerald-600 text-xs">
                +${Number(rec.expectedReturnAmount).toLocaleString()}{' '}
                <span className="text-[9px]">({rec.returnPercentage}%)</span>
              </p>
            ) : (
              <p className="font-bold text-blue-600 text-xs flex items-center gap-1 justify-end">
                Acelera Meta <ArrowRight className="w-3 h-3" />
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
