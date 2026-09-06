export type LeadStatus = "New" | "Contacted" | "Qualified" | "Converted" | "Lost";

export type LeadActivity = {
  id: string;
  kind: "call" | "email" | "note";
  description: string;
  occurredAt: string;
};

export type LeadContact = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
};

export type LeadListQuery = {
  search?: string;
  status?: LeadStatus;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type LeadMutationPayload = Record<string, unknown>;

export type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  source: string;
  projectType: string;
  projectSummary: string;
  bedrooms: string;
  budget: string;
  budgetValue: number;
  timeline: string;
  notes: string;
  status: LeadStatus;
  createdAtLabel: string;
  assignedTo: { name: string; role: string; initials: string };
  activities: LeadActivity[];
};
