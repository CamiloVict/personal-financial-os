import type { FinancialExplanation } from '@personal-finance-os/explanation';
import { createNode, emptyFinancialExplanation } from '@personal-finance-os/explanation';

export function buildSimulatorExplanation(opts: {
  domain: string;
  title: string;
  summary?: string;
  paramLabels: Array<{ label: string; value: string | number }>;
  steps: Array<{ label: string; description?: string; ruleRef?: string }>;
  assumptions: string[];
  missingData?: string[];
}): FinancialExplanation {
  return {
    ...emptyFinancialExplanation(opts.domain, opts.title),
    summary: opts.summary,
    inputs: opts.paramLabels.map((p) =>
      createNode({
        kind: 'input',
        label: p.label,
        description: String(p.value),
      }),
    ),
    steps: opts.steps.map((s) =>
      createNode({
        kind: 'rule',
        label: s.label,
        description: s.description,
        ruleRef: s.ruleRef,
      }),
    ),
    assumptions: opts.assumptions,
    missingData: opts.missingData ?? [],
    normativeRefs: [],
  };
}
