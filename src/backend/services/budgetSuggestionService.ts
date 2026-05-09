// Budget suggestion service using 50/30/20 rule
export interface BudgetSuggestion {
  totalIncome: number;
  needs: { category: string; amount: number; percentage: number }[];
  wants: { category: string; amount: number; percentage: number }[];
  savings: { category: string; amount: number; percentage: number }[];
}

export function generateBudgetSuggestion(monthlyIncome: number): BudgetSuggestion {
  const needs = monthlyIncome * 0.5;
  const wants = monthlyIncome * 0.3;
  const savings = monthlyIncome * 0.2;

  return {
    totalIncome: monthlyIncome,
    needs: [
      { category: "Makanan", amount: needs * 0.4, percentage: 20 },
      { category: "Transport", amount: needs * 0.3, percentage: 15 },
      { category: "Tagihan", amount: needs * 0.2, percentage: 10 },
      { category: "Kesehatan", amount: needs * 0.1, percentage: 5 },
    ],
    wants: [
      { category: "Belanja", amount: wants * 0.5, percentage: 15 },
      { category: "Hiburan", amount: wants * 0.33, percentage: 10 },
      { category: "Langganan", amount: wants * 0.17, percentage: 5 },
    ],
    savings: [
      { category: "Tabungan", amount: savings, percentage: 20 },
    ],
  };
}
