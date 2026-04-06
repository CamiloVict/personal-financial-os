/** Respuesta de GET /analytics/cashflow-intelligence */
export type CashflowIntelligenceResponse = {
  model: {
    incomeFixed: number;
    incomeVariable: number;
    expenseFixed: number;
    expenseVariable: number;
    incomeTotal: number;
    expenseTotal: number;
    savingsRate: number | null;
    fixedExpenseShareOfIncome: number | null;
    freeCashAfterFixedExpenses: number;
    mainIncomeStream: {
      name: string;
      amount: number;
      shareOfIncome: number;
    } | null;
  };
  expenseByCategory: {
    name: string;
    value: number;
    shareOfExpense: number;
  }[];
  monthly: {
    series: {
      month: string;
      income: number;
      expense: number;
      net: number;
    }[];
    eventCount: number;
  };
  rolling: {
    avgNet3: number;
    avgNet6: number;
    avgNet12: number;
    lastMonthNet: number;
    lastMonthLabel: string;
    vsRolling3Pct: number | null;
  };
  insights: string[];
};
