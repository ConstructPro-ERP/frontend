export const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "COMPLETED",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export interface Task {
  id: string;
  projectId: string;
  taskName: string;
  description?: string | null;
  dueDate?: string | null;
  milestoneId?: string | null;
  milestone?: { id: string; milestoneName: string } | null;
  assignedToId?: string | null;
  assignedTo?: { fullName: string } | null;
  status: TaskStatus;
}
export interface TaskAssignee {
  id: string;
  fullName: string;
  email?: string;
}
export interface TaskInput {
  projectId: string;
  taskName: string;
  description?: string | null;
  dueDate?: string | null;
  milestoneId?: string | null;
  assignedToId?: string | null;
  status?: TaskStatus;
}
