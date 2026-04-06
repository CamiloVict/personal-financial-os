export function formatPresentedAmount(amount: number, currency: string): string {
  const c = currency.toUpperCase();
  if (c === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function valuationModeFootnote(mode: string): string {
  if (mode === 'NOMINAL_COP') {
    return 'Todos los montos convertidos a COP con el mismo tipo de cambio (fecha “Valuación”), comparables entre sí en nominal.';
  }
  if (mode === 'NOMINAL_USD') {
    return 'Todos los montos convertidos a USD con el mismo tipo de cambio (fecha “Valuación”), comparables entre sí en nominal.';
  }
  return 'COP constantes: FX a la fecha económica de cada ítem y deflactor IPC Colombia (serie demo) respecto al mes base.';
}
