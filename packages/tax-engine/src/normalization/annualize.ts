export function annualizePeriodicAmount(
  amountPerPeriod: number,
  frequency: string,
  customFrequencyMonths?: number | null,
): number {
  const m = Math.abs(amountPerPeriod);
  switch (frequency) {
    case 'WEEKLY':
      return m * 52;
    case 'BIWEEKLY':
      return m * 26;
    case 'MONTHLY':
      return m * 12;
    case 'BIMONTHLY':
      return m * 6;
    case 'QUARTERLY':
      return m * 4;
    case 'FOUR_MONTHLY':
      return m * 3;
    case 'SEMIANNUALLY':
      return m * 2;
    case 'ANNUALLY':
      return m;
    case 'CUSTOM': {
      const months =
        customFrequencyMonths && customFrequencyMonths > 0
          ? customFrequencyMonths
          : 12;
      return m * (12 / months);
    }
    default:
      return m * 12;
  }
}
