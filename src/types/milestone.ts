export const MILESTONE_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];
// Extended fields follow the PMM contract; older services may omit them.
export interface Milestone {
  id: string;
  projectId: string;
  milestoneName: string;
  description?: string | null;
  dueDate?: string | null;
  weight?: number;
  progress?: number;
  status: MilestoneStatus;
}
export interface MilestoneInput {
  milestoneName: string;
  description?: string;
  dueDate?: string | null;
  weight: number;
  status: MilestoneStatus;
}
