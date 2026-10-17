"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { ArrowLeft, MapPin, Pencil, RefreshCw } from "lucide-react";
import type { RootState } from "@/store";
import type { Project, ProjectStatus } from "@/types/project";
import {
  getProjectById,
  updateProjectStatus,
  assignProjectManager,
  deleteProject,
} from "@/services/projectsApi";
import {
  projectPermissions,
  projectTransitions,
  isUuid,
} from "@/lib/projectRules";
import ProjectForm from "./ProjectForm";
import ProjectCalendarSection from "./ProjectCalendarSection";
import MilestonesSection from "./MilestonesSection";
import TasksSection from "./TasksSection";
import ExpensesSection from "./ExpensesSection";
import DocumentsSection from "./DocumentsSection";
import { useProjectData } from "./useProjectData";
import { useProjectManagers } from "./useProjectManagers";
import {
  Badge,
  Progress,
  Notice,
  Editor,
  buttonClass,
  panelClass,
  date,
  money,
  label,
  errorMessage,
} from "./ProjectUI";

const tabs = [
  "Overview",
  "Milestones",
  "Tasks",
  "Calendar",
  "Expenses",
  "Documents",
] as const;
export default function ProjectDetails({ projectId }: { projectId: string }) {
  const user = useSelector((state: RootState) => state.auth.user);
  if (!user) return <p role="status">Loading project…</p>;
  if (!projectPermissions(user.role).read)
    return <Notice error>You do not have access to projects.</Notice>;
  return (
    <ProjectDetailsContent
      key={projectId}
      projectId={projectId}
      userId={user.id}
      role={user.role}
    />
  );
}
function ProjectDetailsContent({
  projectId,
  userId,
  role,
}: {
  projectId: string;
  userId: string;
  role: string | null;
}) {
  const router = useRouter();
  const managers = useProjectManagers(role === "ADMIN");
  const load = useCallback(() => getProjectById(projectId), [projectId]);
  const [revision, setRevision] = useState(0);
  const result = useProjectData(load, revision);
  const [updated, setUpdated] = useState<Project | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [modal, setModal] = useState<
    "edit" | "manager" | "status" | "delete" | null
  >(null);
  const [feedback, setFeedback] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const project = updated ?? result.data;
  const permissions = projectPermissions(role, userId, project ?? undefined);
  function saved(project: Project, message: string) {
    setUpdated(project);
    setFeedback(message);
  }
  async function refreshProgress() {
    try {
      setUpdated(await getProjectById(projectId));
      setRefreshError("");
    } catch (error) {
      setRefreshError(
        "Milestone saved, but project progress could not refresh. " +
          errorMessage(error),
      );
    }
  }
  return (
    <section className="space-y-6 text-on-background">
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
      >
        <ArrowLeft size={16} />
        All projects
      </Link>
      {result.loading ? (
        <p role="status">Loading project…</p>
      ) : result.error ? (
        <div className="space-y-3">
          <Notice error>{result.error}</Notice>
          <button
            className={buttonClass}
            onClick={() => setRevision((v) => v + 1)}
          >
            Try again
          </button>
        </div>
      ) : !project ? (
        <Notice error>Project not found.</Notice>
      ) : !permissions.read ? (
        <Notice error>You are not assigned to this project.</Notice>
      ) : (
        <>
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold">{project.projectName}</h1>
                <Badge status={project.status} />
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-on-surface-muted">
                <MapPin size={15} />
                {project.location || "Location not set"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                aria-label="Refresh project"
                className={buttonClass}
                onClick={() => {
                  setUpdated(null);
                  setRevision((v) => v + 1);
                }}
              >
                <RefreshCw size={16} />
              </button>
              {permissions.manage && (
                <>
                  <button
                    className={buttonClass}
                    onClick={() => setModal("edit")}
                  >
                    <Pencil size={15} />
                    Edit project
                  </button>
                  <button
                    className={buttonClass}
                    onClick={() => setModal("status")}
                  >
                    Update status
                  </button>
                </>
              )}
            </div>
          </header>
          {feedback && <Notice>{feedback}</Notice>}
          {refreshError && <Notice error>{refreshError}</Notice>}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className={panelClass + " p-5"}>
              <p className="text-xs text-on-surface-muted">Project manager</p>
              <p className="mt-2 font-semibold">
                {project.projectManager?.fullName ?? "Unassigned"}
              </p>
              {permissions.assign && (
                <button
                  className="mt-2 text-xs font-semibold text-primary underline"
                  onClick={() => setModal("manager")}
                >
                  Change manager
                </button>
              )}
            </div>
            <div className={panelClass + " p-5"}>
              <p className="text-xs text-on-surface-muted">Project schedule</p>
              <p className="mt-2 text-sm font-semibold">
                {date(project.startDate)}
              </p>
              <p className="mt-1 text-xs text-on-surface-muted">
                to {date(project.endDate)}
              </p>
            </div>
            <div className={panelClass + " p-5"}>
              <p className="text-xs text-on-surface-muted">Project budget</p>
              <p className="mt-2 font-semibold">{money(project.budget)}</p>
              <p className="mt-1 text-xs text-on-surface-muted">
                Separate from quotation totals
              </p>
            </div>
            <div className={panelClass + " p-5"}>
              <p className="mb-3 text-xs text-on-surface-muted">
                Weighted project progress
              </p>
              <Progress value={project.progressPercentage} />
            </div>
          </div>
          {!permissions.manage && (
            <p className="text-sm text-on-surface-muted">
              {["COMPLETED", "CANCELLED"].includes(project.status)
                ? "This project is closed. Records are available for reference."
                : "You have read-only access to project operations."}
            </p>
          )}
          <nav
            aria-label="Project sections"
            className="flex gap-1 overflow-x-auto border-b border-outline-variant"
          >
            {tabs.map((name) => (
              <button
                key={name}
                aria-current={tab === name ? "page" : undefined}
                onClick={() => setTab(name)}
                className={`whitespace-nowrap border-b-2 px-5 py-3 text-sm font-semibold ${tab === name ? "border-primary text-primary" : "border-transparent text-on-surface-muted hover:text-on-background"}`}
              >
                {name}
              </button>
            ))}
          </nav>
          {tab === "Overview" && (
            <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
              <article className={panelClass + " p-5"}>
                <h2 className="font-bold">Associated quotations</h2>
                <p className="mt-1 text-sm text-on-surface-muted">
                  A project can include multiple quotations. Each retains its
                  own approved value.
                </p>
                {project.quotations?.length ? (
                  <div className="mt-4 divide-y divide-outline-variant">
                    {project.quotations.map((quotation) => (
                      <div
                        key={quotation.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-4"
                      >
                        <div>
                          <Link
                            className="break-all text-sm font-semibold text-primary hover:underline"
                            href={`/dashboard/quotations?quotationId=${encodeURIComponent(quotation.id)}`}
                          >
                            Quotation {quotation.id}
                          </Link>
                          <div className="mt-2">
                            <Badge status={quotation.status} />
                          </div>
                        </div>
                        <strong className="text-sm">
                          {money(quotation.totalAmount)}
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-sm text-on-surface-muted">
                    No quotations linked yet. Approve and convert a quotation to
                    link it to this project.
                  </p>
                )}
              </article>
              <aside className="space-y-4">
                <div className={panelClass + " p-5"}>
                  <h2 className="font-bold">Project lifecycle</h2>
                  <p className="mt-2 text-sm leading-6 text-on-surface-muted">
                    {project.status === "PLANNING"
                      ? "Planning projects need an active manager, valid schedule, and an approved quotation before activation."
                      : project.status === "ACTIVE"
                        ? "Keep milestones up to date, place work on hold when needed, or complete the project once delivery requirements are satisfied."
                        : project.status === "ON_HOLD"
                          ? "Resume this project when work can continue."
                          : "This project has reached its final status."}
                  </p>
                </div>
                {permissions.delete && (
                  <div className="rounded-xl border border-error/20 p-5">
                    <h2 className="font-semibold">Delete unused project</h2>
                    <p className="mt-2 text-sm text-on-surface-muted">
                      Only unused Planning projects can be deleted. Linked
                      records may prevent deletion.
                    </p>
                    <button
                      className={buttonClass + " mt-4 text-error"}
                      onClick={() => setModal("delete")}
                    >
                      Delete project
                    </button>
                  </div>
                )}
              </aside>
            </div>
          )}
          {tab === "Milestones" && (
            <MilestonesSection
              projectId={projectId}
              canManage={permissions.manage}
              onChanged={() => void refreshProgress()}
            />
          )}
          {tab === "Tasks" && (
            <TasksSection
              projectId={projectId}
              canManage={permissions.manage}
            />
          )}
          {tab === "Calendar" && (
            <ProjectCalendarSection
              project={project}
              canManage={permissions.manage}
            />
          )}
          {tab === "Expenses" && (
            <ExpensesSection
              projectId={projectId}
              budget={project.budget}
              canWrite={permissions.expenseWrite}
              canDelete={permissions.expenseDelete}
            />
          )}
          {tab === "Documents" && (
            <DocumentsSection
              projectId={projectId}
              canManage={permissions.manage}
            />
          )}
          {modal === "edit" && permissions.manage && (
            <ProjectForm
              project={project}
              onClose={() => setModal(null)}
              onSaved={(value) => saved(value, "Project updated successfully.")}
            />
          )}
          {modal === "manager" && permissions.assign && (
            <Editor
              title="Assign project manager"
              fields={[managers.field]}
              initial={{ projectManagerId: project.projectManagerId }}
              validate={(v) =>
                isUuid(v.projectManagerId?.trim() ?? "")
                  ? null
                  : "Enter a valid project manager UUID."
              }
              onClose={() => setModal(null)}
              onSave={async (v) =>
                saved(
                  await assignProjectManager(
                    projectId,
                    v.projectManagerId.trim(),
                  ),
                  "Project manager assigned successfully.",
                )
              }
            />
          )}
          {modal === "status" && permissions.manage && (
            <Editor
              title="Update project status"
              description="Cancellation is permanent. By choosing Cancelled and confirming below, you confirm cancellation. Activation and completion requirements are checked before saving."
              fields={[
                {
                  name: "status",
                  label: "New status",
                  type: "select",
                  required: true,
                  options: projectTransitions[project.status].map((value) => ({
                    value,
                    label: label(value),
                  })),
                },
              ]}
              initial={{ status: projectTransitions[project.status][0] ?? "" }}
              onClose={() => setModal(null)}
              submitLabel="Confirm status change"
              onSave={async (v) =>
                saved(
                  await updateProjectStatus(
                    projectId,
                    v.status as ProjectStatus,
                  ),
                  "Project status updated successfully.",
                )
              }
            />
          )}
          {modal === "delete" && permissions.delete && (
            <Editor
              title="Delete project permanently?"
              description={`Delete “${project.projectName}”? This cannot be undone. Projects with linked records cannot be deleted.`}
              fields={[]}
              onClose={() => setModal(null)}
              submitLabel="Delete permanently"
              onSave={async () => {
                await deleteProject(projectId);
                router.push("/dashboard/projects");
              }}
            />
          )}
        </>
      )}
    </section>
  );
}
