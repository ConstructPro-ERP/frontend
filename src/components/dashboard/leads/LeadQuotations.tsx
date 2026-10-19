"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import type { Quotation } from "@/types/quotation";
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
  const [items, setItems] = useState<Quotation[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    if (!canView) return;
    listQuotations({ leadId, page, limit: 5 })
      .then((result) => {
        if (active) {
          setItems(result.items);
          setTotalPages(result.totalPages ?? 1);
        }
      })
      .catch((error) => {
        if (active)
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load quotations.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [leadId, page, attempt, canView]);
  if (!canView) return null;
  const reload = (nextPage: number) => {
    setLoading(true);
    setError("");
    setPage(nextPage);
    setAttempt((n) => n + 1);
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
      {loading ? (
        <p role="status" className="text-xs">
          Loading quotations...
        </p>
      ) : error ? (
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
