import { isUuid } from "./projectRules";
import { TASK_STATUSES } from "@/types/task";

export type FormValues = Record<string, string>;

// Mirrors the backend's positive Decimal(12,2) expense amount constraint.
// Keep this specific to expenses rather than altering shared money helpers.
const EXPENSE_AMOUNT_PATTERN =
  /^(?!0(?:\.0{1,2})?$)(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;

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

  if (values.dueDate && !isCalendarDate(values.dueDate)) {
    return "Enter a valid due date.";
  }

  const weight = Number(values.weight);

  if (
    !values.weight?.trim() ||
    !Number.isInteger(weight) ||
    weight < 1 ||
    weight > 10
  ) {
    return "Weight must be an integer between 1 and 10.";
  }

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

export function validateTaskFilters(values: FormValues): string | null {
  return (values.search?.trim().length ?? 0) > 200
    ? "Task search must be 200 characters or fewer."
    : null;
}

export function validateTaskStatus(values: FormValues): string | null {
  return TASK_STATUSES.some((status) => status === values.status)
    ? null
    : "Select a valid task status.";
}

export function validateExpense(values: FormValues): string | null {
  const amount = values.amount?.trim() ?? "";

  if (!EXPENSE_AMOUNT_PATTERN.test(amount)) {
    return "Enter a positive amount with up to 10 integer digits and 2 decimal places.";
  }

  const category = values.category?.trim() ?? "";

  if (category.length > 100) {
    return "Category must be 100 characters or fewer.";
  }

  const description = values.description?.trim() ?? "";

  if (description.length > 1000) {
    return "Description must be 1,000 characters or fewer.";
  }

  if (!isCalendarDate(values.date ?? "")) {
    return "Enter a valid expense date.";
  }

  return null;
}

export function validateDateFilters(values: FormValues): string | null {
  for (const field of ["fromDate", "toDate"]) {
    if (values[field] && !isCalendarDate(values[field])) {
      return "Enter valid filter dates.";
    }
  }

  if (values.fromDate && values.toDate && values.fromDate > values.toDate) {
    return "From date must be on or before To date.";
  }

  return null;
}
