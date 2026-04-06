/**
 * Capa de confianza para outputs financieros (completitud de datos, supuestos, estimaciones).
 * Serializable a JSON.
 */
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface FinancialConfidence {
  /** 0–1, dos decimales recomendados */
  confidenceScore: number;
  level: ConfidenceLevel;
  /** Por qué baja o sube la confianza (copys para UI / tooltips) */
  reasons: string[];
  /** Ámbito evaluado (trazabilidad, analytics) */
  scope?: 'tax' | 'debts' | 'investments' | 'cashflow' | 'simulation' | 'allocator' | 'composite';
}

export function levelFromScore(score: number): ConfidenceLevel {
  const s = Math.max(0, Math.min(1, score));
  if (s >= 0.78) return 'HIGH';
  if (s >= 0.52) return 'MEDIUM';
  return 'LOW';
}

export function buildFinancialConfidence(
  score: number,
  reasons: string[],
  scope?: FinancialConfidence['scope'],
): FinancialConfidence {
  const confidenceScore = Math.round(Math.max(0, Math.min(1, score)) * 100) / 100;
  return {
    confidenceScore,
    level: levelFromScore(confidenceScore),
    reasons,
    scope,
  };
}
