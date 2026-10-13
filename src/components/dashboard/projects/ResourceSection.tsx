"use client";
import { useCallback, useState, type ReactNode } from "react";
import { Plus, RefreshCw } from "lucide-react";
import type { ResourcePage, ResourceQuery } from "@/services/projectResources";
import {
  Editor,
  Empty,
  Notice,
  Pager,
  buttonClass,
  primaryClass,
  panelClass,
  inputClass,
  type Field,
} from "./ProjectUI";
import { useProjectData } from "./useProjectData";

export interface ResourceAction<T> {
  label: string;
  title: string;
  fields: Field[];
  initial: (item: T) => Record<string, string>;
  validate?: (values: Record<string, string>) => string | null;
  save: (item: T, values: Record<string, string>) => Promise<unknown>;
}
type ResourceModal<T> =
  | { kind: "new" }
  | { kind: "edit" | "delete"; item: T }
  | { kind: "action"; item: T; action: ResourceAction<T> };
export default function ResourceSection<T extends { id: string }>({
  title,
  singular,
  description,
  canWrite,
  canDelete,
  load,
  create,
  update,
  remove,
  fields,
  initial,
  validate,
  columns,
  actions = [],
  filters = [],
  onChanged,
  deleteDescription,
  validateFilters,
  onRefresh,
  editorDisabled = false,
}: {
  title: string;
  singular: string;
  description: string;
  canWrite: boolean;
  canDelete: boolean;
  load: (query: ResourceQuery) => Promise<ResourcePage<T>>;
  create: (values: Record<string, string>) => Promise<unknown>;
  update: (item: T, values: Record<string, string>) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
  fields: Field[];
  initial: (item?: T) => Record<string, string>;
  validate?: (values: Record<string, string>) => string | null;
  columns: { label: string; render: (item: T) => ReactNode }[];
  actions?: ResourceAction<T>[];
  filters?: Field[];
  onChanged?: () => void;
  deleteDescription?: string;
  validateFilters?: (values: Record<string, string>) => string | null;
  onRefresh?: () => void;
  editorDisabled?: boolean;
}) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState<ResourceQuery>({});
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [revision, setRevision] = useState(0);
  const [success, setSuccess] = useState("");
  const [filterError, setFilterError] = useState("");
  const [modal, setModal] = useState<ResourceModal<T> | null>(null);
  const loader = useCallback(
    () => load({ ...query, page, limit: 10 }),
    [load, query, page],
  );
  const { data, error, loading } = useProjectData(loader, revision);
  function changed(message: string) {
    setSuccess(message);
    setRevision((v) => v + 1);
    onChanged?.();
  }
  function refresh() {
    setRevision((v) => v + 1);
    onRefresh?.();
  }
  const filterId = title.toLowerCase();
  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="mt-1 text-sm text-on-surface-muted">{description}</p>
        </div>
        <div className="flex gap-2">
          <button
            className={buttonClass}
            aria-label={`Refresh ${title.toLowerCase()}`}
            disabled={loading}
            onClick={refresh}
          >
            <RefreshCw size={16} />
          </button>
          {canWrite && !error && !loading && (
            <button
              className={primaryClass}
              disabled={editorDisabled}
              onClick={() => setModal({ kind: "new" })}
            >
              <Plus size={16} />
              Add {singular}
            </button>
          )}
        </div>
      </header>
      {success && <Notice>{success}</Notice>}
      {!!filters.length && (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const error = validateFilters?.(filterValues);
            setFilterError(error ?? "");
            if (error) return;
            setQuery(
              Object.fromEntries(
                Object.entries(filterValues).map(([key, value]) => [
                  key,
                  value.trim() || undefined,
                ]),
              ),
            );
            setPage(1);
          }}
        >
          {filters.map((field) => (
            <label
              key={field.name}
              htmlFor={filterId + field.name}
              className="min-w-40 flex-1 text-xs font-semibold"
            >
              {field.label}
              {field.type === "select" ? (
                <select
                  id={filterId + field.name}
                  className={inputClass + " mt-2"}
                  disabled={field.disabled}
                  value={filterValues[field.name] ?? ""}
                  onChange={(e) =>
                    setFilterValues({
                      ...filterValues,
                      [field.name]: e.target.value,
                    })
                  }
                >
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={filterId + field.name}
                  className={inputClass + " mt-2"}
                  type={field.type ?? "text"}
                  value={filterValues[field.name] ?? ""}
                  onChange={(e) =>
                    setFilterValues({
                      ...filterValues,
                      [field.name]: e.target.value,
                    })
                  }
                />
              )}
            </label>
          ))}
          <button className={buttonClass}>Apply filters</button>
          <button
            className={buttonClass}
            type="button"
            onClick={() => {
              setFilterValues({});
              setFilterError("");
              setQuery({});
              setPage(1);
            }}
          >
            Clear
          </button>
        </form>
      )}
      {filterError && <Notice error>{filterError}</Notice>}
      <div className={panelClass + " overflow-hidden"}>
        {loading ? (
          <p role="status" className="p-8">
            Loading {title.toLowerCase()}…
          </p>
        ) : error ? (
          <div className="space-y-3 p-5">
            <Notice error>{error}</Notice>
            <button className={buttonClass} onClick={refresh}>
              Try again
            </button>
          </div>
        ) : !data?.data.length ? (
          <Empty
            title={`No ${title.toLowerCase()} found`}
            description={
              canWrite
                ? `Add a ${singular} or adjust your filters to get started.`
                : "There are no records for the selected filters."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">{title}</caption>
              <thead className="bg-surface-container text-xs text-on-surface-muted">
                <tr>
                  {columns.map((column) => (
                    <th scope="col" key={column.label} className="px-4 py-3">
                      {column.label}
                    </th>
                  ))}
                  {(canWrite || canDelete) && (
                    <th scope="col" className="px-4 py-3">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.data.map((item) => (
                  <tr key={item.id} className="border-t border-outline-variant">
                    {columns.map((column) => (
                      <td key={column.label} className="px-4 py-4 align-top">
                        {column.render(item)}
                      </td>
                    ))}
                    {(canWrite || canDelete) && (
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {canWrite && (
                            <>
                              <button
                                className={buttonClass}
                                disabled={editorDisabled}
                                aria-label={`Edit ${singular}`}
                                onClick={() => setModal({ kind: "edit", item })}
                              >
                                Edit
                              </button>
                              {actions.map((action) => (
                                <button
                                  key={action.label}
                                  className={buttonClass}
                                  disabled={editorDisabled}
                                  onClick={() =>
                                    setModal({ kind: "action", item, action })
                                  }
                                >
                                  {action.label}
                                </button>
                              ))}
                            </>
                          )}
                          {canDelete && (
                            <button
                              className={buttonClass + " text-error"}
                              onClick={() => setModal({ kind: "delete", item })}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && !error && !loading && (
          <Pager
            page={page}
            total={data.meta.total}
            totalPages={data.meta.totalPages}
            onChange={setPage}
          />
        )}
      </div>
      {modal && (modal.kind === "delete" ? canDelete : canWrite) && (
        <Editor
          submitDisabled={modal.kind !== "delete" && editorDisabled}
          title={
            modal.kind === "delete"
              ? `Delete ${singular}?`
              : modal.kind === "action"
                ? modal.action.title
                : `${modal.kind === "new" ? "Add" : "Edit"} ${singular}`
          }
          fields={
            modal.kind === "delete"
              ? []
              : modal.kind === "action"
                ? modal.action.fields
                : fields
          }
          initial={
            modal.kind === "action"
              ? modal.action.initial(modal.item)
              : initial(modal.kind === "new" ? undefined : modal.item)
          }
          validate={
            modal.kind === "delete"
              ? undefined
              : modal.kind === "action"
                ? modal.action.validate
                : validate
          }
          description={
            modal.kind === "delete"
              ? (deleteDescription ??
                "This record will be permanently deleted. This cannot be undone.")
              : undefined
          }
          submitLabel={
            modal.kind === "delete" ? "Delete permanently" : "Save changes"
          }
          onClose={() => setModal(null)}
          onSave={async (values) => {
            if (modal.kind === "delete") {
              await remove(modal.item.id);
              if (data?.data.length === 1 && page > 1) setPage(page - 1);
            } else if (modal.kind === "action")
              await modal.action.save(modal.item, values);
            else if (modal.kind === "new") {
              await create(values);
              setPage(1);
            }
            else await update(modal.item, values);
            changed(
              `${singular.charAt(0).toUpperCase() + singular.slice(1)} ${modal.kind === "delete" ? "deleted" : "saved"} successfully.`,
            );
          }}
        />
      )}
    </section>
  );
}
