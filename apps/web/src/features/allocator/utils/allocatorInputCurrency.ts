import type { DisplayValuationMode } from '@/shared/store/global';

/** Moneda en la que el usuario ingresa capital en el asignador según el modo de vista global. */
export function allocatorInputCurrency(
  displayValuationMode: DisplayValuationMode,
): 'USD' | 'COP' {
  return displayValuationMode === 'NOMINAL_USD' ? 'USD' : 'COP';
}

export function allocatorInputHelpText(
  displayValuationMode: DisplayValuationMode,
  valuationAsOfDate: string,
): string {
  if (displayValuationMode === 'NOMINAL_USD') {
    return `Monto en dólares (USD). El motor del asignador trabaja en USD libro; no se aplica conversión de entrada. Fecha de valuación global: ${valuationAsOfDate}.`;
  }
  if (displayValuationMode === 'REAL_COP') {
    return `Monto en pesos colombianos nominales (COP) al tipo de cambio de la fecha de valuación (${valuationAsOfDate}). Se convierte a USD libro para el motor; los resultados de esta página siguen el modo “COP reales” de tu barra global.`;
  }
  return `Monto en pesos colombianos (COP) al tipo de cambio de la fecha de valuación (${valuationAsOfDate}). Se convierte a USD libro para el motor; las tarjetas se muestran en COP nominal con el mismo criterio.`;
}
