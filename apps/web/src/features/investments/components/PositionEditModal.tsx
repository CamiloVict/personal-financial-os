import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const INCOME_FREQ_OPTIONS = [
  { value: 'MONTHLY', label: 'Mensual' },
  { value: 'QUARTERLY', label: 'Trimestral' },
  { value: 'ANNUALLY', label: 'Anual' },
] as const;

function normalizeIncomeFrequency(
  f: string | null | undefined,
): (typeof INCOME_FREQ_OPTIONS)[number]['value'] {
  if (f === 'QUARTERLY' || f === 'ANNUALLY') return f;
  return 'MONTHLY';
}

export interface PositionEditModalProps {
  position: any | null;
  types: any[];
  onClose: () => void;
  onSave: (body: Record<string, unknown>) => void;
  isPending: boolean;
}

export function PositionEditModal({
  position,
  types,
  onClose,
  onSave,
  isPending,
}: PositionEditModalProps) {
  const [typeId, setTypeId] = useState('');
  const [name, setName] = useState('');
  const [initialCapital, setInitialCapital] = useState('');
  const [currentEstimatedValue, setCurrentEstimatedValue] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [startDate, setStartDate] = useState('');
  const [patrimonyLeg, setPatrimonyLeg] = useState<'ASSET' | 'LIABILITY'>('ASSET');
  const [generatesPeriodicIncome, setGeneratesPeriodicIncome] = useState(false);
  const [expectedPeriodicIncomeAmount, setExpectedPeriodicIncomeAmount] = useState('');
  const [incomeFrequency, setIncomeFrequency] = useState<
    (typeof INCOME_FREQ_OPTIONS)[number]['value']
  >('MONTHLY');
  const [nextExpectedDate, setNextExpectedDate] = useState('');

  useEffect(() => {
    if (!position) return;
    setTypeId(position.typeId ?? '');
    setName(position.name ?? '');
    setInitialCapital(String(Number(position.initialCapital ?? 0)));
    setCurrentEstimatedValue(String(Number(position.currentEstimatedValue ?? 0)));
    setCurrency(position.currency ?? 'USD');
    const sd = position.startDate
      ? new Date(position.startDate).toISOString().slice(0, 10)
      : '';
    setStartDate(sd);
    setPatrimonyLeg(position.patrimonyLeg === 'LIABILITY' ? 'LIABILITY' : 'ASSET');
    setGeneratesPeriodicIncome(Boolean(position.generatesPeriodicIncome));
    setExpectedPeriodicIncomeAmount(
      String(Number(position.expectedPeriodicIncomeAmount ?? 0)),
    );
    setIncomeFrequency(normalizeIncomeFrequency(position.frequency));
    setNextExpectedDate(
      position.nextExpectedDate
        ? new Date(position.nextExpectedDate).toISOString().slice(0, 10)
        : '',
    );
  }, [position]);

  if (!position) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const gen = generatesPeriodicIncome;
    const body: Record<string, unknown> = {
      typeId,
      name: name.trim(),
      initialCapital: Number(initialCapital) || 0,
      currentEstimatedValue: Number(currentEstimatedValue) || 0,
      currency,
      startDate: startDate
        ? new Date(startDate).toISOString()
        : new Date(position.startDate).toISOString(),
      patrimonyLeg,
      generatesPeriodicIncome: gen,
      expectedPeriodicIncomeAmount: gen ? Number(expectedPeriodicIncomeAmount) || 0 : 0,
      frequency: gen ? incomeFrequency : null,
      nextExpectedDate: gen && nextExpectedDate
        ? new Date(nextExpectedDate).toISOString()
        : null,
    };
    onSave(body);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 sticky top-0">
          <h3 className="font-bold text-lg text-slate-800 tracking-tight">Editar posición</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 bg-white rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
            <select
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              className="glass-input w-full p-2.5 rounded-lg text-sm"
            >
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input w-full p-2.5 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Activo o pasivo (patrimonio)
            </label>
            <select
              value={patrimonyLeg}
              onChange={(e) =>
                setPatrimonyLeg(e.target.value === 'LIABILITY' ? 'LIABILITY' : 'ASSET')
              }
              className="glass-input w-full p-2.5 rounded-lg text-sm"
            >
              <option value="ASSET">Activo (suma al patrimonio)</option>
              <option value="LIABILITY">Pasivo (resta al patrimonio)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              El portafolio financiero (retornos y KPI) solo incluye posiciones activas en categorías de
              inversión.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Capital inicial</label>
              <input
                type="number"
                required
                min={0}
                step="any"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                className="glass-input w-full p-2.5 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor estimado</label>
              <input
                type="number"
                required
                min={0}
                step="any"
                value={currentEstimatedValue}
                onChange={(e) => setCurrentEstimatedValue(e.target.value)}
                className="glass-input w-full p-2.5 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="glass-input w-full p-2.5 rounded-lg text-sm"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="COP">COP</option>
                <option value="MXN">MXN</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha inicio</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="glass-input w-full p-2.5 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer touch-manipulation">
              <input
                type="checkbox"
                checked={generatesPeriodicIncome}
                onChange={(e) => setGeneratesPeriodicIncome(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-800">
                Genera ingreso periódico esperado (cupón, arriendo, dividendo planificado…)
              </span>
            </label>
            {generatesPeriodicIncome ? (
              <div className="space-y-3 pt-1 border-t border-slate-200/80">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Monto por período (en {currency})
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={expectedPeriodicIncomeAmount}
                    onChange={(e) => setExpectedPeriodicIncomeAmount(e.target.value)}
                    className="glass-input w-full p-2 rounded-lg text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Frecuencia</label>
                  <select
                    value={incomeFrequency}
                    onChange={(e) =>
                      setIncomeFrequency(e.target.value as (typeof INCOME_FREQ_OPTIONS)[number]['value'])
                    }
                    className="glass-input w-full p-2 rounded-lg text-sm"
                  >
                    {INCOME_FREQ_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Próximo pago esperado (opcional)
                  </label>
                  <input
                    type="date"
                    value={nextExpectedDate}
                    onChange={(e) => setNextExpectedDate(e.target.value)}
                    className="glass-input w-full p-2 rounded-lg text-sm"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-700 p-2.5 rounded-lg font-semibold text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg font-semibold text-sm disabled:opacity-60"
            >
              {isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
