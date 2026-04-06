'use client';

/**
 * Etiquetas de confianza / procedencia de datos (Trust Foundation).
 * No implica certeza legal ni contable; orientan qué tipo de número está viendo el usuario.
 */
export type TrustKind =
  | 'REAL_DATA'
  | 'ESTIMATED'
  | 'SIMULATED'
  | 'FISCAL_MODEL'
  | 'SCENARIO_PREVIEW';

const META: Record<
  TrustKind,
  { label: string; className: string; title: string }
> = {
  REAL_DATA: {
    label: 'Datos registrados',
    className: 'bg-emerald-100 text-emerald-900 border-emerald-200/80',
    title:
      'Valores basados en lo que guardaste en la app. Pueden mostrarse convertidos o deflactados según el modo y la fecha de la barra de valuación.',
  },
  ESTIMATED: {
    label: 'Estimado',
    className: 'bg-amber-100 text-amber-950 border-amber-200/80',
    title:
      'Proyección del modelo con supuestos; no es extracto bancario ni dictamen de la DIAN.',
  },
  SIMULATED: {
    label: 'Simulado',
    className: 'bg-violet-100 text-violet-900 border-violet-200/80',
    title:
      'Escenario hipotético: no altera tus datos reales ni sustituye planificación profesional.',
  },
  FISCAL_MODEL: {
    label: 'Fiscal (modelo)',
    className: 'bg-indigo-100 text-indigo-900 border-indigo-200/80',
    title:
      'Motor tributario educativo (Colombia). Cálculo interno en COP con UVT de referencia del paquete; la barra de valuación solo cambia cómo se muestran los montos.',
  },
  SCENARIO_PREVIEW: {
    label: 'Escenario (preview)',
    className: 'bg-sky-100 text-sky-900 border-sky-200/80',
    title:
      'Combinación puntual de palancas seleccionadas en pantalla. Es distinta del plan de escenarios del motor hasta que el perfil y el análisis reflejen esos cambios.',
  },
};

export function TrustBadge({ kind }: { kind: TrustKind }) {
  const m = META[kind];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${m.className}`}
      title={m.title}
    >
      {m.label}
    </span>
  );
}

/** Bloque compacto para la pestaña Plan fiscal: coherencia plan vs preview y COP vs presentación. */
export function TaxTrustContextStrip() {
  return (
    <div
      className="rounded-lg border border-slate-200/90 bg-slate-50/90 px-3 py-2.5 text-[11px] text-slate-600 leading-relaxed"
      role="note"
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <TrustBadge kind="FISCAL_MODEL" />
        <TrustBadge kind="ESTIMATED" />
        <span className="text-[10px] text-slate-500">
          Supuestos: UVT y tablas del paquete motor; FX de la barra solo para vista.
        </span>
      </div>
      <p>
        <span className="font-semibold text-slate-800">Fuente de verdad del módulo fiscal:</span> el motor
        trabaja en <strong>COP</strong> con la versión indicada (p. ej. CO-AG2026). La barra{' '}
        <strong>Valuación</strong> convierte esos montos a USD nominal o COP real (IPC) para compararlos con el
        resto del producto; no cambia la obligación tributaria modelada.
      </p>
      <p className="mt-2">
        <span className="font-semibold text-slate-800">Evitar contradicciones:</span> el gráfico{' '}
        <strong>Escenarios y liquidación</strong> muestra el <em>plan</em> del motor. La sección{' '}
        <strong>Proyección declaración de renta</strong> puede incluir una barra adicional{' '}
        <TrustBadge kind="SCENARIO_PREVIEW" /> cuando eliges palancas: ese impuesto combinado vive ahí, no
        sustituye las tarjetas del plan hasta que el perfil y el recálculo lo reflejen.
      </p>
    </div>
  );
}
