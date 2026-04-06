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
  article?: string;
  url?: string;
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
  /** Resultado destacado (opcional) */
  result?: {
    label: string;
    value: number;
    valueFormatted?: string;
  };
}
