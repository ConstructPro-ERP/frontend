/**
 * Shared TypeScript contracts for the Project Management module.
 * Keep these aligned with the backend Project model and DTOs.
 */

export const ProjectStatus = {
  PLANNING: "PLANNING",
  ACTIVE: "ACTIVE",
  ON_HOLD: "ON_HOLD",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];
export const PROJECT_STATUSES = Object.values(ProjectStatus);

export interface ProjectManagerSummary {
  id: string;
  fullName: string;
  email: string;
  status: string;
}

export interface ProjectQuotationSummary {
  id: string;
  leadId: string;
  status: string;
  // Prisma Decimal values are serialized as strings.
  totalAmount: string;
}

export interface Project {
  id: string;
  projectName: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  budget: number | null;
  projectManagerId: string;
  status: ProjectStatus;
  progressPercentage?: number | null;
  createdAt: string;
  updatedAt: string;
  projectManager: ProjectManagerSummary;
  quotations: ProjectQuotationSummary[];
}

export type ProjectSortField = "createdAt" | "projectName" | "startDate";

export interface ProjectListParams {
  search?: string;
  status?: ProjectStatus;
  projectManagerId?: string;
  page?: number;
  limit?: number;
  sortBy?: ProjectSortField;
  sortOrder?: "asc" | "desc";
}

export interface ProjectPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * This is the value inside the shared Axios client's
 * ApiResponse.data property for GET /projects.
 */
export interface ProjectListResult {
  data: Project[];
  meta: ProjectPaginationMeta;
}

export interface CreateProjectInput {
  projectName: string;
  location?: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  projectManagerId: string;
}
export type UpdateProjectInput = Partial<
  Omit<CreateProjectInput, "projectManagerId" | "endDate" | "budget">
> & {
  endDate?: string | null;
  budget?: number | null;
};
