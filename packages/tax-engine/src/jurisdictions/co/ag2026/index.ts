import {
  TaxProfileInput,
  IncomeStreamInput,
  TaxClassificationResult,
  TaxScenarioOutput,
  TaxRuleEngine,
  TaxLeverComparisonRow,
} from '../../../core/contracts';

const UVT_2026 = 48000; // Estimated 2026 UVT for Colombia

export function calculateColombiaIncomeTaxUVT2026(taxableBase: number, uvt: number = UVT_2026): number {
  const uvtBase = taxableBase / uvt;
  if (uvtBase <= 1090) return 0;
  if (uvtBase <= 1700) return (uvtBase - 1090) * 0.19 * uvt;
  if (uvtBase <= 4100) return ((uvtBase - 1700) * 0.28 + 116) * uvt;
  if (uvtBase <= 8670) return ((uvtBase - 4100) * 0.33 + 788) * uvt;
  if (uvtBase <= 18970) return ((uvtBase - 8670) * 0.35 + 2296) * uvt;
  if (uvtBase <= 31000) return ((uvtBase - 18970) * 0.37 + 5901) * uvt;
  return ((uvtBase - 31000) * 0.39 + 10352) * uvt;
}

function sumAnnualIncome(classifiedIncome: TaxClassificationResult[]): number {
  return classifiedIncome.reduce((acc, c) => acc + (c.annualGrossAmount ?? 0), 0);
}

function sumForeignTaxes(classifiedIncome: TaxClassificationResult[]): number {
  return classifiedIncome.reduce((acc, c) => acc + (c.foreignTaxPaid || 0), 0);
}

/** Detalle del escenario optimizado (deducciones, exenciones, tope 40% / 1340 UVT, 25% laboral). */
export function computeOptimizedTaxSnapshot(
  profile: TaxProfileInput,
  totalIncome: number,
  foreignTaxes: number,
  uvt: number = UVT_2026,
): {
  appliedDeductions: number;
  appliedExemptions: number;
  taxableBase: number;
  taxLiability: number;
  foreignCredit: number;
  netPayable: number;
} {
  let totalDeductions = 0;
  let explicitExemptions = 0;

  if (profile.hasDependents) {
    const maxDependents = 384 * uvt;
    totalDeductions += Math.min(totalIncome * 0.1, maxDependents);
  }
  if (profile.hasPrepaidMedicine) {
    const maxMedicine = 192 * uvt;
    totalDeductions += Math.min(totalIncome * 0.05, maxMedicine);
  }
  if (profile.hasHousingInterest) {
    const maxHousing = 1200 * uvt;
    totalDeductions += Math.min(totalIncome * 0.15, maxHousing);
  }
  if (profile.hasAFC) {
    explicitExemptions += totalIncome * 0.1;
  }
  if (profile.hasVoluntaryPension) {
    explicitExemptions += totalIncome * 0.1;
  }

  const subtotalBase = totalIncome - totalDeductions - explicitExemptions;
  const exempt25 = Math.min(Math.max(0, subtotalBase * 0.25), 790 * uvt);
  const maxAllowedDeductions = Math.min(totalIncome * 0.4, 1340 * uvt);

  let appliedExemptions = explicitExemptions + exempt25;
  let appliedDeductions = totalDeductions;

  if (appliedExemptions + appliedDeductions > maxAllowedDeductions) {
    const excess = appliedExemptions + appliedDeductions - maxAllowedDeductions;
    appliedExemptions -= excess;
    if (appliedExemptions < 0) {
      appliedDeductions += appliedExemptions;
      appliedExemptions = 0;
    }
  }

  const taxableBase = totalIncome - appliedDeductions - appliedExemptions;
  const taxLiability = calculateColombiaIncomeTaxUVT2026(taxableBase, uvt);
  const foreignCredit =
    foreignTaxes > 0 ? Math.min(foreignTaxes, taxLiability) : 0;
  const netPayable = Math.max(0, taxLiability - foreignCredit);

  return {
    appliedDeductions,
    appliedExemptions,
    taxableBase,
    taxLiability,
    foreignCredit,
    netPayable,
  };
}

function minimalBenefitProfile(base: TaxProfileInput): TaxProfileInput {
  return {
    ...base,
    hasDependents: false,
    hasVoluntaryPension: false,
    hasAFC: false,
    hasPrepaidMedicine: false,
    hasHousingInterest: false,
  };
}

/** Aplica varias palancas de optimización sobre un perfil “en blanco” de beneficios (para simular combinaciones). */
export function applyTaxLeverSelection(
  base: TaxProfileInput,
  leverIds: readonly string[],
): TaxProfileInput {
  const p = minimalBenefitProfile(base);
  const set = new Set(leverIds);
  if (set.has('LEVER_VOLUNTARY_PENSION')) p.hasVoluntaryPension = true;
  if (set.has('LEVER_AFC')) p.hasAFC = true;
  if (set.has('LEVER_HOUSING')) p.hasHousingInterest = true;
  if (set.has('LEVER_PREPAID')) p.hasPrepaidMedicine = true;
  if (set.has('LEVER_DEPENDENTS')) p.hasDependents = true;
  return p;
}

