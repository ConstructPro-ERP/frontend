"use client";

import { useCallback, useState } from "react";
import { useDashboardQuery } from "@/hooks/useDashboardQuery";
import Link from "next/link";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { listQuotations } from "@/services/quotationsApi";
import {
  canCreateQuotation,
  formatCurrency,
  getQuotationStatusLabel,
} from "../quotations/quotationUtils";

export default function LeadQuotations({ leadId }: { leadId: string }) {
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const canView = [
    "ADMIN",
    "SALES_MANAGER",
    "PROJECT_MANAGER",
    "ACCOUNTANT",
  ].includes(role ?? "");
  const [page, setPage] = useState(1);
  const loader = useCallback(
    () => listQuotations({ leadId, page, limit: 5 }),
    [leadId, page],
  );
  const query = useDashboardQuery(
    JSON.stringify(["lead-quotations", leadId, page]),
    loader,
    canView,
  );
  const items = query.data?.items ?? [];
  const totalPages = query.data?.totalPages ?? 1;
  const loading = query.loading;
  const error =
    query.error instanceof Error
      ? query.error.message
      : query.error
        ? "Unable to load quotations."
        : "";
  if (!canView) return null;
  const reload = (nextPage: number) => {
    if (nextPage === page) void query.refresh();
    else setPage(nextPage);
  };
  return (
    <section className="space-y-3 p-5" aria-label="Lead quotations">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold">Quotations</h3>
        {canCreateQuotation(role) ? (
          <Link
            className="text-xs font-semibold text-primary"
            href={`/dashboard/quotations?leadId=${encodeURIComponent(leadId)}#create-quotation-panel`}
          >
            Create quotation
          </Link>
        ) : null}
      </div>
      {error && query.data ? (
        <p role="status" className="text-xs text-error">
          {error}{" "}
          <button type="button" onClick={() => reload(page)}>
            Retry refresh
          </button>
        </p>
      ) : null}
      {loading ? (
        <p role="status" className="text-xs">
          Loading quotations...
        </p>
      ) : error && !query.data ? (
        <p role="alert" className="text-xs text-error">
          {error}{" "}
          <button type="button" onClick={() => reload(page)}>
            Retry
          </button>
        </p>
      ) : (
        <>
          {!items.length ? (
            <p className="text-xs text-on-surface-muted">
              No quotations for this lead.
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((quotation) => (
                <li key={quotation.id} className="text-xs">
                  <Link
                    className="font-semibold text-primary underline"
                    href={`/dashboard/quotations?quotationId=${encodeURIComponent(quotation.id)}`}
                  >
                    {quotation.id}
                  </Link>
                  <p>
                    {getQuotationStatusLabel(quotation.status)} |{" "}
                    {formatCurrency(quotation.totalAmount)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {totalPages > 1 ? (
            <nav
              aria-label="Lead quotations pagination"
              className="flex justify-between text-xs"
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => reload(page - 1)}
              >
                Previous
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => reload(page + 1)}
              >
                Next
              </button>
            </nav>
          ) : null}
        </>
      )}
    </section>
  );
}
