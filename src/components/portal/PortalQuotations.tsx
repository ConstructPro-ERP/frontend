"use client";

import { useCallback, useState } from "react";
import { usePortalQuery } from "@/hooks/usePortalQuery";
import { listPortalQuotations } from "@/services/portalApi";
import { portalDate, portalMoney } from "@/lib/portalFormat";
import {
  PortalPager,
  PortalPanel,
  PortalQueryBoundary,
  PortalStatusBadge,
} from "./PortalUI";

export default function PortalQuotations() {
  const [page, setPage] = useState(1);
  const load = useCallback(() => listPortalQuotations(page), [page]);
  const query = usePortalQuery(`quotations:${page}`, load);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-on-background">Quotations</h1>
      <PortalPanel
        title="Your quotations"
        description="Quotations prepared for you. Approval and changes are handled by the ConstructPro team."
      >
        <PortalQueryBoundary
          query={query}
          loadingLabel="Loading quotations"
          isEmpty={(data) => data.items.length === 0}
          emptyTitle="No quotations yet"
          emptyDescription="Quotations prepared for you will be listed here."
        >
          {(data) => (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-144 text-left text-sm">
                  <caption className="sr-only">Your quotations</caption>
                  <thead className="bg-surface-container text-xs uppercase tracking-wide text-on-surface-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        Quotation date
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        Total
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {data.items.map((quotation) => (
                      <tr key={quotation.id}>
                        <th scope="row" className="px-4 py-3 font-medium">
                          {portalDate(quotation.quotationDate)}
                        </th>
                        <td className="px-4 py-3">
                          <PortalStatusBadge status={quotation.status} />
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {portalMoney(quotation.totalAmount)}
                        </td>
                        <td className="px-4 py-3">
                          {portalDate(quotation.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PortalPager
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                fetching={query.fetching}
                onChange={setPage}
              />
            </>
          )}
        </PortalQueryBoundary>
      </PortalPanel>
    </div>
  );
}
