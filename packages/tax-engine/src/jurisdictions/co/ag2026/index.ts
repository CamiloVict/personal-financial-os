import {
  createNode,
  emptyFinancialExplanation,
  type FinancialExplanation,
} from '@personal-finance-os/explanation';
import {
  CO_AG2026_BUNDLE_NORMATIVE_REFS,
  CO_AG2026_ENGINE_VERSION,
  CO_AG2026_LAW_PACKAGE_ID,
  CO_AG2026_TAX_YEAR,
  normativeRefsForRule,
} from '../../../regulatory';
import {
  TaxProfileInput,
  IncomeStreamInput,
  TaxClassificationResult,
  TaxScenarioOutput,
  TaxRuleEngine,
  TaxLeverComparisonRow,
} from '../../../core/contracts';
import type {
  NormalizedTaxFinancials,
  TaxMonetaryLineKind,
} from '../../../core/tax-normalization';

/** UVT de referencia del modelo CO-AG2026 (estimada). */
export const UVT_2026 = 48000;

/** @deprecated Usar `CO_AG2026_BUNDLE_NORMATIVE_REFS` desde `regulatory`; se mantiene alias para imports legacy. */
export const CO_AG2026_NORMATIVE_REFS = CO_AG2026_BUNDLE_NORMATIVE_REFS;

export function calculateColombiaIncomeTaxUVT2026Detailed(
  taxableBase: number,
  uvt: number = UVT_2026,
): { tax: number; uvtBase: number; bracketLabel: string } {
  const uvtBase = taxableBase / uvt;
  let tax = 0;
  let bracketLabel = '';
  if (uvtBase <= 1090) {
    tax = 0;
    bracketLabel = 'Hasta 1090 UVT: 0%';
  } else if (uvtBase <= 1700) {
    tax = (uvtBase - 1090) * 0.19 * uvt;
    bracketLabel = '1090–1700 UVT: 19% sobre excedente de 1090 UVT';
  } else if (uvtBase <= 4100) {
    tax = ((uvtBase - 1700) * 0.28 + 116) * uvt;
    bracketLabel = '1700–4100 UVT: tramo 28% + constante en UVT (modelo motor)';
  } else if (uvtBase <= 8670) {
    tax = ((uvtBase - 4100) * 0.33 + 788) * uvt;
    bracketLabel = '4100–8670 UVT: tramo 33% + constante en UVT (modelo motor)';
  } else if (uvtBase <= 18970) {
    tax = ((uvtBase - 8670) * 0.35 + 2296) * uvt;
    bracketLabel = '8670–18970 UVT: tramo 35% + constante en UVT (modelo motor)';
  } else if (uvtBase <= 31000) {
    tax = ((uvtBase - 18970) * 0.37 + 5901) * uvt;
    bracketLabel = '18970–31000 UVT: tramo 37% + constante en UVT (modelo motor)';
  } else {
    tax = ((uvtBase - 31000) * 0.39 + 10352) * uvt;
    bracketLabel = 'Más de 31000 UVT: tramo 39% + constante en UVT (modelo motor)';
  }
  return { tax, uvtBase, bracketLabel };
}

export function calculateColombiaIncomeTaxUVT2026(
  taxableBase: number,
  uvt: number = UVT_2026,
): number {
  return calculateColombiaIncomeTaxUVT2026Detailed(taxableBase, uvt).tax;
}

function sumAnnualIncome(classifiedIncome: TaxClassificationResult[]): number {
  return classifiedIncome.reduce((acc, c) => acc + (c.annualGrossAmount ?? 0), 0);
}

function sumForeignTaxes(classifiedIncome: TaxClassificationResult[]): number {
  return classifiedIncome.reduce((acc, c) => acc + (c.foreignTaxPaid || 0), 0);
}

function sumNormalizedDeductions(
  normalized: NormalizedTaxFinancials | undefined,
  kind: TaxMonetaryLineKind,
): number {
  if (!normalized) return 0;
  return normalized.deductions
    .filter((d) => d.kind === kind)
    .reduce((a, d) => a + Math.max(0, d.annualAmountCOP), 0);
}

