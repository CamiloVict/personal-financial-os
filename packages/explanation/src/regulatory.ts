import type { ExplanationNode, FinancialExplanation } from './contracts';

/**
 * Cadena explícita ley → interpretación → implementación (metadatos de catálogo).
 * Los nodos del grafo siguen llevando `ruleRef` + `normativeRefs` para la UI.
 */
export interface PublishedLawAnchor {
  instrument: string;
  citation: string;
  article: string;
  url?: string;
}

export interface ProductInterpretationAnchor {
  /** Resumen de cómo el producto aplica la norma en el motor. */
  summary: string;
  limitations?: string[];
}

export interface CodeImplementationAnchor {
  /** Versión del motor que contiene esta regla. */
  engineVersion: string;
  /** Ruta lógica del módulo (trazabilidad en repo). */
  modulePath: string;
  /** Símbolo o función donde vive la lógica. */
  symbol: string;
}

/** Definición auditable de una regla fiscal versionada. */
export interface RegulatoryTaxRuleDefinition {
  ruleRef: string;
  jurisdiction: string;
  taxYear: number;
  lawPackageId: string;
  law: PublishedLawAnchor;
  interpretation: ProductInterpretationAnchor;
  implementation: CodeImplementationAnchor;
}

export interface TaxCalculationAuditPayload {
  schemaVersion: '1.0';
  occurredAt: string;
  jurisdiction: string;
  taxYear: number;
  engineVersion: string;
  lawPackageId: string;
  /** Orden de aparición en el grafo de explicación (primera visita por `ruleRef`). */
  appliedRuleRefsInOrder: string[];
  domain: string;
  explanationTitle?: string;
  /** Id opaco para correlacionar con trazas APM sin exponer PII. */
  correlationId?: string;
}

function walkNodes(nodes: ExplanationNode[] | undefined, visit: (n: ExplanationNode) => void): void {
  if (!nodes?.length) return;
  for (const n of nodes) {
    visit(n);
    walkNodes(n.children, visit);
  }
}

/** Aplana inputs + steps (profundidad primero en hijos). */
export function flattenExplanationNodes(exp: FinancialExplanation): ExplanationNode[] {
  const out: ExplanationNode[] = [];
  walkNodes(exp.inputs, (n) => out.push(n));
  walkNodes(exp.steps, (n) => out.push(n));
  return out;
}

/**
 * Reglas referenciadas en el grafo, en orden de primer encuentro.
 * Incluye nodos `rule`, `aggregation`, `input` o `result` que lleven `ruleRef`.
 */
export function collectAppliedRuleRefsInOrder(exp: FinancialExplanation): string[] {
  const order: string[] = [];
  const seen = new Set<string>();
  for (const n of flattenExplanationNodes(exp)) {
    if (n.ruleRef && !seen.has(n.ruleRef)) {
      seen.add(n.ruleRef);
      order.push(n.ruleRef);
    }
  }
  return order;
}

/**
 * Payload listo para log estructurado, almacenamiento WORM o exportación a SIEM.
 * No incluye montos ni datos personales.
 */
export function buildTaxCalculationAuditPayload(
  exp: FinancialExplanation,
  opts: {
    taxYear?: number;
    correlationId?: string;
    occurredAt?: string;
  } = {},
): TaxCalculationAuditPayload {
  const ctx = exp.regulatoryContext;
  const year =
    opts.taxYear ?? ctx?.taxYear ?? new Date().getFullYear();
  return {
    schemaVersion: '1.0',
    occurredAt: opts.occurredAt ?? new Date().toISOString(),
    jurisdiction: ctx?.jurisdiction ?? 'UNKNOWN',
    taxYear: year,
    engineVersion: ctx?.engineVersion ?? 'UNKNOWN',
    lawPackageId: ctx?.lawPackageId ?? 'UNKNOWN',
    appliedRuleRefsInOrder: collectAppliedRuleRefsInOrder(exp),
    domain: exp.domain,
    explanationTitle: exp.title,
    correlationId: opts.correlationId,
  };
}
