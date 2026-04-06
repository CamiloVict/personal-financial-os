'use client';

import React from 'react';
import { Check, TrendingDown } from 'lucide-react';

interface TaxMissedOpportunitiesProps {
  profile: any;
  /** Conmuta la palanca en el gráfico de declaración (puedes tener varias activas). */
  onToggleLever?: (leverId: string) => void;
  selectedLeverIds?: string[];
}

type Suggestion = {
  leverId: string;
  title: string;
  body: React.ReactNode;
};

export function TaxMissedOpportunities({
  profile,
  onToggleLever,
  selectedLeverIds = [],
}: TaxMissedOpportunitiesProps) {
  if (!profile) return null;

  const suggestions: Suggestion[] = [];
  if (!profile.hasAFC) {
    suggestions.push({
      leverId: 'LEVER_AFC',
      title: 'Ahorro en Cuenta AFC',
      body: (
        <>
          El dinero depositado cuenta como <strong>Renta Exenta</strong>. Si destinas ahorros a vivienda (hasta el 30%
          de tu ingreso o 3,800 UVT anuales), reducirás tu base gravable antes del cálculo del impuesto final.
        </>
      ),
    });
  }
  if (!profile.hasVoluntaryPension) {
    suggestions.push({
      leverId: 'LEVER_VOLUNTARY_PENSION',
      title: 'Aportes a Pensión Voluntaria (FPV)',
      body: (
        <>
          El capital aportado a FPV también es <strong>Renta Exenta</strong>. Funciona como un fondo de inversión, pero
          te ahorra impuestos inmediatamente (sujeto al límite del 30%) si cumples permanencia o destinas a vivienda.
        </>
      ),
    });
  }
  if (!profile.hasHousingInterest) {
    suggestions.push({
      leverId: 'LEVER_HOUSING',
      title: 'Intereses de Crédito Hipotecario',
      body: (
        <>
          Si pagas cuotas de un préstamo de vivienda o leasing habitacional, los intereses que abonas (hasta 100 UVT
          mensuales) se deducen directamente de tus ingresos.
        </>
      ),
    });
  }
  if (!profile.hasPrepaidMedicine) {
    suggestions.push({
      leverId: 'LEVER_PREPAID',
      title: 'Medicina Prepagada o Pólizas',
      body: (
        <>
          Planes de salud adicionales a la EPS otorgan una <strong>Deducción</strong> de hasta 16 UVT mensuales (tú,
          cónyuge o hijos dependientes).
        </>
      ),
    });
  }
  if (!profile.hasDependents) {
    suggestions.push({
      leverId: 'LEVER_DEPENDENTS',
      title: 'Dependientes económicos',
      body: (
        <>
          La deducción por dependientes reduce la base gravable (tope legal anual en UVT). Actívala en tu perfil si
          aplica y conserva los soportes.
        </>
      ),
    });
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-bold text-orange-900 mb-1.5 flex items-center gap-1.5">
        <TrendingDown className="w-4 h-4 text-orange-600" />
        Oportunidades de optimización no aprovechadas
      </h3>
      <p className="text-xs text-slate-700 mb-4">
        Si aplica a tu caso real, habilita estas opciones en <strong>Perfil y Beneficios</strong> y guarda.{' '}
        {onToggleLever ? (
          <span className="text-orange-800 font-medium">
            Pulsa una o varias tarjetas para simular en el gráfico superior el impuesto con esa combinación de
            beneficios.
          </span>
        ) : null}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((s) => {
          const selected = selectedLeverIds.includes(s.leverId);
          const interactive = Boolean(onToggleLever);

          const className = `text-left w-full rounded-lg border p-3 shadow-sm transition-all relative ${
            selected
              ? 'bg-orange-100 border-orange-400 ring-2 ring-orange-400'
              : 'bg-white border-orange-200 hover:border-orange-300'
          } ${interactive ? 'cursor-pointer touch-manipulation active:scale-[0.99]' : ''}`;

          const inner = (
            <>
              {selected ? (
                <span
                  className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-white"
                  aria-hidden
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              ) : null}
              <h4 className="font-bold text-orange-800 mb-1 text-xs pr-8">{s.title}</h4>
              <p className="text-[10px] text-slate-600 leading-relaxed">{s.body}</p>
            </>
          );

          if (interactive) {
            return (
              <button
                key={s.leverId}
                type="button"
                className={className}
                aria-pressed={selected}
                onClick={() => onToggleLever?.(s.leverId)}
              >
                {inner}
              </button>
            );
          }

          return (
            <div key={s.leverId} className={className}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
