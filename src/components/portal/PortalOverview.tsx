"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { FileText, FolderKanban, FolderOpen, Receipt } from "lucide-react";
import { usePortalQuery } from "@/hooks/usePortalQuery";
import { listPortalProjects, listPortalQuotations } from "@/services/portalApi";
import { portalDate, portalMoney } from "@/lib/portalFormat";
import {
  PortalPanel,
  PortalProgress,
  PortalQueryBoundary,
  PortalStatusBadge,
  portalLinkClass,
} from "./PortalUI";

const OVERVIEW_LIMIT = 5;
const loadProjects = () => listPortalProjects(1, OVERVIEW_LIMIT);
const loadQuotations = () => listPortalQuotations(1, OVERVIEW_LIMIT);

function StatCard({
  href,
  icon: Icon,
  label,
  value,
  note,
}: Readonly<{
  href: string;
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
}>) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-level-1 transition-colors duration-200 hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-on-surface-variant">{label}</p>
        <Icon size={18} className="text-primary" aria-hidden="true" />
      </div>
      <div>
        <p className="text-3xl font-bold leading-tight tracking-tight tabular-nums text-on-background">
          {value}
        </p>
        <p className="mt-1 text-xs text-on-surface-muted">{note}</p>
      </div>
    </Link>
  );
}

function ViewAll({ href, label }: Readonly<{ href: string; label: string }>) {
  return (
    <Link href={href} className={`${portalLinkClass} text-sm`}>
      {label}
    </Link>
  );
}

export default function PortalOverview() {
  const projects = usePortalQuery("projects:overview", loadProjects);
  const quotations = usePortalQuery("quotations:overview", loadQuotations);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          href="/portal/projects"
          icon={FolderKanban}
          label="Projects"
          value={projects.data ? String(projects.data.total) : "—"}
          note="Linked to your account"
        />
        <StatCard
          href="/portal/quotations"
          icon={FileText}
          label="Quotations"
          value={quotations.data ? String(quotations.data.total) : "—"}
          note="Prepared for you"
        />
        <StatCard
          href="/portal/documents"
          icon={FolderOpen}
          label="Shared documents"
          value="Browse"
          note="Files from your project team"
        />
        <StatCard
          href="/portal/billing"
          icon={Receipt}
          label="Invoices & payments"
          value="Soon"
          note="Not available in the portal yet"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <PortalPanel
          title="Recent projects"
          description="Your latest projects and how far along they are."
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
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/portal/projects/${encodeURIComponent(project.id)}`}
                        className={`${portalLinkClass} text-sm`}
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
          description="The latest quotations prepared for you."
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
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-on-background">
                        {portalDate(quotation.quotationDate)}
                      </p>
                      <div className="mt-1">
                        <PortalStatusBadge status={quotation.status} />
                      </div>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">
                      {portalMoney(quotation.totalAmount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </PortalQueryBoundary>
        </PortalPanel>
      </div>
    </div>
  );
}