type OptimizedSnapshot = {
  appliedDeductions: number;
  appliedExemptions: number;
  taxableBase: number;
  taxLiability: number;
  foreignCredit: number;
  netPayable: number;
};

/** Detalle del escenario optimizado (deducciones, exenciones, tope 40% / 1340 UVT, 25% laboral). */
export function computeOptimizedTaxSnapshot(
  profile: TaxProfileInput,
  totalIncome: number,
  foreignTaxes: number,
  uvt: number = UVT_2026,
  normalized?: NormalizedTaxFinancials,
): OptimizedSnapshot {
  return computeOptimizedTaxSnapshotWithExplanation(
    profile,
    totalIncome,
    foreignTaxes,
    uvt,
    normalized,
  ).snapshot;
}

/** Igual que `computeOptimizedTaxSnapshot` más grafo de explicación serializable. */
export function computeOptimizedTaxSnapshotWithExplanation(
  profile: TaxProfileInput,
  totalIncome: number,
  foreignTaxes: number,
  uvt: number = UVT_2026,
  normalized?: NormalizedTaxFinancials,
): { snapshot: OptimizedSnapshot; explanation: FinancialExplanation } {
  let totalDeductions = 0;
  let explicitExemptions = 0;
  const stepChildren: ReturnType<typeof createNode>[] = [];

  if (profile.hasDependents) {
    const maxDependents = 384 * uvt;
    const amt = Math.min(totalIncome * 0.1, maxDependents);
    totalDeductions += amt;
    stepChildren.push(
      createNode({
        kind: 'rule',
        label: 'Deducción por dependientes',
        description: 'Hasta 10% del ingreso, tope 384 UVT anuales (modelo motor).',
        value: -amt,
        ruleRef: 'CO-AG2026-DED-DEP',
        normativeRefs: normativeRefsForRule('CO-AG2026-DED-DEP'),
      }),
    );
  }
  const capPrepaid = Math.min(totalIncome * 0.05, 192 * uvt);
  const dataPrepaidRaw = sumNormalizedDeductions(normalized, 'PREPAID_MEDICINE');
  const dataPrepaid = Math.min(dataPrepaidRaw, capPrepaid);
  const profilePrepaid = profile.hasPrepaidMedicine ? capPrepaid : 0;
  if (dataPrepaidRaw > 0 || profile.hasPrepaidMedicine) {
    const amt = Math.min(Math.max(profilePrepaid, dataPrepaid), capPrepaid);
    if (amt > 0) {
      totalDeductions += amt;
      stepChildren.push(
        createNode({
          kind: 'rule',
          label: 'Deducción medicina prepagada / pólizas',
          description:
            dataPrepaidRaw > 0
              ? `Tope 5% del ingreso / 192 UVT. Se usa el mayor entre perfil y gastos Cashflow normalizados (${dataPrepaidRaw.toFixed(0)} COP/año bruto).`
              : 'Hasta 5% del ingreso, tope 192 UVT (modelo motor).',
          value: -amt,
          ruleRef: 'CO-AG2026-DED-PREP',
          normativeRefs: normativeRefsForRule('CO-AG2026-DED-PREP'),
        }),
      );
    }
  }

  const capHousing = Math.min(totalIncome * 0.15, 1200 * uvt);
  const dataHousingRaw = sumNormalizedDeductions(normalized, 'HOUSING_INTEREST');
  const dataHousing = Math.min(dataHousingRaw, capHousing);
  const profileHousing = profile.hasHousingInterest ? capHousing : 0;
  if (dataHousingRaw > 0 || profile.hasHousingInterest) {
    const amt = Math.min(Math.max(profileHousing, dataHousing), capHousing);
    if (amt > 0) {
      totalDeductions += amt;
      stepChildren.push(
        createNode({
          kind: 'rule',
          label: 'Deducción intereses de vivienda',
          description:
            dataHousingRaw > 0
              ? `Tope 15% / 1200 UVT. Incluye intereses modelados desde deudas (hipoteca) y/o gastos Cashflow (${dataHousingRaw.toFixed(0)} COP/año bruto).`
              : 'Hasta 15% del ingreso, tope 1200 UVT (modelo motor).',
          value: -amt,
          ruleRef: 'CO-AG2026-DED-VIV',
          normativeRefs: normativeRefsForRule('CO-AG2026-DED-VIV'),
        }),
      );
    }
  }

  const capAfc = totalIncome * 0.1;
  const dataAfcRaw = sumNormalizedDeductions(normalized, 'AFC_CONTRIBUTION');
  const dataAfc = Math.min(dataAfcRaw, capAfc);
  const profileAfc = profile.hasAFC ? capAfc : 0;
  if (dataAfcRaw > 0 || profile.hasAFC) {
    const amt = Math.min(Math.max(profileAfc, dataAfc), capAfc);
    if (amt > 0) {
      explicitExemptions += amt;
      stepChildren.push(
        createNode({
          kind: 'rule',
          label: 'Renta exenta AFC (simplificada)',
          description:
            dataAfcRaw > 0
              ? `10% del ingreso en motor; considera aportes AFC desde Cashflow (${dataAfcRaw.toFixed(0)} COP/año bruto). Topes legales adicionales no modelados.`
              : '10% del ingreso en motor; topes legales adicionales no modelados aquí.',
          value: -amt,
          ruleRef: 'CO-AG2026-EX-AFC',
          normativeRefs: normativeRefsForRule('CO-AG2026-EX-AFC'),
        }),
      );
    }
  }

  const capFpv = totalIncome * 0.1;
  const dataFpvRaw = sumNormalizedDeductions(
    normalized,
    'VOLUNTARY_PENSION_CONTRIBUTION',
  );
  const dataFpv = Math.min(dataFpvRaw, capFpv);
  const profileFpv = profile.hasVoluntaryPension ? capFpv : 0;
  if (dataFpvRaw > 0 || profile.hasVoluntaryPension) {
    const amt = Math.min(Math.max(profileFpv, dataFpv), capFpv);
    if (amt > 0) {
      explicitExemptions += amt;
      stepChildren.push(
        createNode({
          kind: 'rule',
          label: 'Renta exenta pensión voluntaria FPV (simplificada)',
          description:
            dataFpvRaw > 0
              ? `10% del ingreso en motor; aportes FPV desde Cashflow (${dataFpvRaw.toFixed(0)} COP/año bruto). Topes legales adicionales no modelados.`
              : '10% del ingreso en motor; topes legales adicionales no modelados aquí.',
          value: -amt,
          ruleRef: 'CO-AG2026-EX-FPV',
          normativeRefs: normativeRefsForRule('CO-AG2026-EX-FPV'),
        }),
      );
    }
  }

  const otherDed = sumNormalizedDeductions(normalized, 'OTHER_DEDUCTIBLE');
  if (otherDed > 0) {
    totalDeductions += otherDed;
    stepChildren.push(
      createNode({
        kind: 'rule',
        label: 'Otros gastos deducibles (Cashflow)',
        description:
          'Categorías con fiscalExpenseHint OTHER_DEDUCTIBLE; validar contra norma y topes globales del motor.',
        value: -otherDed,
        ruleRef: 'CO-AG2026-DED-OTHER-CF',
        normativeRefs: normativeRefsForRule('CO-AG2026-DED-OTHER-CF'),
      }),
    );
  }

  const subtotalBase = totalIncome - totalDeductions - explicitExemptions;
  const exempt25 = Math.min(Math.max(0, subtotalBase * 0.25), 790 * uvt);
  const maxAllowedDeductions = Math.min(totalIncome * 0.4, 1340 * uvt);

  let appliedExemptions = explicitExemptions + exempt25;
  let appliedDeductions = totalDeductions;

  stepChildren.push(
    createNode({
      kind: 'rule',
      label: '25% renta exenta laboral (automática)',
      description: 'Hasta 25% de la subbase o 790 UVT, lo menor (modelo motor).',
      value: -exempt25,
      ruleRef: 'CO-AG2026-EX-25PCT',
      normativeRefs: normativeRefsForRule('CO-AG2026-EX-25PCT'),
    }),
  );

  let capReductionNode: ReturnType<typeof createNode> | null = null;
  if (appliedExemptions + appliedDeductions > maxAllowedDeductions) {
    const beforeExempt = appliedExemptions;
    const beforeDed = appliedDeductions;
    const excess = appliedExemptions + appliedDeductions - maxAllowedDeductions;
    appliedExemptions -= excess;
    if (appliedExemptions < 0) {
      appliedDeductions += appliedExemptions;
      appliedExemptions = 0;
    }
    capReductionNode = createNode({
      kind: 'rule',
      label: 'Tope conjunto deducciones + exenciones',
      description: `Mínimo entre 40% del ingreso (${(totalIncome * 0.4).toFixed(0)}) y 1340 UVT (${1340 * uvt}). Se recortaron exenciones/deducciones aplicadas.`,
      value: -excess,
      ruleRef: 'CO-AG2026-CAP-40-1340',
      normativeRefs: normativeRefsForRule('CO-AG2026-CAP-40-1340'),
      meta: {
        maxAllowedDeductions,
        excessRemoved: excess,
        beforeSum: beforeExempt + beforeDed,
        afterSum: appliedExemptions + appliedDeductions,
      },
    });
  }

  const taxableBase = totalIncome - appliedDeductions - appliedExemptions;
  const taxDet = calculateColombiaIncomeTaxUVT2026Detailed(taxableBase, uvt);
  const taxLiability = taxDet.tax;
  const foreignCredit =
    foreignTaxes > 0 ? Math.min(foreignTaxes, taxLiability) : 0;
  const netPayable = Math.max(0, taxLiability - foreignCredit);

  const snapshot: OptimizedSnapshot = {
    appliedDeductions,
    appliedExemptions,
    taxableBase,
    taxLiability,
    foreignCredit,
    netPayable,
  };

  const inputs = [
    createNode({
      kind: 'input',
      label: 'Ingreso bruto anual (agregado)',
      value: totalIncome,
      meta: { key: 'annualGross' },
    }),
    createNode({
      kind: 'input',
      label: 'Impuestos pagados en el exterior (para crédito)',
      value: foreignTaxes,
      meta: { key: 'foreignTaxPaid' },
    }),
    createNode({
      kind: 'input',
      label: 'UVT referencia motor',
      value: uvt,
      ruleRef: 'CO-AG2026-UVT',
      normativeRefs: normativeRefsForRule('CO-AG2026-UVT'),
    }),
    createNode({
      kind: 'input',
      label: 'Beneficios activos en perfil',
      description: [
        profile.hasDependents && 'Dependientes',
        profile.hasPrepaidMedicine && 'Prepagada',
        profile.hasHousingInterest && 'Vivienda',
        profile.hasAFC && 'AFC',
        profile.hasVoluntaryPension && 'FPV',
      ]
        .filter(Boolean)
        .join(', ') || 'Ninguno marcado en este cálculo',
      meta: {
        hasDependents: profile.hasDependents,
        hasPrepaidMedicine: profile.hasPrepaidMedicine,
        hasHousingInterest: profile.hasHousingInterest,
        hasAFC: profile.hasAFC,
        hasVoluntaryPension: profile.hasVoluntaryPension,
      },
    }),
    ...(normalized &&
    (normalized.deductions.length > 0 ||
      normalized.liabilities.length > 0 ||
      normalized.investments.length > 0)
      ? [
          createNode({
            kind: 'input',
            label: 'Datos integrados (Cashflow / Deudas / Inversiones)',
            description: `${normalized.deductions.length} líneas deducción, ${normalized.liabilities.length} pasivos con interés, ${normalized.investments.length} posiciones etiquetadas.`,
            meta: {
              liabilityIds: normalized.liabilities.map((l) => l.id),
              warnings: normalized.warnings,
            },
          }),
        ]
      : []),
  ];

  const taxStep = createNode({
    kind: 'aggregation',
    label: 'Impuesto sobre base gravable (tarifa UVT)',
    description: `${taxDet.bracketLabel}. Base en UVT: ${taxDet.uvtBase.toFixed(2)}.`,
    value: taxLiability,
    ruleRef: 'CO-AG2026-TARIFF',
    normativeRefs: normativeRefsForRule('CO-AG2026-TARIFF'),
    children: [
      createNode({
        kind: 'result',
        label: 'Base gravable',
        value: taxableBase,
      }),
    ],
  });

  const creditStep =
    foreignCredit > 0
      ? createNode({
          kind: 'rule',
          label: 'Crédito por impuestos pagos en el exterior',
          description: 'No superior al impuesto calculado en Colombia (modelo motor).',
          value: -foreignCredit,
          ruleRef: 'CO-AG2026-FOREIGN-CREDIT',
          normativeRefs: normativeRefsForRule('CO-AG2026-FOREIGN-CREDIT'),
        })
      : null;

  const steps = [
    createNode({
      kind: 'aggregation',
      label: 'Construcción de base gravable',
      description:
        'Deducciones y rentas exentas según perfil y datos normalizados (gastos, deudas), luego tope 40%/1340 UVT.',
      children: [...stepChildren, ...(capReductionNode ? [capReductionNode] : [])],
    }),
    taxStep,
    ...(creditStep ? [creditStep] : []),
    createNode({
      kind: 'result',
      label: 'Impuesto neto a pagar (aprox.)',
      value: netPayable,
    }),
  ];

  const assumptions = [
    'Motor simplificado AG2026: no incluye todas las exenciones ni deducciones del Estatuto Tributario.',
    'Sin ajuste por inflación ni TRM; montos como ingreso anual único.',
    'AFC/FPV al 10% del ingreso c/u en simulación; límites legales reales pueden ser menores.',
    ...(normalized?.warnings ?? []),
  ];

  const explanation: FinancialExplanation = {
    ...emptyFinancialExplanation('tax.co.optimized_snapshot', 'Cálculo impuesto cédula general (modelo)'),
    summary: `Base gravable ${taxableBase.toFixed(0)} → impuesto ${taxLiability.toFixed(0)}; neto ${netPayable.toFixed(0)}.`,
    inputs,
    steps,
    assumptions,
    missingData: [],
    normativeRefs: CO_AG2026_BUNDLE_NORMATIVE_REFS,
    regulatoryContext: {
      jurisdiction: 'CO',
      taxYear: CO_AG2026_TAX_YEAR,
      engineVersion: CO_AG2026_ENGINE_VERSION,
      lawPackageId: CO_AG2026_LAW_PACKAGE_ID,
    },
    result: {
      label: 'Impuesto neto estimado',
      value: netPayable,
    },
  };

  return { snapshot, explanation };
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

/** Aplica varias palancas fiscales en simulación sobre un perfil “en blanco” de beneficios (combinaciones hipotéticas). */
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
    normalized?: NormalizedTaxFinancials,
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

    const snap = computeOptimizedTaxSnapshot(
      profile,
      totalIncome,
      foreignTaxes,
      UVT_2026,
      normalized,
    );
    let creditApplied = snap.foreignCredit;
    if (foreignTaxes > 0) {
      requirements.push(
        'Certificado de retención de impuestos (Withholding Tax Certificate) apostillado o legalizado del país de origen.',
      );
      explanationParts.push('y Descuento por Impuestos Pagados en el Exterior');
    }

    scenarios.push({
      name: 'Escenario con supuestos ampliados (modelo)',
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
    normalized?: NormalizedTaxFinancials,
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

    const fullSnap = computeOptimizedTaxSnapshot(
      actualProfile,
      totalIncome,
      foreignTaxes,
      UVT_2026,
      normalized,
    );
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
