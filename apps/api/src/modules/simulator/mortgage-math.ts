/**
 * Cuota mensual sistema francés (amortización constante).
 * Extraído para pruebas unitarias del núcleo numérico del simulador de vivienda.
 */
export function monthlyMortgagePaymentFrench(
  principal: number,
  annualRatePercent: number,
  termMonths: number,
): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  const r = annualRatePercent / 100 / 12;
  if (r > 0) {
    return (
      (principal * (r * Math.pow(1 + r, termMonths))) /
      (Math.pow(1 + r, termMonths) - 1)
    );
  }
  return principal / termMonths;
}
