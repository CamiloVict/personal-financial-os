/** Categoría incluida en valor/retorno de portafolio financiero (no bienes de uso solo patrimoniales). */
export function isFinancialPortfolioPosition(pos: {
  patrimonyLeg?: string | null;
  type?: { countsInFinancialPortfolio?: boolean } | null;
}): boolean {
  if (pos.patrimonyLeg === 'LIABILITY') return false;
  return pos.type?.countsInFinancialPortfolio !== false;
}

/** Contribución firmada al patrimonio libro (pasivos en posiciones restan). */
export function positionPatrimonySignedBookValue(pos: {
  patrimonyLeg?: string | null;
  currentEstimatedValue?: number | string | null;
}): number {
  const v = Number(pos.currentEstimatedValue ?? 0);
  return pos.patrimonyLeg === 'LIABILITY' ? -v : v;
}
