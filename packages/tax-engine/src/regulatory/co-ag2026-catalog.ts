import type { NormativeRef, RegulatoryTaxRuleDefinition } from '@personal-finance-os/explanation';

/** Paquete normativo enlazado al motor educativo CO-AG2026 (revisión documental interna). */
export const CO_AG2026_LAW_PACKAGE_ID = 'co-tax-edu-2026.1';

const ENGINE_VERSION = 'CO-AG2026-v1.0';
const MODULE_PATH = 'packages/tax-engine/src/jurisdictions/co/ag2026/index.ts';
const JURISDICTION = 'CO';

/** Año gravable de referencia del paquete (alinear UI y auditoría). */
export const CO_AG2026_TAX_YEAR = 2026;

function impl(symbol: string): RegulatoryTaxRuleDefinition['implementation'] {
  return {
    engineVersion: ENGINE_VERSION,
    modulePath: MODULE_PATH,
    symbol,
  };
}

/**
 * Catálogo: cada `ruleRef` del motor enlaza ley publicada + interpretación del producto + ancla de código.
 * Las citas son orientativas para trazabilidad; el motor sigue siendo educativo y no sustituye asesoría.
 */
export const CO_AG2026_REGULATORY_RULES: RegulatoryTaxRuleDefinition[] = [
  {
    ruleRef: 'CO-AG2026-DED-DEP',
    jurisdiction: JURISDICTION,
    taxYear: CO_AG2026_TAX_YEAR,
    lawPackageId: CO_AG2026_LAW_PACKAGE_ID,
    law: {
      instrument: 'Estatuto Tributario (Colombia)',
      citation: 'ET — Deducción por dependientes',
      article: 'Art. 338 y correlatos (tope y requisitos de dependientes económicos)',
    },
    interpretation: {
      summary:
        'El motor aplica 10% del ingreso bruto anual estimado con tope 384 UVT como aproximación; no valida calidad de dependiente ni límites adicionales del año gravable.',
      limitations: ['Sin validación documental', 'UVT fija de referencia del paquete'],
    },
    implementation: impl('computeOptimizedTaxSnapshotWithExplanation:dependientes'),
  },
  {
    ruleRef: 'CO-AG2026-DED-PREP',
    jurisdiction: JURISDICTION,
    taxYear: CO_AG2026_TAX_YEAR,
    lawPackageId: CO_AG2026_LAW_PACKAGE_ID,
    law: {
      instrument: 'Estatuto Tributario (Colombia)',
      citation: 'ET — Gastos de salud / medicina prepagada',
      article: 'Art. 336 numeral 3 (deducciones por salud, con topes)',
    },
    interpretation: {
      summary:
        'Deducción modelada al menor entre 5% del ingreso y 192 UVT; puede combinar perfil y gastos normalizados desde Cashflow.',
    },
    implementation: impl('computeOptimizedTaxSnapshotWithExplanation:prepagada'),
  },
  {
    ruleRef: 'CO-AG2026-DED-VIV',
    jurisdiction: JURISDICTION,
    taxYear: CO_AG2026_TAX_YEAR,
    lawPackageId: CO_AG2026_LAW_PACKAGE_ID,
    law: {
      instrument: 'Estatuto Tributario (Colombia)',
      citation: 'ET — Intereses o corrección monetaria en créditos de vivienda',
      article: 'Art. 336 numeral 1 (intereses de vivienda, topes)',
    },
    interpretation: {
      summary:
        'Tope 15% del ingreso y 1200 UVT; integra intereses inferidos de deudas hipotecarias y categorías normalizadas.',
    },
    implementation: impl('computeOptimizedTaxSnapshotWithExplanation:vivienda'),
  },
  {
    ruleRef: 'CO-AG2026-EX-AFC',
    jurisdiction: JURISDICTION,
    taxYear: CO_AG2026_TAX_YEAR,
    lawPackageId: CO_AG2026_LAW_PACKAGE_ID,
    law: {
      instrument: 'Estatuto Tributario (Colombia)',
      citation: 'ET — Rentas exentas: ahorro AFC',
      article: 'Art. 126-1 E.T. y concordantes (requisitos y topes de permanencia)',
    },
    interpretation: {
      summary:
        'Renta exenta simplificada al 10% del ingreso con datos de perfil o Cashflow; omite topes adicionales y retiros.',
      limitations: ['Topes legales adicionales no modelados en esta versión'],
    },
    implementation: impl('computeOptimizedTaxSnapshotWithExplanation:AFC'),
  },
  {
    ruleRef: 'CO-AG2026-EX-FPV',
    jurisdiction: JURISDICTION,
    taxYear: CO_AG2026_TAX_YEAR,
    lawPackageId: CO_AG2026_LAW_PACKAGE_ID,
    law: {
      instrument: 'Estatuto Tributario (Colombia)',
      citation: 'ET — Rentas exentas: pensión voluntaria',
      article: 'Art. 126-1 E.T. y reglamentación de fondos voluntarios',
    },
    interpretation: {
      summary:
        'Misma lógica simplificada 10% que AFC; integración opcional con aportes etiquetados en Cashflow.',
      limitations: ['Topes de ley no expresados en su totalidad'],
    },
    implementation: impl('computeOptimizedTaxSnapshotWithExplanation:FPV'),
  },
  {
    ruleRef: 'CO-AG2026-DED-OTHER-CF',
    jurisdiction: JURISDICTION,
    taxYear: CO_AG2026_TAX_YEAR,
    lawPackageId: CO_AG2026_LAW_PACKAGE_ID,
    law: {
      instrument: 'Estatuto Tributario (Colombia)',
      citation: 'ET — Deducciones por pagos que generan renta',
      article: 'Art. 336 y 337 (gastos deducibles, relación con actividad)',
    },
    interpretation: {
      summary:
        'Suma líneas normalizadas con hint OTHER_DEDUCTIBLE; el usuario debe validar contra norma y límites globales.',
    },
    implementation: impl('computeOptimizedTaxSnapshotWithExplanation:other_cf'),
  },
  {
    ruleRef: 'CO-AG2026-EX-25PCT',
    jurisdiction: JURISDICTION,
    taxYear: CO_AG2026_TAX_YEAR,
    lawPackageId: CO_AG2026_LAW_PACKAGE_ID,
    law: {
      instrument: 'Estatuto Tributario (Colombia)',
      citation: 'ET — Renta exenta laboral (porcentaje)',
      article: 'Art. 336 numeral 10 (25% con tope en UVT)',
    },
    interpretation: {
      summary:
        'Tras deducciones y exenciones explícitas, aplica el menor entre 25% de la subbase y 790 UVT.',
    },
    implementation: impl('computeOptimizedTaxSnapshotWithExplanation:exenta25'),
  },
  {
    ruleRef: 'CO-AG2026-CAP-40-1340',
    jurisdiction: JURISDICTION,
    taxYear: CO_AG2026_TAX_YEAR,
    lawPackageId: CO_AG2026_LAW_PACKAGE_ID,
    law: {
      instrument: 'Estatuto Tributario (Colombia)',
      citation: 'ET — Limitación conjunta deducciones y rentas exentas',
      article: 'Art. 336 numeral 5 (40% ingreso / 1340 UVT, según texto vigente)',
    },
    interpretation: {
      summary:
        'Si la suma de deducciones y exenciones excede el tope, el motor reduce primero exenciones hasta encajar (modelo simplificado).',
    },
    implementation: impl('computeOptimizedTaxSnapshotWithExplanation:cap40'),
  },
  {
    ruleRef: 'CO-AG2026-UVT',
    jurisdiction: JURISDICTION,
    taxYear: CO_AG2026_TAX_YEAR,
    lawPackageId: CO_AG2026_LAW_PACKAGE_ID,
    law: {
      instrument: 'Resolución DIAN / normas de valor tributario',
      citation: 'Unidad de Valor Tributario (UVT)',
      article: 'Valor UVT año gravable correspondiente (referencia oficial)',
    },
    interpretation: {
      summary:
        'El paquete fija UVT de referencia para el modelo educativo; debe actualizarse al publicarse el valor oficial anual.',
    },
    implementation: impl('UVT_2026 constant + inputs explanation node'),
  },
  {
    ruleRef: 'CO-AG2026-TARIFF',
    jurisdiction: JURISDICTION,
    taxYear: CO_AG2026_TAX_YEAR,
    lawPackageId: CO_AG2026_LAW_PACKAGE_ID,
    law: {
      instrument: 'Estatuto Tributario (Colombia)',
      citation: 'ET — Tarifa incremental personas naturales cédula general',
      article: 'Art. 336 (tramos UVT para residentes)',
    },
    interpretation: {
      summary:
        'Tabla progresiva en UVT según anexo del modelo CO-AG2026; constantes y tramos alineados a estructura educativa del motor.',
    },
    implementation: impl('calculateColombiaIncomeTaxUVT2026Detailed'),
  },
  {
    ruleRef: 'CO-AG2026-FOREIGN-CREDIT',
    jurisdiction: JURISDICTION,
    taxYear: CO_AG2026_TAX_YEAR,
    lawPackageId: CO_AG2026_LAW_PACKAGE_ID,
    law: {
      instrument: 'Estatuto Tributario (Colombia)',
      citation: 'ET — Impuesto pagado en el exterior y convenios',
      article: 'Art. 254 y 255 (crédito tributario, límites)',
    },
    interpretation: {
      summary:
        'Crédito hasta el menor entre impuesto pagado en el exterior e impuesto calculado en Colombia sobre la misma base modelada.',
    },
    implementation: impl('computeOptimizedTaxSnapshotWithExplanation:foreignCredit'),
  },
];

