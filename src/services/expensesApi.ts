import apiClient from "@/lib/axios";
import type { Expense, ExpenseInput, ExpenseSummary } from "@/types/expense";
import { listResource, type ResourceQuery } from "./projectResources";
export const listExpenses = (projectId: string, query?: ResourceQuery) =>
  listResource<Expense>(
    `/projects/${encodeURIComponent(projectId)}/expenses`,
    query,
  );
export const getExpenseSummary = async (projectId: string) =>
  (
    await apiClient.get<ExpenseSummary>(
      `/projects/${encodeURIComponent(projectId)}/expenses/summary`,
    )
  ).data;
export const createExpense = async (projectId: string, input: ExpenseInput) =>
  (
    await apiClient.post<Expense>(
      `/projects/${encodeURIComponent(projectId)}/expenses`,
      input,
    )
  ).data;
export const updateExpense = async (id: string, input: ExpenseInput) =>
  (await apiClient.patch<Expense>(`/expenses/${encodeURIComponent(id)}`, input))
    .data;
export const deleteExpense = async (id: string) => {
  await apiClient.del(`/expenses/${encodeURIComponent(id)}`);
};
