'use client';
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Landmark, FileWarning, RefreshCw, Activity, AlertCircle } from 'lucide-react';
import {
  useTaxProfile,
  useTaxClassifications,
  useTaxPlan,
  useSaveTaxProfile,
  useAnalyzeTax,
  useTaxDeclarationInsights,
  useTaxDeclarationPreview,
} from '@/features/tax/api/queries';

import {
  TaxProfileForm,
  TaxClassifications,
  TaxScenarios,
  TaxMissedOpportunities,
  TaxDeclarationSection,
} from '@/features/tax/components';
import { ExplanationPanel } from '@/shared/ui/ExplanationPanel';
import { ConfidenceBadge } from '@/shared/ui/ConfidenceBadge';

export default function TaxDashboard() {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'PLAN'>('PROFILE');
  const [selectedLeverIds, setSelectedLeverIds] = useState<string[]>([]);

  const {
    data: profile,
    isLoading: loadingProfile,
    isError: profileError,
    error: profileErrorDetail,
    refetch: refetchProfile,
  } = useTaxProfile();
  const { data: classificationPayload } = useTaxClassifications(!!profile);
  const classifications = classificationPayload?.classifications ?? [];
  const classificationsExplanation = classificationPayload?.explanation;
  const classificationsConfidence = classificationPayload?.confidence;
  const { data: plan, isLoading: loadingPlan } = useTaxPlan(!!profile);
  const { data: declarationInsights, isLoading: loadingDeclaration } = useTaxDeclarationInsights(!!profile);

  const previewEnabled =
    !!profile && !!declarationInsights?.showDeclarationModule;
  const {
    data: comboPreview,
    isFetching: comboFetching,
    isError: comboError,
    isPlaceholderData: comboStale,
  } = useTaxDeclarationPreview(previewEnabled, selectedLeverIds);

  const toggleLever = (leverId: string) => {
    setSelectedLeverIds((prev) =>
      prev.includes(leverId) ? prev.filter((id) => id !== leverId) : [...prev, leverId],
    );
  };

  /** Tras cargar el perfil desde el API, abrir Escenarios si ya existe perfil guardado (evita pantalla vacía con pestaña Plan). */
  useLayoutEffect(() => {
    if (loadingProfile) return;
    setActiveTab(profile ? 'PLAN' : 'PROFILE');
  }, [loadingProfile, profile?.id]);

  // Profile Form State
  const [isResident, setIsResident] = useState(true);
  const [daysInCountry, setDaysInCountry] = useState<string>('365');
  const [hasDependents, setHasDependents] = useState(false);
  const [hasPrepaidMedicine, setHasPrepaidMedicine] = useState(false);
  const [hasHousingInterest, setHasHousingInterest] = useState(false);
  const [hasVoluntaryPension, setHasVoluntaryPension] = useState(false);
  const [hasAFC, setHasAFC] = useState(false);

  useEffect(() => {
    if (profile) {
      setIsResident(profile.isResident);
      setDaysInCountry(String(profile.daysInCountry));
      setHasDependents(profile.hasDependents);
      setHasPrepaidMedicine(profile.hasPrepaidMedicine);
      setHasHousingInterest(profile.hasHousingInterest);
      setHasVoluntaryPension(profile.hasVoluntaryPension || false);
      setHasAFC(profile.hasAFC || false);
    }
  }, [profile]);

  const saveProfileMutation = useSaveTaxProfile();
  const analyzeMutation = useAnalyzeTax();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfileMutation.mutate(
      {
        taxYear: new Date().getFullYear(),
        jurisdiction: 'CO',
        isResident,
        daysInCountry: Number(daysInCountry),
        hasDependents,
        hasPrepaidMedicine,
        hasHousingInterest,
        hasVoluntaryPension,
        hasAFC,
      },
      {
        onSuccess: () => setActiveTab('PLAN'),
      },
    );
  };

  const handleRecalculate = () => {
    analyzeMutation.mutate(undefined, { onSuccess: () => setActiveTab('PLAN') });
  };

  const classificationsPieData = classifications.reduce((acc: any[], curr: any) => {
    const cedula = curr.suggestedCedula.replace(/_/g, ' ');
    const amount = Number(curr.stream?.expectedAmount || 0) * 12;
    const existing = acc.find((item) => item.name === cedula);
    if (existing) {
      existing.value += amount;
    } else {
      acc.push({ name: cedula, value: amount });
    }
    return acc;
  }, []);

  if (loadingProfile) {
    return (
      <div className="flex justify-center py-20">
        <Activity className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="glass-card rounded-xl p-6 border border-rose-200 bg-rose-50/80">
        <h2 className="text-sm font-bold text-rose-900 flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5" />
          No se pudo cargar el perfil fiscal
        </h2>
        <p className="text-xs text-rose-800 mb-3">
          {profileErrorDetail instanceof Error ? profileErrorDetail.message : 'Revisa que el API esté en marcha y que tengas sesión iniciada.'}
        </p>
        <button
          type="button"
          onClick={() => refetchProfile()}
          className="text-xs font-semibold bg-rose-700 text-white px-3 py-2 rounded-lg hover:bg-rose-800"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 border-b border-slate-200/50 pb-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-1 bg-indigo-100 rounded-md">
              <Landmark className="w-4 h-4 text-indigo-600" />
            </div>
            Planeación Fiscal
          </h1>
          <p className="text-slate-500 mt-1 max-w-2xl text-xs">
            Simula tu declaración de renta y obtén escenarios legales optimizados basados en tus ingresos registrados.
          </p>
          {profile ? (
            <p className="text-[11px] text-emerald-700 font-medium mt-2">
              Perfil guardado (año fiscal {profile.taxYear}, {profile.jurisdiction}) — puedes editarlo cuando quieras en
              &quot;Perfil y Beneficios&quot;.
            </p>
          ) : (
            <p className="text-[11px] text-amber-800 font-medium mt-2">
              Aún no tienes perfil fiscal guardado. Completa el formulario y pulsa &quot;Guardar y Generar
              Escenarios&quot;.
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('PROFILE')}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
              activeTab === 'PROFILE' ? 'bg-indigo-100 text-indigo-800' : 'glass-card hover:bg-slate-50 text-slate-600'
            }`}
          >
            Perfil y Beneficios
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PLAN')}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
              activeTab === 'PLAN' ? 'bg-indigo-100 text-indigo-800' : 'glass-card hover:bg-slate-50 text-slate-600'
            }`}
          >
            Escenarios y Plan
          </button>
        </div>
      </header>

      {activeTab === 'PROFILE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TaxProfileForm
            isResident={isResident}
            setIsResident={setIsResident}
            daysInCountry={daysInCountry}
            setDaysInCountry={setDaysInCountry}
            hasDependents={hasDependents}
            setHasDependents={setHasDependents}
            hasPrepaidMedicine={hasPrepaidMedicine}
            setHasPrepaidMedicine={setHasPrepaidMedicine}
            hasHousingInterest={hasHousingInterest}
            setHasHousingInterest={setHasHousingInterest}
            hasAFC={hasAFC}
            setHasAFC={setHasAFC}
            hasVoluntaryPension={hasVoluntaryPension}
            setHasVoluntaryPension={setHasVoluntaryPension}
            onSubmit={handleSaveProfile}
            isPending={saveProfileMutation.isPending}
          />

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-indigo-900 self-start">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5">
              <FileWarning className="w-4 h-4" /> Importante
            </h3>
            <p className="text-xs leading-relaxed mb-3">
              Este módulo utiliza un motor de reglas (TaxEngine) para{' '}
              <strong>simular escenarios tributarios</strong> con base en los datos que registres en la plataforma.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li>
                El motor <strong>no es contador ni asesor</strong>. La salida es ilustrativa; la obligación de declarar y
                soportar corresponde al contribuyente.
              </li>
              <li>
                Cada vista incluye un <strong>nivel de confianza</strong> sobre la completitud de datos; si es bajo o
                medio, conviene validar con documentos y un profesional.
              </li>
              <li>Las simulaciones asumen la Unidad de Valor Tributario (UVT) proyectada.</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'PLAN' && !profile && (
        <div className="glass-card rounded-xl p-8 text-center border border-dashed border-slate-300">
          <p className="text-sm text-slate-600 mb-4 max-w-md mx-auto">
            Para ver escenarios, clasificación de ingresos y gráficos necesitas un perfil fiscal guardado.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('PROFILE')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Ir a Perfil y Beneficios
          </button>
        </div>
      )}

      {activeTab === 'PLAN' && profile && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-2 glass-card p-3 rounded-lg shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Estado del Análisis</p>
              <p className="font-medium text-slate-800 text-xs">
                Motor de Reglas:{' '}
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">CO-AG2026-v1.0</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('PROFILE')}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md text-xs font-semibold"
              >
                Editar perfil
              </button>
              <button
                type="button"
                onClick={handleRecalculate}
                disabled={analyzeMutation.isPending}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${analyzeMutation.isPending ? 'animate-spin' : ''}`} /> Recalcular
                Motor
              </button>
            </div>
          </div>

          {loadingDeclaration ? (
            <div className="h-32 rounded-xl bg-slate-100 animate-pulse border border-slate-200" aria-hidden />
          ) : null}
          {declarationInsights && declarationInsights.showDeclarationModule ? (
            <TaxDeclarationSection
              data={declarationInsights}
              selectedLeverIds={selectedLeverIds}
              combinedPreview={selectedLeverIds.length > 0 ? comboPreview : null}
              combinedPreviewLoading={
                selectedLeverIds.length > 0 && comboFetching && comboPreview === undefined
              }
              combinedPreviewError={selectedLeverIds.length > 0 && comboError}
              combinedPreviewStale={Boolean(comboStale)}
              onClearSelection={() => setSelectedLeverIds([])}
            />
          ) : null}

          <ExplanationPanel
            explanation={
              selectedLeverIds.length > 0
                ? comboPreview?.explanation ?? declarationInsights?.explanation
                : declarationInsights?.explanation
            }
            defaultOpen={false}
          />

          <div className="flex justify-end">
            <ConfidenceBadge confidence={classificationsConfidence} />
          </div>
          <TaxClassifications classifications={classifications} pieData={classificationsPieData} />

          <ExplanationPanel explanation={classificationsExplanation} defaultOpen={false} />

          <div className="flex justify-end">
            <ConfidenceBadge confidence={plan?.confidence} />
          </div>
          <ExplanationPanel explanation={plan?.explanation} defaultOpen={false} />

          {loadingPlan ? (
            <div className="h-40 rounded-xl bg-slate-100 animate-pulse border border-slate-200" aria-hidden />
          ) : null}
          <TaxScenarios plan={plan} />

          {!plan && !loadingPlan ? (
            <div className="text-center text-xs text-slate-500 py-4 border border-dashed border-slate-200 rounded-lg">
              Aún no hay escenarios generados. Pulsa <strong>Recalcular Motor</strong> o vuelve a guardar el perfil desde
              &quot;Perfil y Beneficios&quot;.
            </div>
          ) : null}

          <TaxMissedOpportunities
            profile={profile}
            onToggleLever={toggleLever}
            selectedLeverIds={selectedLeverIds}
          />
        </div>
      )}
    </div>
  );
}
