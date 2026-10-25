import type { Milestone } from "@/types/milestone";
import type { ResourcePage, ResourceQuery } from "./projectResources";

const DEFAULT_PAGE_SIZE = 10;

function readPositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, undefined, {
    sensitivity: "base",
  });
}

/**
 * The milestone backend currently returns the complete project list.
 * Apply controls locally, without changing shared server-paged adapters.
 */
export function paginateMilestones(
  milestones: Milestone[],
  query: ResourceQuery = {},
): ResourcePage<Milestone> {
  const page = readPositiveInteger(query.page, 1);
  const limit = Math.min(
    100,
    readPositiveInteger(query.limit, DEFAULT_PAGE_SIZE),
  );

  const search = String(query.search ?? "")
    .trim()
    .toLowerCase();
  const status = String(query.status ?? "");
  const sortBy = String(query.sortBy ?? "createdAt");
  const descending = query.sortOrder !== "asc";

  const filtered = milestones.filter((milestone) => {
    const matchesSearch =
      !search ||
      milestone.milestoneName.toLowerCase().includes(search) ||
      (milestone.description ?? "").toLowerCase().includes(search);

    const matchesStatus = !status || milestone.status === status;

    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((left, right) => {
    let result = 0;

    if (sortBy === "milestoneName") {
      result = compareText(left.milestoneName, right.milestoneName);
    } else {
      const leftDate = sortBy === "dueDate" ? left.dueDate : left.createdAt;
      const rightDate = sortBy === "dueDate" ? right.dueDate : right.createdAt;

      // Keep unset dates after dated milestones in either direction.
      if (!leftDate && rightDate) return 1;
      if (leftDate && !rightDate) return -1;

      if (leftDate && rightDate) {
        result = compareText(leftDate, rightDate);
      }
    }

    if (result !== 0) {
      return descending ? -result : result;
    }

    // Stable tie-breaker prevents records jumping between pages.
    return compareText(left.id, right.id);
  });

  const total = sorted.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;

  return {
    data: sorted.slice(start, start + limit),
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}
