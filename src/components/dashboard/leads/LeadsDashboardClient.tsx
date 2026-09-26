"use client";

import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  canCaptureLead,
  canUpdateLead,
  canDeleteLead,
} from "./leadPermissions";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Clock3,
  Filter,
  MessageSquareText,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  createLead as createLeadRequest,
  deleteLead as deleteLeadRequest,
  getLead,
  listLeads,
  listLeadAssignees,
  type LeadAssignee,
  updateLeadStatus,
  updateLead,
} from "./leadApi";
import type { Lead, LeadMutationPayload, LeadStatus } from "@/types/lead";

const statuses: ("All Leads" | LeadStatus)[] = [
  "All Leads",
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CONVERTED",
  "LOST",
];
const avatarStyles = [
  "border-blue-200 text-blue-700",
  "border-emerald-200 text-emerald-700",
  "border-violet-200 text-violet-700",
  "border-amber-200 text-amber-700",
  "border-red-200 text-red-700",
  "border-cyan-200 text-cyan-700",
  "border-slate-200 text-slate-600",
];
const fieldClass =
  "mt-1.5 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";

function formatDate(value: string) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const styles: Record<LeadStatus, string> = {
    NEW: "border-outline-variant bg-surface-container text-on-surface-variant",
    CONTACTED: "border-amber-200 bg-risk-medium-container text-amber-700",
    QUALIFIED: "border-blue-200 bg-primary-soft text-primary",
    CONVERTED: "border-emerald-200 bg-risk-low-container text-emerald-700",
    LOST: "border-error-outline bg-error-container text-error",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function MetricCard({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Users;
  value: string;
  label: string;
  tone: string;
}) {
  return (
    <article className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3.5 shadow-level-1">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}
      >
        <Icon size={19} />
      </div>
      <div>
        <p className="font-mono text-xl font-bold">{value}</p>
        <p className="text-[11.5px] text-on-surface-muted">{label}</p>
      </div>
    </article>
  );
}

function LeadModal({
  onClose,
  onCreate,
  lead,
  onUpdate,
}: {
  onClose: () => void;
  onCreate?: (lead: LeadMutationPayload) => Promise<void>;
  lead?: Lead;
  onUpdate?: (payload: Partial<LeadMutationPayload>) => Promise<void>;
}) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [assignees, setAssignees] = useState<LeadAssignee[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [usersAttempt, setUsersAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    listLeadAssignees()
      .then((users) => {
        if (active) setAssignees(users);
      })
      .catch((error: unknown) => {
        if (active)
          setUsersError(
            error instanceof Error
              ? error.message
              : "Users could not be loaded.",
          );
      })
      .finally(() => {
        if (active) setUsersLoading(false);
      });
    return () => {
      active = false;
    };
  }, [usersAttempt]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("customerName") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const assignedToId = String(data.get("assignedToId") ?? "");
    const status = String(data.get("status") ?? "NEW") as LeadStatus;
    if (!name) {
      setError("Customer name is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      if (lead && onUpdate) {
        const changes: Partial<LeadMutationPayload> = {};
        if (name !== lead.customerName) changes.customerName = name;
        if (phone !== (lead.phone ?? "")) changes.phone = phone;
        if (email !== (lead.email ?? "")) {
          if (!email)
            throw new Error(
              "Enter a valid email. This update form cannot clear an existing email.",
            );
          changes.email = email;
        }
        if (
          data.has("assignedToId") &&
          assignedToId !== (lead.assignedToId ?? "")
        ) {
          if (!assignedToId)
            throw new Error(
              "Select a user. This update form cannot remove an existing assignment.",
            );
          changes.assignedToId = assignedToId;
        }
        if (status !== lead.status) changes.status = status;
        if (!Object.keys(changes).length) {
          onClose();
          return;
        }
        await onUpdate(changes);
      } else if (onCreate)
        await onCreate({
          customerName: name,
          ...(phone ? { phone } : {}),
          ...(email ? { email } : {}),
          ...(assignedToId ? { assignedToId } : {}),
          status,
        });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The lead could not be saved.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="capture-lead-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-outline-variant bg-white shadow-level-2"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant bg-white px-5 py-4">
          <div>
            <h2 id="capture-lead-title" className="text-lg font-bold">
              {lead ? "Update lead" : "Capture a new lead"}
            </h2>
            <p className="text-xs text-on-surface-muted">
              Add the customer name and contact information.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close dialog"
            className="rounded-lg p-2 hover:bg-surface-container"
          >
            <X size={18} />
          </button>
        </div>
        <fieldset
          disabled={submitting}
          className="grid gap-4 p-5 sm:grid-cols-2"
        >
          <label className="text-xs font-semibold">
            Customer name *
            <input
              name="customerName"
              defaultValue={lead?.customerName ?? ""}
              required
              className={fieldClass}
              placeholder="e.g. Kamal Perera"
              autoFocus
            />
          </label>
          <label className="text-xs font-semibold">
            Phone number
            <input
              name="phone"
              defaultValue={lead?.phone ?? ""}
              type="tel"
              className={fieldClass}
              placeholder="+94 77 123 4567"
            />
          </label>
          <label className="text-xs font-semibold">
            Email
            <input
              name="email"
              defaultValue={lead?.email ?? ""}
              type="email"
              className={fieldClass}
              placeholder="client@email.com"
            />
          </label>
          <div>
            <label className="text-xs font-semibold">
              Assigned to (optional)
              <select
                name="assignedToId"
                className={fieldClass}
                defaultValue={lead?.assignedToId ?? ""}
                disabled={usersLoading || !!usersError || submitting}
                aria-describedby="lead-assignee-help"
              >
                <option value="" disabled={!!lead?.assignedToId}>
                  {usersLoading ? "Loading users..." : "Unassigned"}
                </option>
                {lead?.assignedToId &&
                !assignees.some((user) => user.id === lead.assignedToId) ? (
                  <option value={lead.assignedToId}>
                    {lead.assignedTo?.fullName ||
                      lead.assignedTo?.email ||
                      "Current assignee"}
                  </option>
                ) : null}
                {assignees.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName || user.email || user.id}
                    {user.fullName && user.email ? ` (${user.email})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <p
              id="lead-assignee-help"
              className="mt-1.5 text-xs text-on-surface-muted"
            >
              {usersError
                ? "Users could not be loaded. Retry to change assignment."
                : !usersLoading && !assignees.length
                  ? "No users available. You can leave the lead unassigned."
                  : "Select the sales manager responsible for this lead."}
            </p>
            {usersError ? (
              <div role="alert" className="mt-1.5 text-xs text-error">
                {usersError}{" "}
                <button
                  type="button"
                  className="font-semibold underline"
                  onClick={() => {
                    setUsersError("");
                    setUsersLoading(true);
                    setUsersAttempt((attempt) => attempt + 1);
                  }}
                >
                  Retry
                </button>
              </div>
            ) : null}
          </div>
          <label className="text-xs font-semibold">
            Status
            <select
              name="status"
              defaultValue={lead?.status ?? "NEW"}
              className={fieldClass}
            >
              {statuses
                .filter((status) => status !== "All Leads")
                .map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
            </select>
          </label>
          {error ? (
            <p className="text-sm text-error sm:col-span-2" role="alert">
              {error}
            </p>
          ) : null}
        </fieldset>
        <div className="flex justify-end gap-2 border-t border-outline-variant px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold hover:bg-surface-container"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {submitting ? (
              <RefreshCcw size={15} className="animate-spin" />
            ) : (
              <Plus size={15} />
            )}
            {submitting ? "Saving..." : lead ? "Save changes" : "Capture Lead"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-on-surface-muted">{label}</p>
      <p
        className={`mt-0.5 break-words text-xs font-medium ${accent ? "font-mono text-primary" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function DetailPanel({
  lead,
  onStatusChange,
  onEdit,
  canEdit,
  canDelete,
  deleting,
  onDelete,
}: {
  lead: Lead;
  onStatusChange: (status: LeadStatus) => void;
  onEdit: () => void;
  canEdit: boolean;
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <aside className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-level-1">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 to-slate-900 p-5 text-white">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-200 bg-white text-base font-bold text-blue-700">
          {initials(lead.customerName)}
        </div>
        <h2 className="mt-2.5 text-base font-bold">{lead.customerName}</h2>
        <div className="mt-3 flex gap-2">
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
            {lead.status}
          </span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
            {lead.customer?.fullName || "No linked customer"}
          </span>
        </div>
      </div>
      <div className="divide-y divide-outline-variant">
        <section className="p-5">
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[.08em] text-on-surface-muted">
            Contact information
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone" value={lead.phone || "Not provided"} />
            <Field label="Email" value={lead.email || "—"} />
            <Field label="Customer name" value={lead.customerName} />
            <Field label="Created" value={formatDate(lead.createdAt)} />
            <Field label="Updated" value={formatDate(lead.updatedAt)} />
            <Field
              label="Customer"
              value={lead.customer?.fullName || "No linked customer"}
            />
          </div>
        </section>
        <section className="p-5">
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[.08em] text-on-surface-muted">
            Additional contacts
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {lead.contacts?.map((contact) => (
              <Field
                key={contact.id}
                label={contact.label}
                value={contact.value}
              />
            ))}
          </div>
          {!lead.contacts?.length ? (
            <p className="text-xs text-on-surface-muted">
              No additional contacts.
            </p>
          ) : null}
        </section>
        <section className="p-5">
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[.08em] text-on-surface-muted">
            Notes
          </h3>
          <div className="space-y-4">
            {!lead.notes.length ? (
              <p className="text-xs text-on-surface-muted">
                No notes recorded.
              </p>
            ) : null}
            {lead.notes.map((activity) => {
              return (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <MessageSquareText size={13} />
                  </div>
                  <div>
                    <p className="text-xs font-medium leading-5">
                      {activity.content}
                    </p>
                    <p className="text-[11px] text-on-surface-muted">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section className="p-5">
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[.08em] text-on-surface-muted">
            Assigned to
          </h3>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-[11px] font-bold text-white">
              {initials(lead.assignedTo?.fullName || "")}
            </div>
            <div>
              <p className="text-xs font-semibold">
                {lead.assignedTo?.fullName || "Unassigned"}
              </p>
              <p className="text-[11px] text-on-surface-muted">
                {lead.assignedTo?.email || ""}
              </p>
            </div>
          </div>
        </section>
      </div>
      <div className="flex gap-2 border-t border-outline-variant p-4">
        {canEdit ? (
          <button
            type="button"
            onClick={onEdit}
            disabled={deleting}
            className="rounded-lg border border-outline-variant px-3 py-2 text-xs font-semibold hover:bg-surface-container"
          >
            Edit lead
          </button>
        ) : null}
        {lead.phone ? (
          <a
            href={`tel:${lead.phone}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-xs font-semibold hover:bg-surface-container"
          >
            <Phone size={14} />
            Call
          </a>
        ) : null}
        {canEdit ? (
          <select
            value={lead.status}
            onChange={(event) =>
              onStatusChange(event.target.value as LeadStatus)
            }
            aria-label="Update lead status"
            disabled={deleting}
            className="min-w-0 flex-1 rounded-lg bg-primary px-2 py-2 text-xs font-semibold text-white outline-none"
          >
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </select>
        ) : null}
      </div>
      {canDelete ? (
        <div className="border-t border-outline-variant px-4 py-3">
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="w-full rounded-lg border border-error-outline px-3 py-2 text-xs font-semibold text-error hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Deleting lead..." : "Delete lead"}
          </button>
        </div>
      ) : null}
    </aside>
  );
}

export default function LeadsDashboardClient() {
  const user = useSelector((state: RootState) => state.auth.user);
  const canCapture = canCaptureLead(user);
  const canEdit = canUpdateLead(user);
  const canDelete = canDeleteLead(user);
  const [deleting, setDeleting] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const deleteInProgress = useRef(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [activeStatus, setActiveStatus] =
    useState<(typeof statuses)[number]>("All Leads");
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    let active = true;
    listLeads({ page: 1, limit: 100, sortBy: "createdAt", sortOrder: "desc" })
      .then(({ leads: liveLeads }) => {
        if (!active) return;
        setLeads(liveLeads);
        setSelectedId(liveLeads[0]?.id ?? "");
      })
      .catch((error) => {
        if (active)
          setFeedback(
            error instanceof Error
              ? error.message
              : "Leads could not be loaded.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const filtered = useMemo(
    () =>
      leads.filter(
        (lead) =>
          (activeStatus === "All Leads" || lead.status === activeStatus) &&
          `${lead.customerName} ${lead.email} ${lead.phone}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [leads, activeStatus, query],
  );
  const selected =
    filtered.find((lead) => lead.id === selectedId) ?? filtered[0] ?? null;
  const removeLead = async () => {
    if (!canDelete || !leadToDelete || deleteInProgress.current) return;
    const lead = leadToDelete;
    deleteInProgress.current = true;
    setDeleting(true);
    setDeleteError("");
    setFeedback("");
    try {
      await deleteLeadRequest(lead.id);
      setLeads((items) => items.filter((item) => item.id !== lead.id));
      setSelectedId((id) => (id === lead.id ? "" : id));
      setEditingLead((item) => (item?.id === lead.id ? null : item));
      setFeedback("Lead deleted successfully.");
      setLeadToDelete(null);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "The lead could not be deleted.",
      );
    } finally {
      deleteInProgress.current = false;
      setDeleting(false);
    }
  };
  const converted = leads.filter((lead) => lead.status === "CONVERTED").length;
  const followUp = leads.filter(
    (lead) => lead.status === "CONTACTED" || lead.status === "QUALIFIED",
  ).length;
  const selectLead = async (id: string) => {
    setSelectedId(id);
    try {
      const detail = await getLead(id);
      setLeads((items) =>
        items.map((lead) => (lead.id === id ? detail : lead)),
      );
    } catch {
      setFeedback(
        "Lead details could not be refreshed. Showing the available list data.",
      );
    }
  };
  const updateStatus = async (status: LeadStatus) => {
    if (!selected || !canEdit) return;
    const previous = selected.status;
    setLeads((items) =>
      items.map((lead) =>
        lead.id === selected.id ? { ...lead, status } : lead,
      ),
    );
    try {
      const updated = await updateLeadStatus(selected.id, status);
      setLeads((items) =>
        items.map((lead) =>
          lead.id === selected.id ? { ...lead, ...updated } : lead,
        ),
      );
      setFeedback("Lead status updated successfully.");
    } catch (error) {
      setLeads((items) =>
        items.map((lead) =>
          lead.id === selected.id ? { ...lead, status: previous } : lead,
        ),
      );
      setFeedback(
        error instanceof Error
          ? error.message
          : "The lead status could not be updated.",
      );
    }
  };
  const createLead = async (payload: LeadMutationPayload) => {
    if (!canCapture)
      throw new Error("Only Admin or Sales Manager users can capture leads.");
    const created = await createLeadRequest(payload);
    setLeads((items) => [created, ...items]);
    setFeedback("Lead created successfully.");
    setSelectedId(created.id);
    setActiveStatus("All Leads");
    setShowModal(false);
  };
  const saveLead = async (payload: Partial<LeadMutationPayload>) => {
    if (!canEdit) throw new Error("Only top management can update leads.");
    if (!editingLead) return;
    const updated = await updateLead(editingLead.id, payload);
    setLeads((items) =>
      items.map((item) => (item.id === editingLead.id ? updated : item)),
    );
    setSelectedId(updated.id);
    setActiveStatus("All Leads");
    setQuery("");
    setEditingLead(null);
    setFeedback("Lead updated successfully.");
  };
  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-3 text-xs text-on-surface-variant">
          <RefreshCcw size={14} className="animate-spin" />
          Loading leads from the backend...
        </div>
      ) : null}
      {feedback ? (
        <button
          type="button"
          onClick={() => setFeedback("")}
          className="w-full rounded-lg border border-blue-200 bg-primary-soft px-4 py-3 text-left text-xs text-primary"
        >
          {feedback} <span className="float-right">Dismiss</span>
        </button>
      ) : null}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          value={String(leads.length)}
          label="Total Leads"
          tone="bg-primary-soft text-primary"
        />
        <MetricCard
          icon={Clock3}
          value={String(followUp)}
          label="Contacted / Qualified"
          tone="bg-risk-medium-container text-amber-600"
        />
        <MetricCard
          icon={Check}
          value={String(converted)}
          label="CONVERTED"
          tone="bg-risk-low-container text-emerald-600"
        />
        <MetricCard
          icon={UserRound}
          value={String(leads.filter((lead) => lead.status === "NEW").length)}
          label="New Leads"
          tone="bg-violet-50 text-violet-600"
        />
      </section>
      <section className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex overflow-x-auto rounded-lg border border-outline-variant bg-white">
          {statuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setActiveStatus(status)}
              className={`shrink-0 px-3.5 py-2 text-xs font-medium ${activeStatus === status ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-container"}`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2 xl:justify-end">
          <label className="flex h-9 min-w-[190px] flex-1 items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 xl:max-w-[260px]">
            <Search size={14} className="text-on-surface-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search leads..."
              className="w-full bg-transparent text-xs outline-none"
            />
          </label>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
          >
            <Filter size={14} />
            Filter
          </button>
          {canCapture ? (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-hover"
            >
              <Plus size={15} />
              Capture Lead
            </button>
          ) : null}
        </div>
      </section>
      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-level-1">
          <div className="border-b border-outline-variant bg-surface-container px-5 py-3 text-[10px] font-bold uppercase tracking-[.08em] text-on-surface-muted">
            Customer name & details{" "}
            <span className="font-normal normal-case tracking-normal">
              ({filtered.length})
            </span>
          </div>
          {filtered.length ? (
            filtered.map((lead, index) => (
              <button
                type="button"
                key={lead.id}
                onClick={() => selectLead(lead.id)}
                className={`flex w-full items-center gap-3 border-b border-outline-variant px-4 py-3 text-left last:border-b-0 hover:bg-surface-container ${selected?.id === lead.id ? "border-l-[3px] border-l-primary bg-primary-soft" : "border-l-[3px] border-l-transparent"}`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white text-xs font-bold ${avatarStyles[index % avatarStyles.length]}`}
                >
                  {initials(lead.customerName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold">
                    {lead.customerName}
                  </p>
                  <p className="mt-0.5 truncate text-[11.5px] text-on-surface-muted">
                    {[lead.phone, lead.email].filter(Boolean).join(" | ") ||
                      "No contact information"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="mb-1.5 text-[10.5px] text-on-surface-muted">
                    {formatDate(lead.createdAt)}
                  </p>
                  <StatusBadge status={lead.status} />
                </div>
              </button>
            ))
          ) : (
            <div className="px-6 py-16 text-center">
              <UserRound className="mx-auto text-on-surface-subtle" size={30} />
              <p className="mt-3 text-sm font-semibold">No leads found</p>
              <p className="mt-1 text-xs text-on-surface-muted">
                Try another search or status filter.
              </p>
            </div>
          )}
        </div>
        {selected ? (
          <DetailPanel
            lead={selected}
            onStatusChange={updateStatus}
            canEdit={canEdit}
            canDelete={canDelete}
            deleting={deleting}
            onDelete={() => {
              setDeleteError("");
              setLeadToDelete(selected);
            }}
            onEdit={() => setEditingLead(selected)}
          />
        ) : null}
      </section>
      {leadToDelete && canDelete ? (
        <ConfirmDialog
          title="Delete lead?"
          message={`Delete lead "${leadToDelete.customerName}"? This cannot be undone.`}
          confirmLabel="Delete lead"
          pending={deleting}
          error={deleteError}
          onConfirm={removeLead}
          onCancel={() => {
            if (!deleteInProgress.current) setLeadToDelete(null);
          }}
        />
      ) : null}
      {showModal && canCapture ? (
        <LeadModal onClose={() => setShowModal(false)} onCreate={createLead} />
      ) : null}
      {editingLead && canEdit ? (
        <LeadModal
          key={editingLead.id}
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onUpdate={saveLead}
        />
      ) : null}
    </div>
  );
}
