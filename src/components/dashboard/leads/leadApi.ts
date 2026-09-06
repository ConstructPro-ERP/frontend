import apiClient from "@/lib/axios";
import type { Lead, LeadActivity, LeadContact, LeadListQuery, LeadMutationPayload, LeadStatus } from "@/types/lead";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord { return typeof value === "object" && value !== null ? value as UnknownRecord : {}; }
function text(source: UnknownRecord, keys: string[], fallback = "") { for (const key of keys) { const value = source[key]; if (typeof value === "string" && value.trim()) return value; } return fallback; }
function number(source: UnknownRecord, keys: string[], fallback = 0) { for (const key of keys) { const value = Number(source[key]); if (Number.isFinite(value)) return value; } return fallback; }
function nested(source: UnknownRecord, keys: string[]) { for (const key of keys) { const value = source[key]; if (typeof value === "object" && value !== null) return value as UnknownRecord; } return {}; }

export function normalizeLeadStatus(value: unknown): LeadStatus {
  const status = String(value ?? "").toLowerCase().replaceAll("_", " ");
  if (status.includes("contact")) return "Contacted";
  if (status.includes("qualif")) return "Qualified";
  if (status.includes("convert") || status.includes("won")) return "Converted";
  if (status.includes("lost") || status.includes("reject")) return "Lost";
  return "New";
}

function normalizeActivity(value: unknown, index: number): LeadActivity {
  const item = record(value); const rawKind = text(item, ["kind", "type"], "note").toLowerCase();
  return { id: text(item, ["id", "noteId", "note_id"], `activity-${index}`), kind: rawKind.includes("call") ? "call" : rawKind.includes("email") ? "email" : "note", description: text(item, ["description", "content", "note", "text"], "Lead activity recorded"), occurredAt: text(item, ["occurredAt", "createdAt", "created_at", "date"], "Recently") };
}

export function normalizeLead(payload: unknown, index = 0): Lead {
  const item = record(payload); const client = nested(item, ["client", "customer", "primaryContact", "primary_contact"]); const assignee = nested(item, ["assignedTo", "assigned_to", "salesManager", "sales_manager", "assignee"]);
  const firstName = text(item, ["firstName", "first_name"], text(client, ["firstName", "first_name"])); const lastName = text(item, ["lastName", "last_name"], text(client, ["lastName", "last_name"]));
  const name = text(item, ["name", "clientName", "client_name", "fullName", "full_name"], text(client, ["name", "fullName", "full_name"], `${firstName} ${lastName}`.trim() || "Unknown client"));
  const location = text(item, ["location", "city", "address"], text(client, ["location", "city", "address"], "Not specified"));
  const source = text(item, ["source", "leadSource", "lead_source"], "Not specified"); const projectType = text(item, ["projectType", "project_type", "propertyType", "property_type"], "General Construction");
  const budgetValue = number(item, ["budgetValue", "budget_value", "estimatedBudget", "estimated_budget", "budget"], 0); const rawActivities = item.activities ?? item.notes ?? [];
  const activities = Array.isArray(rawActivities) ? rawActivities.map(normalizeActivity) : [];
  const assigneeName = text(assignee, ["name", "fullName", "full_name"], "Unassigned");
  return { id: text(item, ["id", "leadId", "lead_id", "_id"], `lead-${index}`), name, phone: text(item, ["phone", "phoneNumber", "phone_number", "mobile"], text(client, ["phone", "phoneNumber", "phone_number", "mobile"])), email: text(item, ["email"], text(client, ["email"])), location, source, projectType, projectSummary: text(item, ["projectSummary", "project_summary"], `${projectType} · ${location} · ${source}`), bedrooms: text(item, ["bedrooms", "bedroomCount", "bedroom_count"], "—"), budget: text(item, ["budgetLabel", "budget_label", "budgetRange", "budget_range"], budgetValue ? `LKR ${budgetValue.toLocaleString("en-LK")}` : "Not specified"), budgetValue, timeline: text(item, ["timeline", "expectedTimeline", "expected_timeline", "startDate", "start_date"], "To be confirmed"), notes: text(item, ["notes", "description", "requirements"]), status: normalizeLeadStatus(item.status), createdAtLabel: text(item, ["createdAtLabel", "created_at_label", "createdAt", "created_at"], "Recently"), assignedTo: { name: assigneeName, role: text(assignee, ["role", "title"], "Sales Manager"), initials: text(assignee, ["initials"], assigneeName === "Unassigned" ? "—" : assigneeName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()) }, activities };
}

export function normalizeLeads(payload: unknown): Lead[] {
  const root = record(payload); const candidate = Array.isArray(payload) ? payload : root.items ?? root.leads ?? root.results ?? root.data ?? [];
  return Array.isArray(candidate) ? candidate.filter((item) => typeof item === "object" && item !== null).map(normalizeLead) : [];
}

export async function listLeads(query: LeadListQuery = {}) { const response = await apiClient.get<unknown>("/leads", { params: query }); return { leads: normalizeLeads(response.data), meta: response.meta }; }
export async function getLead(id: string) { const response = await apiClient.get<unknown>(`/leads/${id}`); return normalizeLead(response.data); }
export async function createLead(payload: LeadMutationPayload) { const response = await apiClient.post<unknown>("/leads", payload); return normalizeLead(response.data); }
export async function updateLead(id: string, payload: LeadMutationPayload) { const response = await apiClient.patch<unknown>(`/leads/${id}`, payload); return normalizeLead(response.data); }
export async function deleteLead(id: string) { return apiClient.del<unknown>(`/leads/${id}`); }
export async function assignLead(id: string, salesManagerId: string) { const response = await apiClient.patch<unknown>(`/leads/${id}/assign`, { salesManagerId }); return normalizeLead(response.data); }
export async function updateLeadStatus(id: string, status: LeadStatus) { const response = await apiClient.patch<unknown>(`/leads/${id}/status`, { status: status.toUpperCase() }); return normalizeLead(response.data); }
export async function addLeadNote(id: string, note: string) { return apiClient.post<unknown>(`/leads/${id}/notes`, { note }); }
export async function listLeadNotes(id: string) { const response = await apiClient.get<unknown>(`/leads/${id}/notes`); const root = record(response.data); const values = Array.isArray(response.data) ? response.data : root.items ?? root.notes ?? []; return Array.isArray(values) ? values.map(normalizeActivity) : []; }
export async function deleteLeadNote(id: string, noteId: string) { return apiClient.del<unknown>(`/leads/${id}/notes/${noteId}`); }
export async function addLeadContact(id: string, contact: Omit<LeadContact, "id">) { return apiClient.post<LeadContact>(`/leads/${id}/contacts`, contact); }
export async function updateLeadContact(id: string, contactId: string, contact: Partial<LeadContact>) { return apiClient.patch<LeadContact>(`/leads/${id}/contacts/${contactId}`, contact); }
export async function deleteLeadContact(id: string, contactId: string) { return apiClient.del<unknown>(`/leads/${id}/contacts/${contactId}`); }
