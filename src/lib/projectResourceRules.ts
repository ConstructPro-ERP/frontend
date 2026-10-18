import { isPositiveMoney, isUuid } from "./projectRules";
import { MILESTONE_STATUSES } from "@/types/milestone";
import { TASK_STATUSES } from "@/types/task";

export type FormValues = Record<string, string>;

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T00:00:00.000Z");
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function validateName(value: string | undefined, name: string) {
  if (!value?.trim()) return `${name} is required.`;
  return value.trim().length > 200
    ? `${name} must be 200 characters or fewer.`
    : null;
}

function validateDescription(value: string | undefined) {
  return (value?.length ?? 0) > 2000
    ? "Description must be 2,000 characters or fewer."
    : null;
}

export function validateMilestone(values: FormValues): string | null {
  const nameError = validateName(values.milestoneName, "Milestone name");
  if (nameError) return nameError;
  if (values.dueDate && !isCalendarDate(values.dueDate))
    return "Enter a valid due date.";
  const weight = Number(values.weight);
  if (
    !values.weight?.trim() ||
    !Number.isInteger(weight) ||
    weight < 1 ||
    weight > 10
  )
    return "Weight must be an integer between 1 and 10.";
  if (!MILESTONE_STATUSES.some((status) => status === values.status))
    return "Select a valid milestone status.";
  return validateDescription(values.description);
}

export function validateMilestoneProgress(values: FormValues): string | null {
  const progress = Number(values.progress);
  return !values.progress?.trim() ||
    !Number.isInteger(progress) ||
    progress < 0 ||
    progress > 100
    ? "Progress must be a whole number between 0 and 100."
    : null;
}

export function validateTask(values: FormValues): string | null {
  const nameError = validateName(values.taskName, "Task name");
  if (nameError) return nameError;
  if (values.dueDate && !isCalendarDate(values.dueDate))
    return "Enter a valid due date.";
  if (values.milestoneId && !isUuid(values.milestoneId))
    return "Select a valid milestone.";
  if (values.assignedToId && !isUuid(values.assignedToId))
    return "Select a valid team member.";
  if (values.status !== undefined && validateTaskStatus(values))
    return "Select a valid task status.";
  return validateDescription(values.description);
}

export function validateTaskStatus(values: FormValues): string | null {
  return TASK_STATUSES.some((status) => status === values.status)
    ? null
    : "Select a valid task status.";
}

export function validateExpense(values: FormValues): string | null {
  if (!isPositiveMoney(values.amount?.trim() ?? ""))
    return "Enter a positive amount with up to two decimal places.";
  const categoryError = validateName(values.category, "Category");
  if (categoryError) return categoryError;
  if (!isCalendarDate(values.date ?? "")) return "Enter a valid expense date.";
  return validateDescription(values.description);
}

export function validateDateFilters(values: FormValues): string | null {
  for (const field of ["startDate", "endDate"]) {
    if (values[field] && !isCalendarDate(values[field]))
      return "Enter valid filter dates.";
  }
  return values.startDate && values.endDate && values.startDate > values.endDate
    ? "From date must be on or before To date."
    : null;
}
