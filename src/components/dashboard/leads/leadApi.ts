import apiClient from "@/lib/axios";
import type {
  Lead,
  LeadNote,
  LeadContact,
  LeadListQuery,
  LeadMutationPayload,
  LeadStatus,
} from "@/types/lead";
type UnknownRecord = Record<string, unknown>;
export type LeadAssignee = { id: string; fullName: string; email: string };

export async function listLeadAssignees(): Promise<LeadAssignee[]> {
  const users = new Map<string, LeadAssignee>();
  let page = 1;
  let totalPages = 1;
  do {
    const response = await apiClient.get<unknown>("/users", {
      params: { page, limit: 100 },
    });
    let payload: unknown = response;
    let meta = response.meta;
    while (!Array.isArray(payload) && record(payload).data != null) {
      meta = (record(payload).meta as typeof meta) ?? meta;
      payload = record(payload).data;
    }
    const root = record(payload);
    meta = (root.meta as typeof meta) ?? meta;
    const items = Array.isArray(payload)
      ? payload
      : (root.items ?? root.users ?? root.results);
    if (!Array.isArray(items))
      throw new Error("The users response could not be read.");
    for (const value of items) {
      const user = record(value);
      const id = text(user.id);
      if (!id) continue;
      users.set(id, {
        id,
        fullName:
          text(user.fullName) ||
          text(user.name) ||
          [text(user.firstName), text(user.lastName)].filter(Boolean).join(" "),
        email: text(user.email),
      });
    }
    totalPages =
      meta?.totalPages ??
      (meta?.total ? Math.ceil(meta.total / (meta.limit || 100)) : 1);
    page += 1;
  } while (page <= totalPages);
  return [...users.values()];
}
function record(value: unknown): UnknownRecord {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : {};
}
function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}
function nullableText(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
function normalizeNote(value: unknown): LeadNote {
  const item = record(value);
  return {
    id: text(item.id),
    leadId: text(item.leadId),
    content: text(item.content),
    authorId: nullableText(item.authorId),
    createdAt: text(item.createdAt),
    updatedAt: text(item.updatedAt),
  };
}
export function normalizeLead(payload: unknown): Lead {
  const item = record(payload);
  const assignee = record(item.assignedTo);
  const customer = record(item.customer);
  return {
    id: text(item.id),
    customerName: text(item.customerName),
    phone: nullableText(item.phone),
    email: nullableText(item.email),
    assignedToId: nullableText(item.assignedToId),
    status: item.status as LeadStatus,
    createdAt: text(item.createdAt),
    updatedAt: text(item.updatedAt),
    assignedTo:
      item.assignedTo == null
        ? null
        : {
            id: text(assignee.id),
            fullName: text(assignee.fullName),
            email: text(assignee.email),
          },
    notes: Array.isArray(item.notes) ? item.notes.map(normalizeNote) : [],
    contacts: Array.isArray(item.contacts)
      ? item.contacts.map((value) => {
          const contact = record(value);
          return {
            id: text(contact.id),
            leadId: text(contact.leadId),
            label: text(contact.label),
            value: text(contact.value),
            createdAt: text(contact.createdAt),
            updatedAt: text(contact.updatedAt),
          };
        })
      : [],
    customer:
      item.customer == null
        ? null
        : { id: text(customer.id), fullName: text(customer.fullName) },
  };
}

export function normalizeLeads(payload: unknown): Lead[] {
  const root = record(payload);
  if (root.data && !Array.isArray(root.data)) return normalizeLeads(root.data);
  const candidate = Array.isArray(payload)
    ? payload
    : (root.items ?? root.leads ?? root.results ?? root.data ?? []);
  return Array.isArray(candidate)
    ? candidate
        .filter((item) => typeof item === "object" && item !== null)
        .map(normalizeLead)
    : [];
}

export async function listLeads(query: LeadListQuery = {}) {
  const response = await apiClient.get<unknown>("/leads", {
    params: { ...query, status: query.status?.toUpperCase() },
  });
  return {
    leads: normalizeLeads(response.data),
    meta: (record(response.data).meta as typeof response.meta) ?? response.meta,
  };
}
export async function getLead(id: string) {
  const response = await apiClient.get<unknown>(`/leads/${id}`);
  return normalizeLead(response.data);
}
export async function createLead(payload: LeadMutationPayload) {
  const response = await apiClient.post<unknown>("/leads", payload);
  return normalizeLead(response.data);
}
export async function updateLead(
  id: string,
  payload: Partial<LeadMutationPayload>,
) {
  const response = await apiClient.patch<unknown>(`/leads/${id}`, payload);
  return normalizeLead(response.data);
}
export async function deleteLead(id: string) {
  return apiClient.del<unknown>(`/leads/${id}`);
}
export async function assignLead(id: string, salesManagerId: string) {
  const response = await apiClient.patch<unknown>(`/leads/${id}/assign`, {
    assignedToId: salesManagerId,
  });
  return normalizeLead(response.data);
}
export async function updateLeadStatus(id: string, status: LeadStatus) {
  const response = await apiClient.patch<unknown>(`/leads/${id}/status`, {
    status: status.toUpperCase(),
  });
  return normalizeLead(response.data);
}
export async function addLeadNote(id: string, note: string) {
  return apiClient.post<unknown>(`/leads/${id}/notes`, { content: note });
}
export async function listLeadNotes(id: string) {
  const response = await apiClient.get<unknown>(`/leads/${id}/notes`);
  const root = record(response.data);
  const values = Array.isArray(response.data)
    ? response.data
    : (root.data ?? root.items ?? root.notes ?? []);
  return Array.isArray(values) ? values.map(normalizeNote) : [];
}
export async function deleteLeadNote(id: string, noteId: string) {
  return apiClient.del<unknown>(`/leads/${id}/notes/${noteId}`);
}
export async function addLeadContact(
  id: string,
  contact: Pick<LeadContact, "label" | "value">,
) {
  return apiClient.post<LeadContact>(`/leads/${id}/contacts`, contact);
}
export async function updateLeadContact(
  id: string,
  contactId: string,
  contact: Pick<LeadContact, "label" | "value">,
) {
  return apiClient.patch<LeadContact>(
    `/leads/${id}/contacts/${contactId}`,
    contact,
  );
}
export async function deleteLeadContact(id: string, contactId: string) {
  return apiClient.del<unknown>(`/leads/${id}/contacts/${contactId}`);
}
