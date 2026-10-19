"use client";

import { useEffect, useState } from "react";
import { listProjects } from "@/services/projectsApi";
import { ApiError } from "@/lib/ApiError";
import type { Project } from "@/types/project";

export default function ProjectSelectDropdown({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const result = await listProjects({
          search: search.trim(),
          page,
          limit: 20,
        });
        if (active) {
          setProjects(result.data);
          setTotalPages(result.meta.totalPages);
        }
      } catch (err) {
        if (active) {
          const message =
            err instanceof Error ? err.message : "Unable to load projects.";
          setError(
            err instanceof ApiError && err.statusCode === 403
              ? `${message} Project access denied. Sales Managers need backend permission to list projects. Contact your administrator.`
              : message,
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, page, attempt]);

  const inputClass =
    "w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-xs text-on-background outline-none focus:border-primary";
  return (
    <div className="space-y-2">
      <label
        htmlFor="project-search"
        className="block text-xs font-semibold text-on-surface-variant"
      >
        Search projects by name or UUID
      </label>
      <input
        id="project-search"
        className={inputClass}
        value={search}
        disabled={disabled}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
          setLoading(true);
          setError("");
        }}
      />
      <label
        htmlFor="target-project"
        className="block text-xs font-semibold text-on-surface-variant"
      >
        Target project (name and UUID) *
      </label>
      <select
        id="target-project"
        className={inputClass}
        value={value}
        disabled={disabled || loading || !!error}
        aria-required="true"
        onChange={(event) => {
          setSelected(
            projects.find((project) => project.id === event.target.value) ??
              null,
          );
          onChange(event.target.value);
        }}
      >
        <option value="">Select an existing project</option>
        {selected && !projects.some((project) => project.id === selected.id) ? (
          <option value={selected.id}>
            {selected.projectName} — {selected.id}
          </option>
        ) : null}
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.projectName} — {project.id}
          </option>
        ))}
      </select>
      {loading ? (
        <p role="status" className="text-xs text-on-surface-muted">
          Loading projects...
        </p>
      ) : null}
      {error ? (
        <div role="alert" className="text-xs text-error">
          {error}{" "}
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setLoading(true);
              setError("");
              setAttempt((n) => n + 1);
            }}
          >
            Retry projects
          </button>
        </div>
      ) : null}
      {!loading && !error && projects.length === 0 ? (
        <p role="status" className="text-xs text-on-surface-muted">
          No matching projects found.
        </p>
      ) : null}
      <div className="flex items-center justify-between text-xs text-on-surface-variant">
        <button
          type="button"
          disabled={disabled || loading || !!error || page <= 1}
          onClick={() => {
            setLoading(true);
            setPage((n) => n - 1);
          }}
        >
          Previous projects
        </button>
        <span>
          Page {page} of {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          disabled={disabled || loading || !!error || page >= totalPages}
          onClick={() => {
            setLoading(true);
            setPage((n) => n + 1);
          }}
        >
          Next projects
        </button>
      </div>
    </div>
  );
}
