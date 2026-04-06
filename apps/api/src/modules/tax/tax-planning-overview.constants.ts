/**
 * Textos de encuadre: planeación y cumplimiento (sin orientar a evasión).
 */
export const TAX_PLANNING_FRAMING = {
  title: 'Planeación tributaria y cumplimiento',
  intro:
    'Este módulo organiza la información que registras para estimar cargas y beneficios bajo reglas del modelo normativo cargado en el motor. La obligación de declarar, sustentar y pagar corresponde al contribuyente.',
  bullets: [
    'Las proyecciones son orientativas: dependen de datos completos, clasificación correcta de los ingresos y soportes válidos.',
    'Un contador público o asesor fiscal puede validar tu caso concreto ante normas vigentes y circulares.',
    'Los escenarios “prudente” y “con beneficios del perfil” permiten comparar hipótesis legales, no optimizaciones opacas.',
  ],
} as const;

export type PlanningBenefitDef = {
  id: string;
  label: string;
  profileKey:
    | 'hasDependents'
    | 'hasVoluntaryPension'
    | 'hasAFC'
    | 'hasPrepaidMedicine'
    | 'hasHousingInterest';
  typicalSupports: string[];
  /** Condición si el usuario aún no marcó el beneficio en el perfil. */
  pendingHint: string;
};

/** Beneficios/deducciones frecuentes en el modelo CO (orientación; no lista exhaustiva). */
export const CO_PLANNING_BENEFITS: PlanningBenefitDef[] = [
  {
    id: 'dependents',
    label: 'Deducción por dependientes económicos',
    profileKey: 'hasDependents',
    typicalSupports: [
      'Documento que acredite dependencia económica conforme a reglas de la renta.',
    ],
    pendingHint:
      'Indica en el perfil si aplica y conserva el soporte de dependencia económica.',
  },
  {
    id: 'prepaid_medicine',
    label: 'Deducción por medicina prepagada / pólizas (según límites del año)',
    profileKey: 'hasPrepaidMedicine',
    typicalSupports: [
      'Certificado de pagos del año gravable emitido por la entidad de medicina prepagada o aseguradora.',
    ],
    pendingHint:
      'Marca el beneficio en el perfil si pagas medicina prepagada deducible y guarda el certificado anual.',
  },
  {
    id: 'housing_interest',
    label: 'Deducción por intereses de crédito hipotecario para vivienda (según topes)',
    profileKey: 'hasHousingInterest',
    typicalSupports: [
      'Certificado bancario de intereses pagados por crédito hipotecario para vivienda.',
    ],
    pendingHint:
      'Activa en el perfil si tienes intereses hipotecarios deducibles y respáldalos con certificación.',
  },
  {
    id: 'afc',
    label: 'Rentas exentas por ahorro AFC (límites y condiciones de permanencia)',
    profileKey: 'hasAFC',
    typicalSupports: [
      'Certificado de la entidad financiera sobre saldos y movimientos en cuenta AFC.',
    ],
    pendingHint:
      'Indica AFC en el perfil si aportas y reúne certificación de la entidad.',
  },
  {
    id: 'voluntary_pension',
    label: 'Rentas exentas por aportes a pensión voluntaria (FPV, topes)',
    profileKey: 'hasVoluntaryPension',
    typicalSupports: [
      'Certificado del fondo de pensiones voluntarias con aportes del año gravable.',
    ],
    pendingHint:
      'Marca pensión voluntaria en el perfil si aplica y solicita certificado al fondo.',
  },
];

export function mapClassificationComplianceRisk(confidenceLevel: string): {
  level: 'BAJO' | 'MEDIO' | 'ALTO';
  detail: string;
} {
  switch (confidenceLevel) {
    case 'HIGH':
      return {
        level: 'BAJO',
        detail:
          'La clasificación es coherente con los datos registrados; aun así conserva contratos y certificados de retención.',
      };
    case 'MEDIUM':
      return {
        level: 'MEDIO',
        detail:
          'Convienen soportes adicionales (contrato, comprobantes de relación laboral o de prestación de servicios).',
      };
    default:
      return {
        level: 'ALTO',
        detail:
          'Revisa residencia fiscal, subordinación, fuente del pago y moneda; la DIAN puede reclasificar si no hay soportes.',
      };
  }
}

export function buildSupportChecklistSections(opts: {
  optimizedRequirements: string[];
  classificationMissing: string[];
  normalizedWarnings: string[];
}): { category: string; items: string[] }[] {
  const sections: { category: string; items: string[] }[] = [];
  const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))];

  if (opts.optimizedRequirements.length) {
    sections.push({
      category: 'Soportes típicos del escenario con beneficios del perfil',
      items: uniq(opts.optimizedRequirements),
    });
  }
  if (opts.classificationMissing.length) {
    sections.push({
      category: 'Condiciones pendientes para sostener la clasificación de ingresos',
      items: uniq(opts.classificationMissing),
    });
  }
  if (opts.normalizedWarnings.length) {
    sections.push({
      category: 'Integración de gastos, deudas e inversiones (advertencias del modelo)',
      items: uniq(opts.normalizedWarnings),
    });
  }
  return sections;
}
