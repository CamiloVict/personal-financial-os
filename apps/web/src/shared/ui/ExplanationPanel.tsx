'use client';

import React, { useState } from 'react';
import type {
  ExplanationNode,
  FinancialExplanation,
} from '@personal-finance-os/explanation';
import { BookOpen, ChevronRight, HelpCircle, Info } from 'lucide-react';

function fmtMoney(n: number | undefined): string | null {
  if (n === undefined || Number.isNaN(n)) return null;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function NodeTree({ node, depth }: { node: ExplanationNode; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const kids = node.children?.length ? node.children : [];
  const hasKids = kids.length > 0;
  const valueStr =
    node.valueFormatted ??
    (node.value !== undefined ? fmtMoney(node.value) : null);

  return (
    <div className={depth > 0 ? 'ml-2 border-l border-slate-200/80 pl-2.5' : ''}>
      <div className="flex gap-2 py-1 text-[13px] text-slate-800">
        {hasKids ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-0.5 p-0 text-slate-500 hover:text-indigo-600 shrink-0"
            aria-expanded={open}
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`}
            />
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-medium text-slate-900">{node.label}</span>
            {valueStr ? (
              <span
                className={`font-mono text-xs ${
                  (node.value ?? 0) < 0 ? 'text-rose-700' : 'text-slate-600'
                }`}
              >
                {valueStr}
              </span>
            ) : null}
            {node.ruleRef ? (
              <span
                className="group relative inline-flex items-center"
                title={node.description}
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500 cursor-help" />
                <span className="sr-only">Regla {node.ruleRef}</span>
                <span className="pointer-events-none absolute left-0 top-full z-10 mt-1 hidden w-56 rounded-md border border-slate-200 bg-white p-2 text-[10px] text-slate-600 shadow-md group-hover:block group-focus-within:block">
                  <strong className="text-indigo-800">{node.ruleRef}</strong>
                  {node.description ? (
                    <span className="mt-1 block font-normal">{node.description}</span>
                  ) : null}
                </span>
              </span>
            ) : null}
          </div>
          {node.description && !node.ruleRef ? (
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{node.description}</p>
          ) : null}
        </div>
      </div>
      {hasKids && open
        ? kids.map((c) => <NodeTree key={c.id} node={c} depth={depth + 1} />)
        : null}
    </div>
  );
}

export interface ExplanationPanelProps {
  explanation: FinancialExplanation | null | undefined;
  /** Si false, el panel arranca colapsado */
  defaultOpen?: boolean;
  className?: string;
}

export function ExplanationPanel({
  explanation,
  defaultOpen = false,
  className = '',
}: ExplanationPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  if (!explanation) return null;

  return (
    <div
      className={`rounded-xl border border-indigo-200/60 bg-white/90 shadow-sm overflow-hidden ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left bg-indigo-50/80 hover:bg-indigo-50 transition-colors"
      >
        <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-indigo-950">Cómo se calcula</p>
          {explanation.title ? (
            <p className="text-[11px] text-indigo-800/90 truncate">{explanation.title}</p>
          ) : null}
        </div>
        <ChevronRight
          className={`w-4 h-4 text-indigo-600 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {open ? (
        <div className="px-4 py-3 space-y-4 border-t border-indigo-100">
          {explanation.summary ? (
            <p className="text-xs text-slate-600 leading-relaxed flex gap-2">
              <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
              {explanation.summary}
            </p>
          ) : null}

          {explanation.result ? (
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                {explanation.result.label}
              </p>
              <p className="text-lg font-bold text-slate-900 font-mono">
                {explanation.result.valueFormatted ??
                  fmtMoney(explanation.result.value) ??
                  explanation.result.value}
              </p>
            </div>
          ) : null}

          {explanation.inputs.length > 0 ? (
            <section>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Entradas
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {explanation.inputs.map((n) => (
                  <li key={n.id} className="flex flex-wrap gap-x-2">
                    <span className="font-medium">{n.label}:</span>
                    <span className="text-slate-600">
                      {n.description ??
                        (n.value !== undefined ? String(n.value) : '—')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {explanation.steps.length > 0 ? (
            <section>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Pasos del cálculo
              </h4>
              <div className="space-y-0.5">
                {explanation.steps.map((n) => (
                  <NodeTree key={n.id} node={n} depth={0} />
                ))}
              </div>
            </section>
          ) : null}

          {explanation.assumptions.length > 0 ? (
            <section>
              <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1.5">
                Supuestos
              </h4>
              <ul className="list-disc pl-4 text-[11px] text-amber-950/90 space-y-1">
                {explanation.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {explanation.missingData.length > 0 ? (
            <section>
              <h4 className="text-[10px] font-bold text-rose-800 uppercase tracking-wider mb-1.5">
                Datos faltantes / a validar
              </h4>
              <ul className="list-disc pl-4 text-[11px] text-rose-900/90 space-y-1">
                {explanation.missingData.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {explanation.normativeRefs.length > 0 ? (
            <section>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Referencia normativa (orientativa)
              </h4>
              <ul className="text-[11px] text-slate-600 space-y-1">
                {explanation.normativeRefs.map((r) => (
                  <li key={r.id}>
                    <span className="font-semibold text-slate-800">{r.id}</span>
                    {' — '}
                    {r.title}
                    {r.article ? (
                      <span className="block text-slate-500 mt-0.5">{r.article}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-2">
            Dominio: <code className="bg-slate-100 px-1 rounded">{explanation.domain}</code> ·
            esquema {explanation.schemaVersion}
          </p>
        </div>
      ) : null}
    </div>
  );
}
