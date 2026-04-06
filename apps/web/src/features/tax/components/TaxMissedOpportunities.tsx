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
          Bajo las reglas del modelo, esos aportes pueden tratarse como <strong>Renta Exenta</strong>. Si destinaras ahorros
          a vivienda dentro de los topes modelados (p. ej. 30% del ingreso o 3,800 UVT anuales), la base gravable
          estimada sería menor antes del impuesto final.
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
          En el modelo, aportes a FPV pueden figurar como <strong>Renta Exenta</strong> dentro del límite del 30%, sujeto a
          permanencia y destino según normativa; el efecto mostrado es estimado.
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
          Si aplicara a tu caso, los intereses de vivienda o leasing habitacional (hasta 100 UVT mensuales en el modelo)
          pueden deducirse de los ingresos según las reglas cargadas en el motor.
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
          Bajo el modelo, ciertos planes de salud adicionales a la EPS pueden generar una <strong>Deducción</strong> de
          hasta 16 UVT mensuales (titular, cónyuge o hijos dependientes, según normativa modelada).
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
          Si hubiera dependientes económicos que califiquen, la deducción reduce la base gravable (tope en UVT en el
          modelo). Puedes reflejarlo en perfil para recalcular y conservar soportes.
        </>
      ),
    });
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-bold text-orange-900 mb-1.5 flex items-center gap-1.5">
        <TrendingDown className="w-4 h-4 text-orange-600" />
        Simulación de impacto: beneficios no activados en el perfil
      </h3>
      <p className="mb-4 text-xs leading-relaxed text-slate-700">
        Si aplicara a tu caso, podrías reflejarlo en <strong>Perfil y Beneficios</strong> y guardar para recalcular.{' '}
        {onToggleLever ? (
          <>
            <span className="font-medium text-orange-900">
              Pulsa una o varias tarjetas para simular el impuesto con esa combinación: el resultado aparece en la
              sección <strong>Proyección declaración de renta</strong> (gráfico de barras más arriba en esta pestaña), no
              en las tarjetas de detalle de <strong>Escenarios y liquidación</strong>, que siguen mostrando tu plan
              analizado por el motor.
            </span>{' '}
            <a
              href="#tax-declaration-projection"
              className="font-semibold text-orange-900 underline decoration-orange-400 underline-offset-2"
            >
              Ir a Proyección declaración
            </a>
            .
          </>
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
