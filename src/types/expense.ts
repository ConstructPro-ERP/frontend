export interface Expense {
  id: string;
  projectId: string;
  amount: string | number;
  category?: string;
  description?: string;
  expenseDate: string;
  createdAt?: string;
  recordedById: string;
  recordedBy?: { fullName: string };
}
export interface ExpenseInput {
  amount: string;
  category: string;
  description: string;
  expenseDate: string;
}
export interface ExpenseSummary {
  total: string;
  byCategory: { category: string | null; amount: string }[];
}
