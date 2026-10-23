"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePortalQuery } from "@/hooks/usePortalQuery";
import { getPortalProject, listPortalMilestones } from "@/services/portalApi";
import { portalDate } from "@/lib/portalFormat";
import PortalDocumentList from "./PortalDocumentList";
import {
  PortalPanel,
  PortalProgress,
  PortalQueryBoundary,
  PortalStatusBadge,
  portalLinkClass,
} from "./PortalUI";

function Fact({
  term,
  children,
}: Readonly<{ term: string; children: React.ReactNode }>) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-on-surface-muted">
        {term}
      </dt>
      <dd className="mt-1 text-sm text-on-background">{children}</dd>
    </div>
  );
}

export default function PortalProjectDetail({
  projectId,
}: Readonly<{ projectId: string }>) {
  const loadProject = useCallback(
    () => getPortalProject(projectId),
    [projectId],
  );
  const loadMilestones = useCallback(
    () => listPortalMilestones(projectId),
    [projectId],
  );
  const project = usePortalQuery(`project:${projectId}`, loadProject);
  const milestones = usePortalQuery(`milestones:${projectId}`, loadMilestones);

  return (
    <div className="space-y-4">
      <Link
        href="/portal/projects"
        className={`${portalLinkClass} inline-flex items-center gap-1.5 text-sm`}
      >
        <ArrowLeft size={15} />
        All projects
      </Link>

      <PortalPanel title="Project details">
        <PortalQueryBoundary
          query={project}
          loadingLabel="Loading project"
          isEmpty={() => false}
          emptyTitle=""
          emptyDescription=""
        >
          {(data) => (
            <div className="space-y-4 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-on-background">
                  {data.projectName}
                </h2>
                <PortalStatusBadge status={data.status} />
              </div>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Fact term="Location">{data.location ?? "Not set"}</Fact>
                <Fact term="Start date">{portalDate(data.startDate)}</Fact>
                <Fact term="End date">{portalDate(data.endDate)}</Fact>
                <Fact term="Progress">
                  <PortalProgress
                    value={data.progressPercentage}
                    label={`Progress of ${data.projectName}`}
                  />
                </Fact>
              </dl>
            </div>
          )}
        </PortalQueryBoundary>
      </PortalPanel>

      <PortalPanel
        title="Milestones"
        description="Delivery stages and how far along each one is."
      >
        <PortalQueryBoundary
          query={milestones}
          loadingLabel="Loading milestones"
          isEmpty={(data) => data.length === 0}
          emptyTitle="No milestones yet"
          emptyDescription="Milestones will appear once the project team has planned the delivery stages."
        >
          {(data) => (
            <div className="overflow-x-auto">
              <table className="w-full min-w-176 text-left text-sm">
                <caption className="sr-only">Project milestones</caption>
                <thead className="bg-surface-container text-xs uppercase tracking-wide text-on-surface-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Milestone
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Progress
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Due
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Completed
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {data.map((milestone) => (
                    <tr key={milestone.id}>
                      <th scope="row" className="px-4 py-3 font-medium">
                        {milestone.milestoneName}
                        {milestone.description ? (
                          <span className="block text-xs font-normal text-on-surface-muted">
                            {milestone.description}
                          </span>
                        ) : null}
                      </th>
                      <td className="px-4 py-3">
                        <PortalStatusBadge status={milestone.status} />
                      </td>
                      <td className="px-4 py-3">
                        <PortalProgress
                          value={milestone.progressPercentage}
                          label={`Progress of ${milestone.milestoneName}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {portalDate(milestone.dueDate)}
                      </td>
                      <td className="px-4 py-3">
                        {milestone.completedAt
                          ? portalDate(milestone.completedAt)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PortalQueryBoundary>
      </PortalPanel>

      <PortalPanel
        title="Shared documents"
        description="Files your project team has shared with you."
      >
        <PortalDocumentList projectId={projectId} />
      </PortalPanel>
    </div>
  );
}
