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

/** Monto nominal tal como está registrado (moneda del ítem), sin aplicar la barra de valuación global. */
export function formatBookAmount(amount: number, currency: string): string {
  const c = (currency || 'USD').toUpperCase();
  if (c === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  if (c === 'COP') {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return `${amount.toLocaleString('es-CO', { maximumFractionDigits: 0 })} ${c}`;
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
