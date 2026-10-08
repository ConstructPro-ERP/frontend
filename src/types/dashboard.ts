export interface DashboardRevenueKpisDto {
  totalRevenue: number;
  paidAmount: number;
  outstandingBalance: number;
  fromDate: string | null;
  toDate: string | null;
}

export interface DashboardProjectKpisDto {
  totalProjects: number;
  activeProjectCount: number;
  completedProjectCount: number;
  overdueProjectCount: number;
  completionRate: number;
  fromDate: string | null;
  toDate: string | null;
}

export interface DashboardInvoiceKpisDto {
  draftCount: number;
  issuedCount: number;
  partiallyPaidCount: number;
  paidCount: number;
  overdueCount: number;
  cancelledCount: number;
  totalInvoices: number;
  fromDate: string | null;
  toDate: string | null;
}

export interface DashboardSalesKpisDto {
  totalLeads: number;
  convertedLeads: number;
  leadConversionRate: number;
  quotationApprovalCount: number;
  rejectedQuotationCount: number;
  convertedQuotationCount: number;
  totalQuotations: number;
  fromDate: string | null;
  toDate: string | null;
}

export interface DashboardSummaryDto {
  revenue: DashboardRevenueKpisDto;
  projects: DashboardProjectKpisDto;
  invoices: DashboardInvoiceKpisDto;
  sales: DashboardSalesKpisDto;
}

export type DashboardProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export interface DashboardProject {
  projectId: string;
  projectName: string;
  status: DashboardProjectStatus;
  endDate: string | null;
  milestoneCount: number;
  completedMilestoneCount: number;
  completionPercentage: number;
}

export interface DashboardActivity {
  type: string;
  entityId: string;
  title: string;
  description: string;
  occurredAt: string;
  relatedProjectId: string | null;
  relatedProjectName: string | null;
}

export interface DashboardActivityPage {
  items: DashboardActivity[];
  page: number;
  totalPages: number;
}

export interface DashboardRevenueMonth {
  month: string;
  label: string;
  revenue: number;
  paid: number;
  outstanding: number;
}
