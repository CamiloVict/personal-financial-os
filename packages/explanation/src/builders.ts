import type {
  ExplanationNode,
  ExplanationNodeKind,
  FinancialExplanation,
  NormativeRef,
} from './contracts';

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

export function resetExplanationIds(): void {
  seq = 0;
}

export function createNode(partial: {
  kind: ExplanationNodeKind;
  label: string;
  id?: string;
  description?: string;
  value?: number;
  valueFormatted?: string;
  delta?: number;
  ruleRef?: string;
  normativeRefs?: NormativeRef[];
  meta?: Record<string, unknown>;
  children?: ExplanationNode[];
}): ExplanationNode {
  return {
    id: partial.id ?? nextId('n'),
    kind: partial.kind,
    label: partial.label,
    description: partial.description,
    value: partial.value,
    valueFormatted: partial.valueFormatted,
    delta: partial.delta,
    ruleRef: partial.ruleRef,
    normativeRefs: partial.normativeRefs,
    meta: partial.meta,
    children: partial.children,
  };
}

export function emptyFinancialExplanation(
  domain: string,
  title?: string,
): FinancialExplanation {
  return {
    schemaVersion: '1.0',
    domain,
    title,
    inputs: [],
    steps: [],
    assumptions: [],
    missingData: [],
    normativeRefs: [],
  };
}

export function mergeFinancialExplanations(
  base: FinancialExplanation,
  extra: Partial<
    Pick<
      FinancialExplanation,
      'inputs' | 'steps' | 'assumptions' | 'missingData' | 'normativeRefs'
    >
  >,
): FinancialExplanation {
  return {
    ...base,
    inputs: [...base.inputs, ...(extra.inputs ?? [])],
    steps: [...base.steps, ...(extra.steps ?? [])],
    assumptions: [...base.assumptions, ...(extra.assumptions ?? [])],
    missingData: [...base.missingData, ...(extra.missingData ?? [])],
    normativeRefs: [...base.normativeRefs, ...(extra.normativeRefs ?? [])],
  };
}

/** Serialización explícita (garantiza JSON-safe). */
export function serializeFinancialExplanation(
  exp: FinancialExplanation,
): Record<string, unknown> {
  return JSON.parse(JSON.stringify(exp)) as Record<string, unknown>;
}
