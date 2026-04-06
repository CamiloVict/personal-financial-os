import React, { Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, Scale } from 'lucide-react';

const DEBT_KIND_OPTIONS = [
  { value: 'MORTGAGE', label: 'Hipoteca / vivienda' },
  { value: 'BUSINESS_LOAN', label: 'Crédito comercial / inversión' },
  { value: 'AUTO_LOAN', label: 'Crédito vehículo' },
  { value: 'PERSONAL_LOAN', label: 'Préstamo personal' },
  { value: 'CREDIT_CARD', label: 'Tarjeta de crédito' },
] as const;

interface PositionFormProps {
  types: any[];
  typeId: string;
  setTypeId: Dispatch<SetStateAction<string>>;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  initialCapital: string;
  setInitialCapital: Dispatch<SetStateAction<string>>;
  currency: string;
  setCurrency: Dispatch<SetStateAction<string>>;
  startDate: string;
  setStartDate: Dispatch<SetStateAction<string>>;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  /** Tipo seleccionado permite deuda ligada al activo (InvestmentTypeDefinition.allowsLinkedDebt). */
  allowsLinkedDebt?: boolean;
  linkDebt?: boolean;
  setLinkDebt?: Dispatch<SetStateAction<boolean>>;
  debtName?: string;
  setDebtName?: Dispatch<SetStateAction<string>>;
  debtTotalAmount?: string;
  setDebtTotalAmount?: Dispatch<SetStateAction<string>>;
  debtRemainingAmount?: string;
  setDebtRemainingAmount?: Dispatch<SetStateAction<string>>;
  debtInterestRate?: string;
  setDebtInterestRate?: Dispatch<SetStateAction<string>>;
  debtMonthlyPayment?: string;
  setDebtMonthlyPayment?: Dispatch<SetStateAction<string>>;
  debtType?: string;
  setDebtType?: Dispatch<SetStateAction<string>>;
  debtDueDate?: string;
  setDebtDueDate?: Dispatch<SetStateAction<string>>;
  /** Validación al enviar (p. ej. saldo de deuda obligatorio). */
  submitError?: string | null;
  patrimonyLeg?: 'ASSET' | 'LIABILITY';
  setPatrimonyLeg?: Dispatch<SetStateAction<'ASSET' | 'LIABILITY'>>;
  generatesPeriodicIncome?: boolean;
  setGeneratesPeriodicIncome?: Dispatch<SetStateAction<boolean>>;
  expectedPeriodicIncomeAmount?: string;
  setExpectedPeriodicIncomeAmount?: Dispatch<SetStateAction<string>>;
  incomeFrequency?: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  setIncomeFrequency?: Dispatch<SetStateAction<'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'>>;
  nextExpectedDate?: string;
  setNextExpectedDate?: Dispatch<SetStateAction<string>>;
}

