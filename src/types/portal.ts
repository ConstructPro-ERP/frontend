// Response shapes of the read-only /client-portal API (backend ADR-15).

export interface PortalProject {
  id: string;
  projectName: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  progressPercentage: number | null;
  createdAt: string;
}

export interface PortalMilestone {
  id: string;
  projectId: string;
  milestoneName: string;
  description: string | null;
  dueDate: string | null;
  weight: number;
  progressPercentage: number | null;
  status: string;
  completedAt: string | null;
}

export interface PortalQuotation {
  id: string;
  quotationDate: string | null;
  status: string;
  /** Money string with two decimals, e.g. "125000.00". */
  totalAmount: string;
  createdAt: string;
}

export interface PortalDocument {
  id: string;
  projectId: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  description: string | null;
  createdAt: string;
  category: { id: string; categoryName: string } | null;
}

export interface PortalPage<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
