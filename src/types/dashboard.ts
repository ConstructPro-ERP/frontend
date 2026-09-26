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
