import { TaxProfileInput, IncomeStreamInput, TaxClassificationResult, TaxScenarioOutput, TaxRuleEngine } from '../../../core/contracts';

const UVT_2026 = 48000; // Estimated 2026 UVT for Colombia

export class ColombiaTaxEngineAG2026 implements TaxRuleEngine {
  public readonly version = 'CO-AG2026-v1.0';

  classifyIncome(stream: IncomeStreamInput, profile: TaxProfileInput): TaxClassificationResult {
    let suggestedCedula = 'RENTA_NO_LABORAL';
    let confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    let explanation = '';
    const missingConditions: string[] = [];
    const isForeignSource = stream.sourceCountry !== 'CO';

    // Complex Classification Logic (The "Gray Area")
    if (isForeignSource) {
      if (stream.contractType === 'FOREIGN_CONTRACTOR' && !stream.hasSubordination) {
        suggestedCedula = 'HONORARIOS_SERVICIOS';
        confidenceLevel = 'HIGH';
        explanation = 'Los ingresos del exterior sin subordinación tributan típicamente bajo Honorarios/Servicios.';
        missingConditions.push('Verificar si existe certificado de residencia fiscal del país de origen para posibles convenios.');
      } else if (stream.contractType === 'LABOR' || stream.hasSubordination) {
        suggestedCedula = 'RENTA_DE_TRABAJO';
        confidenceLevel = 'MEDIUM';
        explanation = 'Ingreso de fuente extranjera con subordinación. Podría asimilarse a Renta de Trabajo, pero requiere validación si la empresa no retiene en Colombia.';
        missingConditions.push('Contrato que pruebe subordinación.', 'Soporte de pagos de seguridad social en Colombia si aplica.');
      } else {
        confidenceLevel = 'LOW';
        explanation = 'No hay suficiente información para clasificar el ingreso del exterior. Se asume Renta No Laboral por defecto.';
        missingConditions.push('Definir tipo de contrato y nivel de subordinación.');
      }
    } else {
      // Local Income
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

    // Residency Check
    if (!profile.isResident && profile.daysInCountry < 183) {
      explanation += ' ADVERTENCIA: Al no ser residente fiscal, solo declararías renta de fuente nacional.';
      if (isForeignSource) {
        suggestedCedula = 'NO_GRAVADO_NO_RESIDENTE';
        confidenceLevel = 'HIGH';
        missingConditions.push('Confirmar que no se superan 183 días de permanencia para mantener estatus de no residente.');
      }
    }

    return {
      referenceId: stream.id,
      suggestedCedula,
      confidenceLevel,
      isForeignSource,
      foreignTaxPaid: stream.foreignTaxPaid || 0,
      explanation,
      missingConditions
    };
  }

  generateScenarios(profile: TaxProfileInput, classifiedIncome: TaxClassificationResult[]): TaxScenarioOutput[] {
    const totalIncome = classifiedIncome.reduce((acc, c) => acc + (c as any)._originalAmount, 0);
    const foreignTaxes = classifiedIncome.reduce((acc, c) => acc + (c.foreignTaxPaid || 0), 0);
    
    // Complete Colombia Tax Brackets (Art 241 ET)
    const calculateTax = (base: number) => {
      const uvtBase = base / UVT_2026;
      if (uvtBase <= 1090) return 0;
      if (uvtBase <= 1700) return (uvtBase - 1090) * 0.19 * UVT_2026;
      if (uvtBase <= 4100) return ((uvtBase - 1700) * 0.28 + 116) * UVT_2026;
      if (uvtBase <= 8670) return ((uvtBase - 4100) * 0.33 + 788) * UVT_2026;
      if (uvtBase <= 18970) return ((uvtBase - 8670) * 0.35 + 2296) * UVT_2026;
      if (uvtBase <= 31000) return ((uvtBase - 18970) * 0.37 + 5901) * UVT_2026;
      return ((uvtBase - 31000) * 0.39 + 10352) * UVT_2026;
    };

    const scenarios: TaxScenarioOutput[] = [];

    // SCENARIO 1: Conservative (No deductions claimed)
    const consTax = calculateTax(totalIncome);
    scenarios.push({
      name: 'Escenario Conservador',
      type: 'CONSERVATIVE',
      estimatedGrossIncome: totalIncome,
      estimatedDeductions: 0,
      estimatedExemptions: 0,
      estimatedTaxableBase: totalIncome,
      estimatedTaxLiability: consTax,
      estimatedForeignCredit: 0,
      estimatedNetTaxPayable: consTax,
      explanation: 'Este escenario asume que no tomarás deducciones ni rentas exentas y pagas sobre el ingreso bruto. Es el cálculo más seguro pero más costoso.',
      riskLevel: 'LOW',
      requirements: ['Soportes de ingresos básicos.']
    });

    // SCENARIO 2: Optimized (Applying limit of 40% or max UVTs deductions/exemptions)
    let totalDeductions = 0;
    let explicitExemptions = 0;
    const requirements: string[] = [];
    const explanationParts: string[] = ['Estrategia eficiente: Aplicamos'];
    
    if (profile.hasDependents) {
      // 10% of gross income up to 32 UVT/month (384 UVT/year)
      const maxDependents = 384 * UVT_2026;
      totalDeductions += Math.min(totalIncome * 0.10, maxDependents);
      requirements.push('Registro civil o documento legal que demuestre la dependencia económica.');
      explanationParts.push('Deducción por Dependientes');
    }
    if (profile.hasPrepaidMedicine) {
      // Assuming a reasonable yearly expense, cap is 16 UVT/month (192 UVT/year)
      const maxMedicine = 192 * UVT_2026;
      totalDeductions += Math.min(totalIncome * 0.05, maxMedicine); // Estimate 5% of income or max
      requirements.push('Certificado de pagos a medicina prepagada del año gravable.');
      explanationParts.push('Medicina Prepagada');
    }
    if (profile.hasHousingInterest) {
      // Cap is 100 UVT/month (1200 UVT/year)
      const maxHousing = 1200 * UVT_2026;
      totalDeductions += Math.min(totalIncome * 0.15, maxHousing); // Estimate 15% of income or max
      requirements.push('Certificado bancario de intereses pagados por crédito hipotecario.');
      explanationParts.push('Intereses de Vivienda');
    }
    if (profile.hasAFC) {
      // AFC is capped together with FPV at 30% of income or 3800 UVT/year
      explicitExemptions += totalIncome * 0.10; 
      requirements.push('Certificado de la entidad financiera confirmando el saldo depositado en la cuenta AFC sin retiro o usado para vivienda.');
      explanationParts.push('Beneficio por Ahorro AFC');
    }
    if (profile.hasVoluntaryPension) {
      explicitExemptions += totalIncome * 0.10;
      requirements.push('Certificado del fondo de pensiones voluntarias (FPV) demostrando los aportes bajo la ley de renta exenta.');
      explanationParts.push('Aportes a Pensión Voluntaria');
    }

    // Apply 25% automatic exemption for Labor/Honorarios on the subtotal (capped at 40% overall limit later)
    // 25% Exemption has a hard cap of 790 UVT per year
    let subtotalBase = totalIncome - totalDeductions - explicitExemptions;
    const exempt25 = Math.min(Math.max(0, subtotalBase * 0.25), 790 * UVT_2026);
    explanationParts.push('el 25% de Renta Exenta Laboral Automática');

    // Total deductions + exemptions limit is 40% of net income OR 1340 UVT, whichever is lower
    const maxAllowedDeductions = Math.min(totalIncome * 0.40, 1340 * UVT_2026);
    
    let appliedExemptions = explicitExemptions + exempt25;
    let appliedDeductions = totalDeductions;
    
    if (appliedExemptions + appliedDeductions > maxAllowedDeductions) {
      // Cap hit - apply reduction proportionally or simply cut the total
      const excess = (appliedExemptions + appliedDeductions) - maxAllowedDeductions;
      // Reduce exemptions first, then deductions, or just cap total
      appliedExemptions -= excess; // Simplification
      if (appliedExemptions < 0) {
        appliedDeductions += appliedExemptions;
        appliedExemptions = 0;
      }
    }
    
    let optimizedBase = totalIncome - appliedDeductions - appliedExemptions;
    let optTax = calculateTax(optimizedBase);

    // Apply Foreign Tax Credit if applicable
    let creditApplied = 0;
    if (foreignTaxes > 0) {
      // You can't credit more than the Colombian tax on that same foreign income
      creditApplied = Math.min(foreignTaxes, optTax); 
      requirements.push('Certificado de retención de impuestos (Withholding Tax Certificate) apostillado o legalizado del país de origen.');
      explanationParts.push('y Descuento por Impuestos Pagados en el Exterior');
    }

    scenarios.push({
      name: 'Escenario Optimizado (Recomendado)',
      type: 'OPTIMIZED',
      estimatedGrossIncome: totalIncome,
      estimatedDeductions: appliedDeductions,
      estimatedExemptions: appliedExemptions,
      estimatedTaxableBase: optimizedBase,
      estimatedTaxLiability: optTax,
      estimatedForeignCredit: creditApplied,
      estimatedNetTaxPayable: Math.max(0, optTax - creditApplied),
      explanation: `${explanationParts.join(', ')}. Recuerda que los aportes AFC/Voluntarios están sujetos a límites de retención y permanencia.`,
      riskLevel: creditApplied > 0 ? 'MEDIUM' : 'LOW',
      requirements
    });

    return scenarios;
  }
}