/**
 * Nodo del grafo de explicabilidad (árbol vía `children`).
 * Serializable a JSON (sin funciones).
 */
export type ExplanationNodeKind =
  | 'input'
  | 'rule'
  | 'aggregation'
  | 'result'
  | 'assumption'
  | 'gap';

export interface NormativeRef {
  /** Identificador corto p. ej. ET-CO-2026 */
  id: string;
  title: string;
  /** Cita del artículo o numeral (capa “ley publicada”). */
  article?: string;
  url?: string;
  /** Instrumento legal (p. ej. Estatuto Tributario, Decreto reglamentario). */
  legalInstrument?: string;
  /**
   * Capa “interpretación del producto”: cómo el motor entiende la norma para este cálculo.
   * No constituye asesoría legal; documenta supuestos para auditoría interna.
   */
  productInterpretation?: string;
}

export interface ExplanationNode {
  id: string;
  kind: ExplanationNodeKind;
  label: string;
  description?: string;
  /** Valor numérico principal del paso (p. ej. monto deducción) */
  value?: number;
  valueFormatted?: string;
  /** Variación respecto al paso anterior cuando aplica */
  delta?: number;
  /** Clave de regla en motor p. ej. CO-AG2026-DED-DEP */
  ruleRef?: string;
  normativeRefs?: NormativeRef[];
  meta?: Record<string, unknown>;
  children?: ExplanationNode[];
}

/** Contexto regulatorio del cómputo (versionado por jurisdicción y año gravable). */
export interface RegulatoryComputationContext {
  jurisdiction: string;
  taxYear: number;
  /** Versión del motor/implementación (p. ej. CO-AG2026-v1.0). */
  engineVersion: string;
  /**
   * Identificador del paquete normativo enlazado (ley + interpretaciones revisadas).
   * Cambia cuando se actualizan artículos o interpretaciones sin cambiar solo código.
   */
  lawPackageId: string;
  /** Momento ISO del cálculo en servidor (opcional; puede fijarlo la API). */
  computedAt?: string;
}

export interface FinancialExplanation {
  schemaVersion: '1.0';
  /** Dominio funcional: tax.co.declaration, debts.leverage, simulator.property, … */
  domain: string;
  title?: string;
  summary?: string;
  /** Entradas consideradas en el cálculo */
  inputs: ExplanationNode[];
  /** Pasos / subárboles del razonamiento */
  steps: ExplanationNode[];
  assumptions: string[];
  missingData: string[];
  normativeRefs: NormativeRef[];
  /** Trazabilidad regulatoria del resultado (ley → interpretación → implementación). */
  regulatoryContext?: RegulatoryComputationContext;
  /** Resultado destacado (opcional) */
  result?: {
    label: string;
    value: number;
    valueFormatted?: string;
  };
}
