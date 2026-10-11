export interface Expense {
  id: string;
  projectId: string;
  amount: string | number;
  category?: string;
  description?: string;
  date?: string;
  createdAt?: string;
  recordedById: string;
  recordedBy?: { fullName: string };
}
export interface ExpenseInput {
  amount: string;
  category: string;
  description: string;
  date: string;
}
export interface ExpenseSummary {
  totalAmount: string | number;
  categories: { category: string; totalAmount: string | number }[];
}
