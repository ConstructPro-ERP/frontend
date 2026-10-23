"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { usePortalQuery } from "@/hooks/usePortalQuery";
import { listPortalProjects, listPortalQuotations } from "@/services/portalApi";
import { portalDate, portalMoney } from "@/lib/portalFormat";
import {
  PortalPanel,
  PortalProgress,
  PortalQueryBoundary,
  PortalStatusBadge,
  portalLinkClass,
  portalPanelClass,
} from "./PortalUI";

const OVERVIEW_LIMIT = 5;
const loadProjects = () => listPortalProjects(1, OVERVIEW_LIMIT);
const loadQuotations = () => listPortalQuotations(1, OVERVIEW_LIMIT);

function ViewAll({ href, label }: Readonly<{ href: string; label: string }>) {
  return (
    <Link href={href} className={`${portalLinkClass} text-sm`}>
      {label}
    </Link>
  );
}

export default function PortalOverview() {
  const user = useSelector((state: RootState) => state.auth.user);
  const projects = usePortalQuery("projects:overview", loadProjects);
  const quotations = usePortalQuery("quotations:overview", loadQuotations);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-background">
          Welcome{user?.firstName ? `, ${user.firstName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-on-surface-muted">
          A read-only view of your projects, quotations and shared documents.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`${portalPanelClass} p-4`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-muted">
            Projects
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-on-background">
            {projects.data ? projects.data.total : "—"}
          </p>
        </div>
        <div className={`${portalPanelClass} p-4`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-muted">
            Quotations
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-on-background">
            {quotations.data ? quotations.data.total : "—"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PortalPanel
          title="Recent projects"
          action={<ViewAll href="/portal/projects" label="View all" />}
        >
          <PortalQueryBoundary
            query={projects}
            loadingLabel="Loading projects"
            isEmpty={(data) => data.items.length === 0}
            emptyTitle="No projects yet"
            emptyDescription="Projects linked to your account will appear here."
          >
            {(data) => (
              <ul className="divide-y divide-outline-variant">
                {data.items.map((project) => (
                  <li
                    key={project.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/portal/projects/${encodeURIComponent(project.id)}`}
                        className={portalLinkClass}
                      >
                        {project.projectName}
                      </Link>
                      <div className="mt-1">
                        <PortalStatusBadge status={project.status} />
                      </div>
                    </div>
                    <PortalProgress
                      value={project.progressPercentage}
                      label={`Progress of ${project.projectName}`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </PortalQueryBoundary>
        </PortalPanel>

        <PortalPanel
          title="Recent quotations"
          action={<ViewAll href="/portal/quotations" label="View all" />}
        >
          <PortalQueryBoundary
            query={quotations}
            loadingLabel="Loading quotations"
            isEmpty={(data) => data.items.length === 0}
            emptyTitle="No quotations yet"
            emptyDescription="Quotations prepared for you will appear here."
          >
            {(data) => (
              <ul className="divide-y divide-outline-variant">
                {data.items.map((quotation) => (
                  <li
                    key={quotation.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-on-background">
                        {portalDate(quotation.quotationDate)}
                      </p>
                      <div className="mt-1">
                        <PortalStatusBadge status={quotation.status} />
                      </div>
                    </div>
                    <p className="font-semibold tabular-nums">
                      {portalMoney(quotation.totalAmount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </PortalQueryBoundary>
        </PortalPanel>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/portal/billing"
          className={`${portalPanelClass} block p-4 hover:bg-surface-container`}
        >
          <h2 className="font-bold text-on-background">
            Invoices &amp; payments
          </h2>
          <p className="mt-1 text-sm text-on-surface-muted">
            Billing status for your projects.
          </p>
        </Link>
        <Link
          href="/portal/documents"
          className={`${portalPanelClass} block p-4 hover:bg-surface-container`}
        >
          <h2 className="font-bold text-on-background">Shared documents</h2>
          <p className="mt-1 text-sm text-on-surface-muted">
            Download files shared by your project team.
          </p>
        </Link>
      </div>
    </div>
  );
}
