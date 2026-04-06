'use client';
import React, { useState, useCallback } from 'react';
import { Settings } from 'lucide-react';
import {
  useInvestmentTypes,
  useCreateInvestmentType,
  useUpdateInvestmentType,
  useDeleteInvestmentType,
} from '@/features/investments/api/queries';
import { TypeForm, TypeList } from '@/features/investments/components';

function resetFormState() {
  return {
    name: '',
    countsInFinancialPortfolio: true,
    generatesCashflow: false,
    allowsProfitDistribution: false,
    allowsExtraContributions: false,
    allowsLinkedDebt: false,
    hasManualValuation: false,
    expectedFrequency: 'MONTHLY',
  };
}

function typeToFormState(type: any) {
  return {
    name: type.name ?? '',
    countsInFinancialPortfolio: type.countsInFinancialPortfolio !== false,
    generatesCashflow: Boolean(type.generatesCashflow),
    allowsProfitDistribution: Boolean(type.allowsProfitDistribution),
    allowsExtraContributions: Boolean(type.allowsExtraContributions),
    allowsLinkedDebt: Boolean(type.allowsLinkedDebt),
    hasManualValuation: Boolean(type.hasManualValuation),
    expectedFrequency: type.expectedFrequency ?? 'MONTHLY',
  };
}

export default function InvestmentTypesPage() {
  const { data: types = [], isLoading } = useInvestmentTypes();
  const createTypeMutation = useCreateInvestmentType();
  const updateTypeMutation = useUpdateInvestmentType();
  const deleteTypeMutation = useDeleteInvestmentType();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [generatesCashflow, setGeneratesCashflow] = useState(false);
  const [allowsProfitDistribution, setAllowsProfitDistribution] = useState(false);
  const [allowsExtraContributions, setAllowsExtraContributions] = useState(false);
  const [allowsLinkedDebt, setAllowsLinkedDebt] = useState(false);
  const [hasManualValuation, setHasManualValuation] = useState(false);
  const [countsInFinancialPortfolio, setCountsInFinancialPortfolio] =
    useState(true);
  const [expectedFrequency, setExpectedFrequency] = useState('MONTHLY');

  const clearForm = useCallback(() => {
    const s = resetFormState();
    setName(s.name);
    setGeneratesCashflow(s.generatesCashflow);
    setAllowsProfitDistribution(s.allowsProfitDistribution);
    setAllowsExtraContributions(s.allowsExtraContributions);
    setAllowsLinkedDebt(s.allowsLinkedDebt);
    setHasManualValuation(s.hasManualValuation);
    setCountsInFinancialPortfolio(s.countsInFinancialPortfolio);
    setExpectedFrequency(s.expectedFrequency);
    setEditingId(null);
  }, []);

  const handleEditType = useCallback((type: any) => {
    const s = typeToFormState(type);
    setEditingId(type.id);
    setName(s.name);
    setGeneratesCashflow(s.generatesCashflow);
    setAllowsProfitDistribution(s.allowsProfitDistribution);
    setAllowsExtraContributions(s.allowsExtraContributions);
    setAllowsLinkedDebt(s.allowsLinkedDebt);
    setHasManualValuation(s.hasManualValuation);
    setCountsInFinancialPortfolio(s.countsInFinancialPortfolio);
    setExpectedFrequency(s.expectedFrequency);
  }, []);

  const buildPayload = () => ({
    name,
    countsInFinancialPortfolio,
    generatesCashflow,
    allowsProfitDistribution,
    allowsExtraContributions,
    allowsLinkedDebt,
    hasManualValuation,
    expectedFrequency: allowsProfitDistribution ? expectedFrequency : null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildPayload();

    if (editingId) {
      updateTypeMutation.mutate(
        { id: editingId, body: payload },
        { onSuccess: () => clearForm() },
      );
      return;
    }

    createTypeMutation.mutate(payload, {
      onSuccess: () => clearForm(),
    });
  };

  const isPending =
    createTypeMutation.isPending || updateTypeMutation.isPending;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-600" />
          Categorías de patrimonio
        </h1>
        <p className="text-slate-500 mt-2 max-w-2xl">
          Definí cómo clasificás cada posición: activos financieros (cuentan en portafolio y retorno) frente a
          bienes de uso que solo querés llevar en patrimonio (ej. auto sin métricas de inversión). Los pasivos van
          en Deudas. No hay plantillas por defecto: creá al menos una categoría antes de registrar posiciones.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <TypeForm
          formTitle={editingId ? 'Editar categoría' : 'Nueva categoría de patrimonio'}
          submitLabel={editingId ? 'Guardar cambios' : undefined}
          showCancel={Boolean(editingId)}
          onCancel={clearForm}
          name={name}
          setName={setName}
          generatesCashflow={generatesCashflow}
          setGeneratesCashflow={setGeneratesCashflow}
          allowsProfitDistribution={allowsProfitDistribution}
          setAllowsProfitDistribution={setAllowsProfitDistribution}
          allowsExtraContributions={allowsExtraContributions}
          setAllowsExtraContributions={setAllowsExtraContributions}
          allowsLinkedDebt={allowsLinkedDebt}
          setAllowsLinkedDebt={setAllowsLinkedDebt}
          hasManualValuation={hasManualValuation}
          setHasManualValuation={setHasManualValuation}
          countsInFinancialPortfolio={countsInFinancialPortfolio}
          setCountsInFinancialPortfolio={setCountsInFinancialPortfolio}
          expectedFrequency={expectedFrequency}
          setExpectedFrequency={setExpectedFrequency}
          onSubmit={handleSubmit}
          isPending={isPending}
        />

        <TypeList
          types={types}
          isLoading={isLoading}
          editingId={editingId}
          onEditType={handleEditType}
          onDeleteType={(id) => deleteTypeMutation.mutate(id)}
          isDeleting={deleteTypeMutation.isPending}
        />
      </div>
    </div>
  );
}
