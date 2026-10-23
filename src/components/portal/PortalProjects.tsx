"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { usePortalQuery } from "@/hooks/usePortalQuery";
import { listPortalProjects } from "@/services/portalApi";
import { portalDate } from "@/lib/portalFormat";
import {
  PortalPager,
  PortalPanel,
  PortalProgress,
  PortalQueryBoundary,
  PortalStatusBadge,
} from "./PortalUI";

export default function PortalProjects() {
  const [page, setPage] = useState(1);
  const load = useCallback(() => listPortalProjects(page), [page]);
  const query = usePortalQuery(`projects:${page}`, load);

  return (
    <div className="space-y-4">
      <PortalPanel
        title="Your projects"
        description="Status and progress for the projects linked to your account."
      >
        <PortalQueryBoundary
          query={query}
          loadingLabel="Loading projects"
          isEmpty={(data) => data.items.length === 0}
          emptyTitle="No projects yet"
          emptyDescription="Projects appear here once a quotation has been converted into a project for you."
        >
          {(data) => (
            <>
              <ul className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((project) => (
                  <li key={project.id}>
                    <article className="group relative flex h-full flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 transition duration-200 hover:border-primary/40 hover:shadow-level-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-bold text-on-background">
                            <Link
                              href={`/portal/projects/${encodeURIComponent(project.id)}`}
                              className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            >
                              {project.projectName}
                            </Link>
                          </h3>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-on-surface-muted">
                            <MapPin size={12} aria-hidden="true" />
                            {project.location ?? "Location not set"}
                          </p>
                        </div>
                        <PortalStatusBadge status={project.status} />
                      </div>
                      <PortalProgress
                        value={project.progressPercentage}
                        label={`Progress of ${project.projectName}`}
                      />
                      <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-outline-variant pt-3 text-xs">
                        <div>
                          <dt className="text-on-surface-muted">Start</dt>
                          <dd className="mt-0.5 font-semibold text-on-background">
                            {portalDate(project.startDate)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-on-surface-muted">End</dt>
                          <dd className="mt-0.5 font-semibold text-on-background">
                            {portalDate(project.endDate)}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  </li>
                ))}
              </ul>
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
