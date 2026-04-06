/**
 * Cuota fija tipo crédito amortizable: primero se cubre el interés del período sobre el saldo,
 * el resto reduce capital. Tasa = nominal anual en %, prorrateada en 12 meses (práctica habitual
 * con cuota fija y saldo decreciente).
 */
export type MonthlyDebtSplit = {
  interestPortion: number;
  principalPortion: number;
  newRemaining: number;
};

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function splitMonthlyInstallment(
  remainingPrincipal: number,
  monthlyPayment: number,
  annualNominalRatePercent: number,
): MonthlyDebtSplit {
  const rem = Math.max(0, remainingPrincipal);
  const pay = Math.max(0, monthlyPayment);
  if (rem <= 0 || pay <= 0) {
    return { interestPortion: 0, principalPortion: 0, newRemaining: rem };
  }

  const monthlyRate =
    annualNominalRatePercent > 0 ? annualNominalRatePercent / 100 / 12 : 0;
  const interestDue = roundMoney(rem * monthlyRate);
  const interestPaid = Math.min(pay, interestDue);
  let principalPaid = roundMoney(pay - interestPaid);
  if (principalPaid > rem) principalPaid = rem;
  const newRemaining = roundMoney(rem - principalPaid);
  return {
    interestPortion: interestPaid,
    principalPortion: principalPaid,
    newRemaining: Math.max(0, newRemaining),
  };
}
