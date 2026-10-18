export const MILESTONE_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
] as const;

export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

/**
 * Milestone contract returned by the Project Service.
 * Progress is stored as progressPercentage, not progress.
 */
export interface Milestone {
  id: string;
  projectId: string;
  milestoneName: string;
  description?: string | null;
  dueDate?: string | null;
  weight: number;
  progressPercentage: number;
  status: MilestoneStatus;
  isDelayed?: boolean;
  createdAt?: string;
}

/** Metadata fields used when creating or editing milestones. */
export interface MilestoneInput {
  milestoneName: string;
  description?: string | null;
  dueDate?: string | null;
  weight: number;
}

export interface MilestoneProgressInput {
  progressPercentage: number;
  status?: MilestoneStatus;
}
