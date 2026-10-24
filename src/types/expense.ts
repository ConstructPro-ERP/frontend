export interface Expense {
  id: string;
  projectId: string;
  amount: string;
  category?: string | null;
  description?: string | null;
  expenseDate: string;
  createdAt?: string;
  recordedById: string;
  recordedBy?: {
    id: string;
    fullName: string;
  };
}

export interface ExpenseInput {
  amount: string;
  category?: string | null;
  description?: string | null;
  expenseDate: string;
}

export interface ExpenseSummary {
  total: string;
  byCategory: {
    category: string | null;
    amount: string;
  }[];
}
