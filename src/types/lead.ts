export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "CONVERTED"
  | "LOST";
export type LeadNote = {
  id: string;
  leadId: string;
  content: string;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
};
export type LeadContact = {
  id: string;
  leadId: string;
  label: string;
  value: string;
  createdAt: string;
  updatedAt: string;
};
export type LeadListQuery = {
  search?: string;
  status?: LeadStatus;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};
export type LeadMutationPayload = {
  customerName: string;
  phone?: string;
  email?: string;
  assignedToId?: string;
  status?: LeadStatus;
};
export type Lead = {
  id: string;
  customerName: string;
  phone: string | null;
  email: string | null;
  assignedToId: string | null;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: string; fullName: string; email: string } | null;
  notes: LeadNote[];
  contacts: LeadContact[];
  customer: { id: string; fullName: string } | null;
};
