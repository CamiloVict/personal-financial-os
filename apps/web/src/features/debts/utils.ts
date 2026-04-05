export function leverageHealthBadgeClass(status: string) {
  switch (status) {
    case 'EXCELLENT':
      return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'GOOD':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'WARNING':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'CRITICAL':
      return 'text-rose-600 bg-rose-50 border-rose-200';
    default:
      return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

export function leverageHealthLabel(status: string) {
  switch (status) {
    case 'EXCELLENT':
      return 'Excelente';
    case 'GOOD':
      return 'Saludable';
    case 'WARNING':
      return 'Precaución';
    case 'CRITICAL':
      return 'Crítico';
    default:
      return 'Desconocido';
  }
}
