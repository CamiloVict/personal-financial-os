'use client';
import React, { useState, useEffect } from 'react';
import { Landmark, FileWarning, RefreshCw, Activity } from 'lucide-react';
import {
  useTaxProfile,
  useTaxClassifications,
  useTaxPlan,
  useSaveTaxProfile,
  useAnalyzeTax
} from '@/features/tax/api/queries';

import {
  TaxProfileForm,
  TaxClassifications,
  TaxScenarios,
  TaxMissedOpportunities
} from '@/features/tax/components';

export default function TaxDashboard() {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'PLAN'>('PLAN');

  const { data: profile, isLoading: loadingProfile } = useTaxProfile();
  const { data: classifications = [], isLoading: loadingClassifications } = useTaxClassifications(!!profile);
  const { data: plan, isLoading: loadingPlan } = useTaxPlan(!!profile);

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

  // Mutations
  const saveProfileMutation = useSaveTaxProfile();
  const analyzeMutation = useAnalyzeTax();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfileMutation.mutate({
      taxYear: new Date().getFullYear(),
      jurisdiction: 'CO',
      isResident,
      daysInCountry: Number(daysInCountry),
      hasDependents,
      hasPrepaidMedicine,
      hasHousingInterest,
      hasVoluntaryPension,
      hasAFC
    }, {
      onSuccess: () => analyzeMutation.mutate(undefined, { onSuccess: () => setActiveTab('PLAN') }),
    });
  };

  const handleRecalculate = () => {
    analyzeMutation.mutate(undefined, { onSuccess: () => setActiveTab('PLAN') });
  };

  const classificationsPieData = classifications.reduce((acc: any[], curr: any) => {
    const cedula = curr.suggestedCedula.replace(/_/g, ' ');
    const amount = Number(curr.stream?.expectedAmount || 0) * 12; // Anualizado
    const existing = acc.find(item => item.name === cedula);
    if (existing) {
      existing.value += amount;
    } else {
      acc.push({ name: cedula, value: amount });
    }
    return acc;
  }, []);

  if (loadingProfile) {
    return <div className="flex justify-center py-20"><Activity className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end border-b border-slate-200/50 pb-4 mb-4">
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
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('PROFILE')}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${activeTab === 'PROFILE' ? 'bg-indigo-100 text-indigo-800' : 'glass-card hover:bg-slate-50 text-slate-600'}`}
          >
            Perfil y Beneficios
          </button>
          <button 
            onClick={() => setActiveTab('PLAN')}
            disabled={!profile}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${activeTab === 'PLAN' ? 'bg-indigo-100 text-indigo-800' : 'glass-card hover:bg-slate-50 text-slate-600'} disabled:opacity-50`}
          >
            Escenarios y Plan
          </button>
        </div>
      </header>

      {/* --- TAB: PROFILE --- */}
      {activeTab === 'PROFILE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TaxProfileForm 
            isResident={isResident} setIsResident={setIsResident}
            daysInCountry={daysInCountry} setDaysInCountry={setDaysInCountry}
            hasDependents={hasDependents} setHasDependents={setHasDependents}
            hasPrepaidMedicine={hasPrepaidMedicine} setHasPrepaidMedicine={setHasPrepaidMedicine}
            hasHousingInterest={hasHousingInterest} setHasHousingInterest={setHasHousingInterest}
            hasAFC={hasAFC} setHasAFC={setHasAFC}
            hasVoluntaryPension={hasVoluntaryPension} setHasVoluntaryPension={setHasVoluntaryPension}
            onSubmit={handleSaveProfile}
            isPending={saveProfileMutation.isPending || analyzeMutation.isPending}
          />

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-indigo-900 self-start">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5"><FileWarning className="w-4 h-4" /> Importante</h3>
            <p className="text-xs leading-relaxed mb-3">
              Este módulo utiliza un motor de reglas (TaxEngine) para sugerirte <strong>planeación tributaria legal</strong> basándose exclusivamente en los datos registrados en esta plataforma.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li>El motor <strong>no es un contador público</strong>. Las recomendaciones son sugerencias para optimizar tu carga tributaria.</li>
              <li>Toda recomendación incluye un <strong>nivel de confianza</strong>. Si el nivel es bajo o medio, requerirás aportar documentos soporte.</li>
              <li>Las simulaciones asumen la Unidad de Valor Tributario (UVT) proyectada.</li>
            </ul>
          </div>
        </div>
      )}

      {/* --- TAB: PLAN & SCENARIOS --- */}
      {activeTab === 'PLAN' && profile && (
        <div className="space-y-6">
          
          <div className="flex justify-between items-center glass-card p-3 rounded-lg shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Estado del Análisis</p>
              <p className="font-medium text-slate-800 text-xs">Motor de Reglas: <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">CO-AG2026-v1.0</span></p>
            </div>
            <button onClick={handleRecalculate} disabled={analyzeMutation.isPending} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5">
              <RefreshCw className={`w-3 h-3 ${analyzeMutation.isPending ? 'animate-spin' : ''}`} /> Recalcular Motor
            </button>
          </div>

          <TaxClassifications 
            classifications={classifications} 
            pieData={classificationsPieData} 
          />

          <TaxScenarios plan={plan} />

          <TaxMissedOpportunities profile={profile} />

        </div>
      )}
    </div>
  );
}