export class ColombiaTaxEngineAG2026 implements TaxRuleEngine {
  public readonly version = 'CO-AG2026-v1.0';

  classifyIncome(stream: IncomeStreamInput, profile: TaxProfileInput): TaxClassificationResult {
    let suggestedCedula = 'RENTA_NO_LABORAL';
    let confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    let explanation = '';
    const missingConditions: string[] = [];
    const isForeignSource = stream.sourceCountry !== 'CO';

    if (isForeignSource) {
      if (stream.contractType === 'FOREIGN_CONTRACTOR' && !stream.hasSubordination) {
        suggestedCedula = 'HONORARIOS_SERVICIOS';
        confidenceLevel = 'HIGH';
        explanation =
          'Los ingresos del exterior sin subordinación tributan típicamente bajo Honorarios/Servicios.';
        missingConditions.push(
          'Verificar si existe certificado de residencia fiscal del país de origen para posibles convenios.',
        );
      } else if (stream.contractType === 'LABOR' || stream.hasSubordination) {
        suggestedCedula = 'RENTA_DE_TRABAJO';
        confidenceLevel = 'MEDIUM';
        explanation =
          'Ingreso de fuente extranjera con subordinación. Podría asimilarse a Renta de Trabajo, pero requiere validación si la empresa no retiene en Colombia.';
        missingConditions.push(
          'Contrato que pruebe subordinación.',
          'Soporte de pagos de seguridad social en Colombia si aplica.',
        );
      } else {
        confidenceLevel = 'LOW';
        explanation =
          'No hay suficiente información para clasificar el ingreso del exterior. Se asume Renta No Laboral por defecto.';
        missingConditions.push('Definir tipo de contrato y nivel de subordinación.');
      }
    } else {
      if (stream.contractType === 'LABOR') {
        suggestedCedula = 'RENTA_DE_TRABAJO';
        confidenceLevel = 'HIGH';
        explanation = 'Clasificación directa como Renta de Trabajo por contrato laboral en Colombia.';
      } else if (stream.contractType === 'SERVICE' || stream.contractType === 'INDEPENDENT') {
        suggestedCedula = 'HONORARIOS_SERVICIOS';
        confidenceLevel = 'HIGH';
        explanation = 'Prestación de servicios independiente en Colombia.';
      }
    }

    if (!profile.isResident && profile.daysInCountry < 183) {
      explanation +=
        ' ADVERTENCIA: Al no ser residente fiscal, solo declararías renta de fuente nacional.';
      if (isForeignSource) {
        suggestedCedula = 'NO_GRAVADO_NO_RESIDENTE';
        confidenceLevel = 'HIGH';
        missingConditions.push(
          'Confirmar que no se superan 183 días de permanencia para mantener estatus de no residente.',
        );
      }
    }

    return {
      referenceId: stream.id,
      annualGrossAmount: stream.amount,
      suggestedCedula,
      confidenceLevel,
      isForeignSource,
      foreignTaxPaid: stream.foreignTaxPaid || 0,
      explanation,
      missingConditions,
    };
  }

  generateScenarios(
    profile: TaxProfileInput,
    classifiedIncome: TaxClassificationResult[],
  ): TaxScenarioOutput[] {
    const totalIncome = sumAnnualIncome(classifiedIncome);
    const foreignTaxes = sumForeignTaxes(classifiedIncome);
    const consTax = calculateColombiaIncomeTaxUVT2026(totalIncome, UVT_2026);

    const scenarios: TaxScenarioOutput[] = [
      {
        name: 'Escenario Conservador',
        type: 'CONSERVATIVE',
        estimatedGrossIncome: totalIncome,
        estimatedDeductions: 0,
        estimatedExemptions: 0,
        estimatedTaxableBase: totalIncome,
        estimatedTaxLiability: consTax,
        estimatedForeignCredit: 0,
        estimatedNetTaxPayable: consTax,
        explanation:
          'Este escenario asume que no tomarás deducciones ni rentas exentas y pagas sobre el ingreso bruto. Es el cálculo más seguro pero más costoso.',
        riskLevel: 'LOW',
        requirements: ['Soportes de ingresos básicos.'],
      },
    ];

    const requirements: string[] = [];
    const explanationParts: string[] = ['Estrategia eficiente: Aplicamos'];

    if (profile.hasDependents) {
      requirements.push(
        'Registro civil o documento legal que demuestre la dependencia económica.',
      );
      explanationParts.push('Deducción por Dependientes');
    }
    if (profile.hasPrepaidMedicine) {
      requirements.push('Certificado de pagos a medicina prepagada del año gravable.');
      explanationParts.push('Medicina Prepagada');
    }
    if (profile.hasHousingInterest) {
      requirements.push('Certificado bancario de intereses pagados por crédito hipotecario.');
      explanationParts.push('Intereses de Vivienda');
    }
    if (profile.hasAFC) {
      requirements.push(
        'Certificado de la entidad financiera confirmando el saldo depositado en la cuenta AFC sin retiro o usado para vivienda.',
      );
      explanationParts.push('Beneficio por Ahorro AFC');
    }
    if (profile.hasVoluntaryPension) {
      requirements.push(
        'Certificado del fondo de pensiones voluntarias (FPV) demostrando los aportes bajo la ley de renta exenta.',
      );
      explanationParts.push('Aportes a Pensión Voluntaria');
    }
    explanationParts.push('el 25% de Renta Exenta Laboral Automática');

    const snap = computeOptimizedTaxSnapshot(profile, totalIncome, foreignTaxes, UVT_2026);
    let creditApplied = snap.foreignCredit;
    if (foreignTaxes > 0) {
      requirements.push(
        'Certificado de retención de impuestos (Withholding Tax Certificate) apostillado o legalizado del país de origen.',
      );
      explanationParts.push('y Descuento por Impuestos Pagados en el Exterior');
    }

    scenarios.push({
      name: 'Escenario Optimizado (Recomendado)',
      type: 'OPTIMIZED',
      estimatedGrossIncome: totalIncome,
      estimatedDeductions: snap.appliedDeductions,
      estimatedExemptions: snap.appliedExemptions,
      estimatedTaxableBase: snap.taxableBase,
      estimatedTaxLiability: snap.taxLiability,
      estimatedForeignCredit: creditApplied,
      estimatedNetTaxPayable: snap.netPayable,
      explanation: `${explanationParts.join(', ')}. Recuerda que los aportes AFC/Voluntarios están sujetos a límites de retención y permanencia.`,
      riskLevel: creditApplied > 0 ? 'MEDIUM' : 'LOW',
      requirements,
    });

    return scenarios;
  }