const RULE_MAP: Map<string, RegulatoryTaxRuleDefinition> = new Map(
  CO_AG2026_REGULATORY_RULES.map((r) => [r.ruleRef, r]),
);

/** Definición completa para auditoría o documentación generada. */
export function getRegulatoryRuleDefinition(ruleRef: string): RegulatoryTaxRuleDefinition | undefined {
  return RULE_MAP.get(ruleRef);
}

/** Snapshot versionado del paquete normativo (archivo en `regulatory/snapshots/` en release). */
export function getCoAg2026RegulatoryBundleSnapshot(): {
  lawPackageId: string;
  taxYear: number;
  jurisdiction: string;
  engineVersion: string;
  exportedAt: string;
  rules: RegulatoryTaxRuleDefinition[];
} {
  return {
    lawPackageId: CO_AG2026_LAW_PACKAGE_ID,
    taxYear: CO_AG2026_TAX_YEAR,
    jurisdiction: JURISDICTION,
    engineVersion: ENGINE_VERSION,
    exportedAt: new Date().toISOString(),
    rules: CO_AG2026_REGULATORY_RULES,
  };
}

/**
 * `NormativeRef` para adjuntar a nodos del grafo (fuente legal + interpretación en el mismo objeto serializable).
 */
export function normativeRefsForRule(ruleRef: string): NormativeRef[] {
  const def = RULE_MAP.get(ruleRef);
  if (!def) return [];
  return [
    {
      id: `${ruleRef}-norma`,
      title: def.law.citation,
      article: def.law.article,
      legalInstrument: def.law.instrument,
      productInterpretation: def.interpretation.summary,
      url: def.law.url,
    },
  ];
}

/** Referencias de alto nivel del paquete (disclaimer + marco). */
export const CO_AG2026_BUNDLE_NORMATIVE_REFS: NormativeRef[] = [
  {
    id: 'CO-AG2026-BUNDLE',
    title: 'Paquete normativo motor educativo Colombia (AG2026)',
    article:
      'Conjunto de artículos ET citados en el catálogo `CO_AG2026_REGULATORY_RULES`; revisar `lawPackageId` para trazabilidad de versión.',
    legalInstrument: 'Estatuto Tributario y normas complementarias (referencia)',
    productInterpretation:
      'Implementación simplificada para educación financiera: cada paso enlaza `ruleRef` → catálogo (ley, interpretación, código).',
  },
];

export { ENGINE_VERSION as CO_AG2026_ENGINE_VERSION };
