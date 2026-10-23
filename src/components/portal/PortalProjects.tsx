"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePortalQuery } from "@/hooks/usePortalQuery";
import { listPortalProjects } from "@/services/portalApi";
import { portalDate } from "@/lib/portalFormat";
import {
  PortalPager,
  PortalPanel,
  PortalProgress,
  PortalQueryBoundary,
  PortalStatusBadge,
  portalLinkClass,
} from "./PortalUI";

export default function PortalProjects() {
  const [page, setPage] = useState(1);
  const load = useCallback(() => listPortalProjects(page), [page]);
  const query = usePortalQuery(`projects:${page}`, load);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-on-background">Projects</h1>
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
              <div className="overflow-x-auto">
                <table className="w-full min-w-176 text-left text-sm">
                  <caption className="sr-only">Your projects</caption>
                  <thead className="bg-surface-container text-xs uppercase tracking-wide text-on-surface-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        Project
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Progress
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Start
                      </th>
                      <th scope="col" className="px-4 py-3">
                        End
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {data.items.map((project) => (
                      <tr key={project.id}>
                        <th scope="row" className="px-4 py-3 font-medium">
                          <Link
                            href={`/portal/projects/${encodeURIComponent(project.id)}`}
                            className={portalLinkClass}
                          >
                            {project.projectName}
                          </Link>
                          {project.location ? (
                            <span className="block text-xs font-normal text-on-surface-muted">
                              {project.location}
                            </span>
                          ) : null}
                        </th>
                        <td className="px-4 py-3">
                          <PortalStatusBadge status={project.status} />
                        </td>
                        <td className="px-4 py-3">
                          <PortalProgress
                            value={project.progressPercentage}
                            label={`Progress of ${project.projectName}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          {portalDate(project.startDate)}
                        </td>
                        <td className="px-4 py-3">
                          {portalDate(project.endDate)}
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
