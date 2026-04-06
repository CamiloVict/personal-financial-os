import { PatrimonyLeg, type InvestmentTypeDefinition } from '@prisma/client';

/** Incluida en métricas de portafolio financiero (valor, retorno, series). */
export function typeCountsInFinancialPortfolio(
  type: Pick<InvestmentTypeDefinition, 'countsInFinancialPortfolio'> | null | undefined,
): boolean {
  return type?.countsInFinancialPortfolio !== false;
}

/** Activo de inversión en portafolio financiero (excluye pasivos y categorías “solo uso”). */
export function positionCountsForFinancialPortfolio(
  pos: {
    patrimonyLeg?: PatrimonyLeg | null;
    type?: Pick<InvestmentTypeDefinition, 'countsInFinancialPortfolio'> | null;
  },
): boolean {
  if (pos.patrimonyLeg === PatrimonyLeg.LIABILITY) return false;
  return typeCountsInFinancialPortfolio(pos.type);
}

export function positionPatrimonySignedValue(pos: {
  patrimonyLeg?: PatrimonyLeg | null;
  currentEstimatedValue?: unknown;
}): number {
  const v = Number(pos.currentEstimatedValue ?? 0);
  return pos.patrimonyLeg === PatrimonyLeg.LIABILITY ? -v : v;
}