  compareLeverScenarios(
    actualProfile: TaxProfileInput,
    classifiedIncome: TaxClassificationResult[],
  ): TaxLeverComparisonRow[] {
    const totalIncome = sumAnnualIncome(classifiedIncome);
    const foreignTaxes = sumForeignTaxes(classifiedIncome);
    if (totalIncome <= 0) return [];

    const conservative = calculateColombiaIncomeTaxUVT2026(totalIncome, UVT_2026);
    const base = minimalBenefitProfile(actualProfile);

    const levers: Array<{
      id: string;
      label: string;
      description: string;
      patch: Partial<TaxProfileInput>;
    }> = [
      {
        id: 'LEVER_VOLUNTARY_PENSION',
        label: 'Solo pensión voluntaria (FPV)',
        description:
          'Simulación: únicamente aportes a FPV como renta exenta (resto de beneficios apagados).',
        patch: { hasVoluntaryPension: true },
      },
      {
        id: 'LEVER_AFC',
        label: 'Solo AFC',
        description: 'Simulación: únicamente ahorro AFC como renta exenta.',
        patch: { hasAFC: true },
      },
      {
        id: 'LEVER_HOUSING',
        label: 'Solo intereses de vivienda',
        description: 'Simulación: únicamente deducción por intereses de crédito hipotecario.',
        patch: { hasHousingInterest: true },
      },
      {
        id: 'LEVER_PREPAID',
        label: 'Solo medicina prepagada',
        description: 'Simulación: únicamente deducción por medicina prepagada / pólizas.',
        patch: { hasPrepaidMedicine: true },
      },
      {
        id: 'LEVER_DEPENDENTS',
        label: 'Solo dependientes',
        description: 'Simulación: únicamente deducción por dependientes económicos.',
        patch: { hasDependents: true },
      },
    ];

    const rows: TaxLeverComparisonRow[] = [
      {
        id: 'CONSERVATIVE',
        label: 'Conservador (sin deducciones)',
        description: 'Impuesto sobre ingreso bruto anual estimado, sin beneficios.',
        estimatedGrossIncome: totalIncome,
        estimatedTaxableBase: totalIncome,
        estimatedNetTaxPayable: conservative,
        savingsVsConservative: 0,
      },
    ];

    for (const lever of levers) {
      const profile: TaxProfileInput = { ...base, ...lever.patch };
      const snap = computeOptimizedTaxSnapshot(profile, totalIncome, 0, UVT_2026);
      rows.push({
        id: lever.id,
        label: lever.label,
        description: lever.description,
        estimatedGrossIncome: totalIncome,
        estimatedTaxableBase: snap.taxableBase,
        estimatedNetTaxPayable: snap.netPayable,
        savingsVsConservative: Math.max(0, conservative - snap.netPayable),
      });
    }

    const fullSnap = computeOptimizedTaxSnapshot(actualProfile, totalIncome, foreignTaxes, UVT_2026);
    rows.push({
      id: 'OPTIMIZED_ACTUAL',
      label: 'Tu perfil actual (combinado)',
      description:
        'Todos los beneficios que marcaste en tu perfil, más crédito por impuestos en el exterior si aplica.',
      estimatedGrossIncome: totalIncome,
      estimatedTaxableBase: fullSnap.taxableBase,
      estimatedNetTaxPayable: fullSnap.netPayable,
      savingsVsConservative: Math.max(0, conservative - fullSnap.netPayable),
    });

    return rows;
  }
}
