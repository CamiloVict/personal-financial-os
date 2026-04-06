/** Respuesta de GET /tax/planning-overview (subset usado en UI). */
export type TaxPlanningOverview = {
  framing: {
    title: string;
    intro: string;
    bullets: readonly string[] | string[];
  };
  profileSnapshot: {
    taxYear: number;
    jurisdiction: string;
    isResident: boolean;
    daysInCountry: number;
    primaryNationality: string;
    hasForeignIncome: boolean;
    hasForeignAssets: boolean;
    benefitFlags: Record<string, boolean>;
  } | null;
  routes: {
    prudent: {
      name: string;
      description: string;
      estimatedNetTaxPayable: number;
      estimatedTaxableBase: number;
      scenarioType: string;
    } | null;
    efficientSubjectToValidation: {
      name: string;
      description: string;
      estimatedNetTaxPayable: number;
      estimatedTaxableBase: number;
      scenarioType: string;
      validationNote: string;
      requiredSupports: string[];
      riskLevel: string;
    } | null;
  };
  incomeComposition: Array<{
    cedula: string;
    label: string;
    annualAmount: number;
    sharePct: number;
  }>;
  classificationRiskRows: Array<{
    streamName: string;
    referenceId: string;
    suggestedCedula: string;
    confidenceLevel: string;
    complianceRiskLevel: string;
    complianceRiskDetail: string;
    missingConditions: string[];
  }>;
  scenariosComparison: Array<{
    id: string;
    name: string;
    type: string;
    estimatedGrossIncome: number;
    estimatedDeductions: number;
    estimatedExemptions: number;
    estimatedTaxableBase: number;
    estimatedNetTaxPayable: number;
    riskLevel: string;
  }>;
  benefits: Array<{
    id: string;
    label: string;
    enabledInProfile: boolean;
    conditionsPending: string[];
    typicalSupports: string[];
  }>;
  supportChecklist: Array<{ category: string; items: string[] }>;
  pendingConditions: string[];
  estimatedTaxBurden: {
    conservativeNet: number | null;
    optimizedNet: number | null;
    difference: number | null;
  };
  planGeneratedAt: string | null;
  needsRecalculation: boolean;
  normalizationWarnings: string[];
  annualPlanHighlights: string[];
  engineVersion: string;
  uvtReferenceCop: number;
  confidence?: import('@personal-finance-os/explanation').FinancialConfidence;
};
