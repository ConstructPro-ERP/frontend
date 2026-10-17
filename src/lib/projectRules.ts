import type {
  Project,
  ProjectStatus,
  CreateProjectInput,
} from "@/types/project";
export const projectTransitions: Record<
  ProjectStatus,
  readonly ProjectStatus[]
> = {
  PLANNING: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["ON_HOLD", "COMPLETED", "CANCELLED"],
  ON_HOLD: ["ACTIVE", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};
export const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
export const isPositiveMoney = (value: string) =>
  /^\d+(\.\d{1,2})?$/.test(value) &&
  Number.isFinite(Number(value)) &&
  Number(value) > 0;
export function projectPermissions(
  role?: string | null,
  userId?: string,
  project?: Project,
) {
  const admin = role === "ADMIN";
  const assigned =
    role === "PROJECT_MANAGER" &&
    !!userId &&
    project?.projectManagerId === userId;
  const open =
    !!project && !["COMPLETED", "CANCELLED"].includes(project.status);
  return {
    read:
      admin ||
      role === "ACCOUNTANT" ||
      (project ? assigned : role === "PROJECT_MANAGER"),
    create: admin,
    manage: open && (admin || assigned),
    assign: open && admin,
    delete: admin && project?.status === "PLANNING",
    expenseWrite: open && (admin || role === "ACCOUNTANT"),
    expenseDelete: open && admin,
  };
}
export function validateProject(
  input: Omit<CreateProjectInput, "projectManagerId"> & {
    projectManagerId?: string;
  },
  requireManager = true,
): string | null {
  if (!input.projectName.trim()) return "Project name is required.";
  if (!input.startDate || !Number.isFinite(Date.parse(input.startDate)))
    return "A valid start date is required.";
  if (
    input.endDate &&
    (!Number.isFinite(Date.parse(input.endDate)) ||
      input.endDate < input.startDate)
  )
    return "End date must be on or after the start date.";
  if (
    input.budget !== undefined &&
    (!Number.isFinite(input.budget) || input.budget < 0)
  )
    return "Budget must be zero or greater.";
  if (requireManager && !isUuid(input.projectManagerId ?? ""))
    return "Enter a valid project manager UUID.";
  return null;
}
