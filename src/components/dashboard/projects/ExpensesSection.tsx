"use client";
import { useCallback, useState } from "react";
import {
  listExpenses,
  getExpenseSummary,
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/services/expensesApi";
import type { Expense, ExpenseInput } from "@/types/expense";
import type { ResourceQuery } from "@/services/projectResources";
import {
  validateExpense,
  validateDateFilters,
} from "@/lib/projectResourceRules";
import ResourceSection from "./ResourceSection";
import { Notice, date, money, panelClass } from "./ProjectUI";
import { useProjectData } from "./useProjectData";
export default function ExpensesSection({
  projectId,
  budget,
  canWrite,
  canDelete,
}: {
  projectId: string;
  budget: number | null;
  canWrite: boolean;
  canDelete: boolean;
}) {
  const [revision, setRevision] = useState(0);
  const load = useCallback(
    (query: ResourceQuery) => listExpenses(projectId, query),
    [projectId],
  );
  const loadSummary = useCallback(
    () => getExpenseSummary(projectId),
    [projectId],
  );
  const summary = useProjectData(loadSummary, revision);
  const input = (v: Record<string, string>): ExpenseInput => ({
    amount: v.amount.trim(),
    category: v.category?.trim() || null,
    description: v.description?.trim() || null,
    expenseDate: `${v.date}T00:00:00.000Z`,
  });
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Project budget", money(budget)],
          [
            "Total expenses",
            summary.loading
              ? "Loading…"
              : summary.data
                ? money(summary.data.total)
                : "Not available",
          ],
          [
            "Remaining budget",
            summary.loading
              ? "Loading…"
              : summary.data && budget != null
                ? money(
                    (Math.round(budget * 100) -
                      Math.round(Number(summary.data.total) * 100)) /
                      100,
                  )
                : "Not available",
          ],
        ].map(([heading, value]) => (
          <div key={heading} className={panelClass + " p-4"}>
            <p className="text-xs text-on-surface-muted">{heading}</p>
            <p className="mt-2 text-lg font-bold">{value}</p>
          </div>
        ))}
      </div>
      {summary.error && (
        <Notice error>
          Expense summary could not be loaded. {summary.error}
        </Notice>
      )}
      {!!summary.data?.byCategory?.length && (
        <div className="flex flex-wrap gap-3">
          {summary.data.byCategory.map((category) => (
            <span
              key={category.category ?? "uncategorized"}
              className="rounded-lg bg-surface-container px-3 py-2 text-xs"
            >
              {category.category ?? "Uncategorized"}:{" "}
              <strong>{money(category.amount)}</strong>
            </span>
          ))}
        </div>
      )}
      <ResourceSection<Expense>
        title="Expenses"
        singular="expense"
        description={
          canWrite
            ? "Record and monitor project costs in LKR."
            : "View project costs and category totals. Expense editing requires an administrator or accountant."
        }
        canWrite={canWrite}
        canDelete={canDelete}
        load={load}
        onChanged={() => setRevision((v) => v + 1)}
        onRefresh={() => setRevision((v) => v + 1)}
        validateFilters={validateDateFilters}
        fields={[
          {
            name: "amount",
            label: "Amount (LKR)",
            required: true,
            hint: "Positive amount with up to two decimal places.",
          },
          {
            name: "category",
            label: "Category",
            maxLength: 100,
          },
          { name: "date", label: "Expense date", type: "date", required: true },
          {
            name: "description",
            label: "Description",
            type: "textarea",
            maxLength: 1000,
          },
        ]}
        initial={(item) => ({
          amount: item?.amount.toString() ?? "",
          category: item?.category ?? "",
          date: item?.expenseDate?.slice(0, 10) ?? "",
          description: item?.description ?? "",
        })}
        validate={validateExpense}
        create={(v) => createExpense(projectId, input(v))}
        update={(item, v) => updateExpense(item.id, input(v))}
        remove={deleteExpense}
        filters={[
          { name: "category", label: "Category" },
          { name: "fromDate", label: "From date", type: "date" },
          { name: "toDate", label: "To date", type: "date" },
        ]}
        columns={[
          {
            label: "Description",
            render: (item) => item.description || "No description",
          },
          {
            label: "Category",
            render: (item) => item.category ?? "Uncategorized",
          },
          {
            label: "Amount",
            render: (item) => (
              <strong className="whitespace-nowrap">
                {money(item.amount)}
              </strong>
            ),
          },
          {
            label: "Date",
            render: (item) => date(item.expenseDate),
          },
          {
            label: "Recorded by",
            render: (item) => item.recordedBy?.fullName ?? "Not available",
          },
        ]}
      />
    </div>
  );
}