export function PositionForm({
  types,
  typeId,
  setTypeId,
  name,
  setName,
  initialCapital,
  setInitialCapital,
  currency,
  setCurrency,
  startDate,
  setStartDate,
  onSubmit,
  isPending,
  allowsLinkedDebt = false,
  linkDebt = false,
  setLinkDebt,
  debtName = '',
  setDebtName = () => {},
  debtTotalAmount = '',
  setDebtTotalAmount = () => {},
  debtRemainingAmount = '',
  setDebtRemainingAmount = () => {},
  debtInterestRate = '',
  setDebtInterestRate = () => {},
  debtMonthlyPayment = '',
  setDebtMonthlyPayment = () => {},
  debtType = 'MORTGAGE',
  setDebtType = () => {},
  debtDueDate = '',
  setDebtDueDate = () => {},
  submitError = null,
  patrimonyLeg = 'ASSET',
  setPatrimonyLeg = () => {},
  generatesPeriodicIncome = false,
  setGeneratesPeriodicIncome = () => {},
  expectedPeriodicIncomeAmount = '',
  setExpectedPeriodicIncomeAmount = () => {},
  incomeFrequency = 'MONTHLY',
  setIncomeFrequency = () => {},
  nextExpectedDate = '',
  setNextExpectedDate = () => {},
}: PositionFormProps) {
  const selectedType = types.find((t) => t.id === typeId);

  return (
    <div className="lg:col-span-4 glass-card p-6 rounded-xl self-start">
      <h3 className="text-base font-bold text-slate-800 tracking-tight mb-6">Añadir Posición</h3>

      {types.length === 0 ? (
        <div className="bg-rose-50 text-rose-800 p-4 rounded-lg border border-rose-200 text-sm space-y-3">
          <p>
            Para registrar una posición necesitas al menos una <strong>categoría de patrimonio</strong> (la
            definís vos: activo cotizado, inmueble, caja, etc.). Configurala en{' '}
            <strong>Categorías de patrimonio</strong> (menú Modelo).
          </p>
          <Link
            href="/investment-types"
            className="inline-flex items-center gap-1.5 font-semibold text-white bg-rose-700 hover:bg-rose-800 px-3 py-2 rounded-lg text-xs transition-colors"
          >
            Ir a categorías de patrimonio
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Clase de Activo</label>
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

            {selectedType && (
              <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-semibold block mb-1">Reglas Activas:</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {selectedType.generatesCashflow && <li>Permite flujo de caja</li>}
                  {selectedType.allowsProfitDistribution && (
                    <li>Reparte Utilidad ({selectedType.expectedFrequency})</li>
                  )}
                  {selectedType.hasManualValuation && <li>Requiere valoración manual</li>}
                  {selectedType.allowsLinkedDebt && (
                    <li>
                      Admite <strong>deuda vinculada</strong> al activo (hipoteca, crédito del bien, etc.)
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Identificador / Nombre</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input w-full p-2.5 rounded-lg text-sm"
              placeholder="Ej. Casa de la playa, TSLA..."
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Capital Inicial</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  required
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(e.target.value)}
                  className="glass-input w-full p-2.5 pl-7 rounded-lg text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="w-1/3">
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
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Inicio</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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
              Los pasivos en posiciones no entran en el portafolio financiero (retornos / KPI de inversión).
            </p>
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
                Genera ingreso periódico esperado
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
                      setIncomeFrequency(
                        e.target.value as 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY',
                      )
                    }
                    className="glass-input w-full p-2 rounded-lg text-sm"
                  >
                    <option value="MONTHLY">Mensual</option>
                    <option value="QUARTERLY">Trimestral</option>
                    <option value="ANNUALLY">Anual</option>
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

          {allowsLinkedDebt && setLinkDebt ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Scale className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">Deuda asociada al activo</p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Si este bien está financiado, registra la obligación aquí. Se creará en <strong>Deudas</strong>{' '}
                    enlazada a esta posición para el análisis de apalancamiento.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer touch-manipulation">
                <input
                  type="checkbox"
                  checked={linkDebt}
                  onChange={(e) => setLinkDebt(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Crear deuda vinculada al guardar la posición</span>
              </label>

              {linkDebt ? (
                <div className="space-y-3 pt-1 border-t border-slate-200/80">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nombre de la deuda</label>
                    <input
                      value={debtName}
                      onChange={(e) => setDebtName(e.target.value)}
                      className="glass-input w-full p-2 rounded-lg text-sm"
                      placeholder={`Ej. Hipoteca — ${name || 'activo'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                    <select
                      value={debtType}
                      onChange={(e) => setDebtType(e.target.value)}
                      className="glass-input w-full p-2 rounded-lg text-sm"
                    >
                      {DEBT_KIND_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Saldo / capital pendiente</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-bold">$</span>
                        <input
                          type="number"
                          required={linkDebt}
                          min={0}
                          step="any"
                          value={debtRemainingAmount}
                          onChange={(e) => setDebtRemainingAmount(e.target.value)}
                          className="glass-input w-full p-2 pl-6 rounded-lg text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Monto original (opcional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-bold">$</span>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={debtTotalAmount}
                          onChange={(e) => setDebtTotalAmount(e.target.value)}
                          className="glass-input w-full p-2 pl-6 rounded-lg text-sm"
                          placeholder="Igual al saldo si no aplica"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Tasa interés anual (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={debtInterestRate}
                        onChange={(e) => setDebtInterestRate(e.target.value)}
                        className="glass-input w-full p-2 rounded-lg text-sm"
                        placeholder="Ej. 12.5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Cuota mensual (opcional)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-bold">$</span>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={debtMonthlyPayment}
                          onChange={(e) => setDebtMonthlyPayment(e.target.value)}
                          className="glass-input w-full p-2 pl-6 rounded-lg text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Vencimiento (opcional)</label>
                    <input
                      type="date"
                      value={debtDueDate}
                      onChange={(e) => setDebtDueDate(e.target.value)}
                      className="glass-input w-full p-2 rounded-lg text-sm"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {submitError ? (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{submitError}</p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg font-semibold flex justify-center items-center gap-2 transition-all text-sm shadow-sm disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            {isPending ? 'Registrando...' : 'Registrar Posición'}
          </button>
        </form>
      )}
    </div>
  );
}
