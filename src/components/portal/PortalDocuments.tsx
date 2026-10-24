"use client";

import { useState } from "react";
import { usePortalQuery } from "@/hooks/usePortalQuery";
import { listPortalProjects } from "@/services/portalApi";
import PortalDocumentList from "./PortalDocumentList";
import { PortalPanel, PortalQueryBoundary } from "./PortalUI";

// The API lists documents per project, so the client picks a project first.
const loadProjectChoices = () => listPortalProjects(1, 100);

export default function PortalDocuments() {
  const projects = usePortalQuery("projects:choices", loadProjectChoices);
  const [selectedId, setSelectedId] = useState("");

  return (
    <div className="space-y-4">
      <PortalPanel
        title="Shared documents"
        description="Choose a project to see the files shared with you."
      >
        <PortalQueryBoundary
          query={projects}
          loadingLabel="Loading projects"
          isEmpty={(data) => data.items.length === 0}
          emptyTitle="No projects yet"
          emptyDescription="Shared documents are organised by project. They will appear once a project is linked to your account."
        >
          {(data) => {
            const current = data.items.some((item) => item.id === selectedId)
              ? selectedId
              : data.items[0].id;
            return (
              <>
                <div className="border-b border-outline-variant p-4">
                  <label
                    htmlFor="portal-document-project"
                    className="mb-1 block text-sm font-semibold text-on-background"
                  >
                    Project
                  </label>
                  <select
                    id="portal-document-project"
                    value={current}
                    onChange={(event) => setSelectedId(event.target.value)}
                    className="w-full max-w-md rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm text-on-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {data.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.projectName}
                      </option>
                    ))}
                  </select>
                  {data.total > data.items.length ? (
                    <p className="mt-2 text-xs text-on-surface-muted">
                      Showing the first {data.items.length} of {data.total}{" "}
                      projects.
                    </p>
                  ) : null}
                </div>
                <PortalDocumentList key={current} projectId={current} />
              </>
            );
          }}
        </PortalQueryBoundary>
      </PortalPanel>
    </div>
  );
}
