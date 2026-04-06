export type GoalProjectionScenario = {
  key: string;
  label: string;
  annualReturnPct: number;
  monthlyContributionModel: number;
  monthsToTarget: number | null;
  estimatedReachDate: string | null;
  horizon5y: {
    months: number;
    futureValue: number;
    contributions: number;
    growth: number;
  };
  horizon15y: {
    months: number;
    futureValue: number;
    contributions: number;
    growth: number;
  };
  feasibilityLevel: string;
  narrative: string;
};

export type GoalProjectionResponse = {
  goalId: string;
  goalName: string;
  cashContext: {
    currentMonthlySavings: number;
    cashflowMonthlySavings?: number;
    utilityMonthly?: number;
    goalCurrency?: string;
    monthlyAmountNeeded: number;
    monthlyShortfall: number;
    monthsRemainingModel: number;
    horizonOpenEnded?: boolean;
    targetInPast?: boolean;
    cashflowMixedCurrency?: boolean;
    /** Parte del cashflow vino de otras monedas y se unificó con FX a la fecha del cálculo. */
    savingsFxConversionApplied?: boolean;
    shortfall: number;
    totalIncome: number;
    totalExpense: number;
    currentProjectedMonths: number | null;
    feasibilityLevel: string;
  };
  scenarios: GoalProjectionScenario[];
  strategy: {
    title: string;
    detail: string;
    recommendedScenarioKey: string;
    feasibility: string;
  };
  disclaimers: string[];
};
