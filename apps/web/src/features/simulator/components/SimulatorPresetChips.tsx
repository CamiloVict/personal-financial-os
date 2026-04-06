'use client';

import type { PropertyPresetId } from '../utils/propertyPresets';
import { PROPERTY_PRESET_META } from '../utils/propertyPresets';
import type { DebtPresetId } from '../utils/debtPresets';
import { DEBT_PRESET_META } from '../utils/debtPresets';

type SimulatorPresetChipsProps =
  | {
      variant: 'property';
      onSelect: (id: PropertyPresetId) => void;
    }
  | {
      variant: 'debt';
      onSelect: (id: DebtPresetId) => void;
    };

export function SimulatorPresetChips(props: SimulatorPresetChipsProps) {
  if (props.variant === 'property') {
    const ids = Object.keys(PROPERTY_PRESET_META) as PropertyPresetId[];
    return (
      <div className="rounded-lg border border-slate-200/90 bg-slate-50/80 p-2">
        <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
          Presets (solo rellenan el formulario)
        </p>
        <div className="flex flex-wrap gap-1">
          {ids.map((id) => {
            const m = PROPERTY_PRESET_META[id];
            return (
              <button
                key={id}
                type="button"
                title={m.hint}
                onClick={() => props.onSelect(id)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/80"
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const ids = Object.keys(DEBT_PRESET_META) as DebtPresetId[];
  return (
    <div className="rounded-lg border border-slate-200/90 bg-slate-50/80 p-2">
      <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
        Presets (solo rellenan el formulario)
      </p>
      <div className="flex flex-wrap gap-1">
        {ids.map((id) => {
          const m = DEBT_PRESET_META[id];
          return (
            <button
              key={id}
              type="button"
              title={m.hint}
              onClick={() => props.onSelect(id)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/80"
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
