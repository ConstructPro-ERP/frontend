"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban, Plus, RefreshCw, ArrowUpRight } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { listProjects } from "@/services/projectsApi";
import {
  PROJECT_STATUSES,
  type ProjectStatus,
  type ProjectSortField,
} from "@/types/project";
import { isUuid, projectPermissions } from "@/lib/projectRules";
import ProjectForm from "./ProjectForm";
import { useProjectData } from "./useProjectData";
import {
  Badge,
  Progress,
  Notice,
  Empty,
  Pager,
  buttonClass,
  primaryClass,
  inputClass,
  panelClass,
  date,
  money,
  label,
} from "./ProjectUI";

export default function ProjectsDashboardClient() {
  const user = useSelector((state: RootState) => state.auth.user);
  if (!user) return <p role="status">Loading projects…</p>;
  if (!projectPermissions(user.role).read)
    return <Notice error>You do not have access to projects.</Notice>;
  return <ProjectsList role={user.role} />;
}
function ProjectsList({ role }: { role: string | null }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "ALL">("ALL");
  const [manager, setManager] = useState("");
  const [managerFilter, setManagerFilter] = useState("");
  const [filterError, setFilterError] = useState("");
  const [sortBy, setSortBy] = useState<ProjectSortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const load = useCallback(
    () =>
      listProjects({
        search: debouncedSearch || undefined,
        status: status === "ALL" ? undefined : status,
        projectManagerId: managerFilter || undefined,
        page,
        limit: 10,
        sortBy,
        sortOrder,
      }),
    [debouncedSearch, status, managerFilter, page, sortBy, sortOrder],
  );
  const { data: result, loading, error } = useProjectData(load, revision);
  const loadSummary = useCallback(async () => {
    const statuses = [
      undefined,
      "ACTIVE",
      "PLANNING",
      "COMPLETED",
      "ON_HOLD",
    ] as const;
    return Promise.all(
      statuses.map((status) =>
        listProjects({ status, limit: 1 }).then((result) => result.meta.total),
      ),
    );
  }, []);
  const summary = useProjectData(loadSummary, revision);
  const pagination = result?.meta;
  return (
    <section className="space-y-6 text-on-background">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-primary-soft p-3 text-primary">
              <FolderKanban size={24} />
            </span>
            <div>
              <h1 className="text-2xl font-bold">Project Management</h1>
              <p className="mt-1 text-sm text-on-surface-muted">
                Plan, track, and deliver every construction project.
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className={buttonClass}
            disabled={loading}
            onClick={() => setRevision((v) => v + 1)}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          {role === "ADMIN" && (
            <button className={primaryClass} onClick={() => setCreating(true)}>
              <Plus size={16} />
              Create project
            </button>
          )}
        </div>
      </header>
      {success && <Notice>{success}</Notice>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {["Total projects", "Active", "Planning", "Completed", "On hold"].map(
          (name, i) => (
            <div key={name} className={panelClass + " p-5"}>
              <p className="text-xs font-semibold text-on-surface-muted">
                {name}
              </p>
              <p className="mt-3 text-3xl font-bold">
                {summary.loading ? "…" : (summary.data?.[i] ?? "—")}
              </p>
              <p className="mt-2 text-xs text-on-surface-muted">
                {role === "PROJECT_MANAGER"
                  ? "Assigned to you"
                  : "Across all projects"}
              </p>
            </div>
          ),
        )}
      </div>
      {summary.error && (
        <Notice error>
          Project totals could not be loaded. {summary.error}
        </Notice>
      )}
      <div className={panelClass + " p-4"}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-semibold">
            Search projects
            <input
              className={inputClass + " mt-2"}
              type="search"
              placeholder="Search name or location"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            Status
            <select
              className={inputClass + " mt-2"}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as ProjectStatus | "ALL");
                setPage(1);
              }}
            >
              <option value="ALL">All statuses</option>
              {PROJECT_STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Sort by
            <select
              className={inputClass + " mt-2"}
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as ProjectSortField);
                setPage(1);
              }}
            >
              <option value="createdAt">Date created</option>
              <option value="projectName">Project name</option>
              <option value="startDate">Start date</option>
            </select>
          </label>
          <label className="text-xs font-semibold">
            Order
            <select
              className={inputClass + " mt-2"}
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as "asc" | "desc");
                setPage(1);
              }}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>
        </div>
        {role !== "PROJECT_MANAGER" && (
          <form
            className="mt-4 flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (manager && !isUuid(manager.trim())) {
                setFilterError("Enter a valid manager UUID.");
                return;
              }
              setFilterError("");
              setManagerFilter(manager.trim());
              setPage(1);
            }}
          >
            <label className="min-w-56 flex-1 text-xs font-semibold">
              Project manager
              <input
                className={inputClass + " mt-2"}
                placeholder="Filter by manager UUID"
                value={manager}
                onChange={(e) => setManager(e.target.value)}
              />
            </label>
            <button className={buttonClass}>Apply filter</button>
            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                setManager("");
                setManagerFilter("");
                setFilterError("");
                setStatus("ALL");
                setSearch("");
                setPage(1);
              }}
            >
              Clear filters
            </button>
          </form>
        )}
        {filterError && (
          <p role="alert" className="mt-2 text-sm text-error">
            {filterError}
          </p>
        )}
      </div>
      <article className={panelClass + " overflow-hidden"}>
        <div className="flex items-center justify-between border-b border-outline-variant p-5">
          <h2 className="font-semibold">Projects</h2>
          <span className="text-xs text-on-surface-muted">
            {result
              ? result.meta.total + " matching projects"
              : "Project portfolio"}
          </span>
        </div>
        {loading ? (
          <p role="status" className="p-10 text-center">
            Loading projects…
          </p>
        ) : error ? (
          <div className="space-y-3 p-5">
            <Notice error>{error}</Notice>
            <button
              className={buttonClass}
              onClick={() => setRevision((v) => v + 1)}
            >
              Try again
            </button>
          </div>
        ) : !result?.data.length ? (
          <Empty
            title="No projects found"
            description="Create a project or adjust your search and filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-surface-container text-xs text-on-surface-muted">
                <tr>
                  {[
                    "Project",
                    "Manager",
                    "Schedule",
                    "Budget",
                    "Progress",
                    "Status",
                    "",
                  ].map((heading, i) => (
                    <th key={i} scope="col" className="px-5 py-3">
                      {heading || <span className="sr-only">Details</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.data.map((project) => (
                  <tr
                    key={project.id}
                    className="border-t border-outline-variant hover:bg-surface-container/50"
                  >
                    <td className="px-5 py-5">
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {project.projectName}
                      </Link>
                      <p className="mt-1 text-xs text-on-surface-muted">
                        {project.location || "Location not set"}
                      </p>
                    </td>
                    <td className="px-5 py-5">
                      {project.projectManager?.fullName ?? "Unassigned"}
                    </td>
                    <td className="px-5 py-5 text-xs">
                      {date(project.startDate)}
                      <p className="mt-1 text-on-surface-muted">
                        to {date(project.endDate)}
                      </p>
                    </td>
                    <td className="px-5 py-5 whitespace-nowrap">
                      {money(project.budget)}
                    </td>
                    <td className="px-5 py-5">
                      <Progress value={project.progressPercentage} />
                    </td>
                    <td className="px-5 py-5">
                      <Badge status={project.status} />
                    </td>
                    <td className="px-5 py-5">
                      <Link
                        aria-label={`View ${project.projectName}`}
                        href={`/dashboard/projects/${project.id}`}
                        className="text-primary"
                      >
                        <ArrowUpRight size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && pagination && (
          <Pager
            page={page}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onChange={setPage}
          />
        )}
      </article>
      <p className="text-xs text-on-surface-muted">
        Progress is calculated from weighted milestones when available. Task
        completion is tracked separately.
      </p>
      {creating && (
        <ProjectForm
          onClose={() => setCreating(false)}
          onSaved={(project) => {
            setSuccess(
              `${project.projectName} created in ${label(project.status)}.`,
            );
            setPage(1);
            setRevision((v) => v + 1);
          }}
        />
      )}
    </section>
  );
}
