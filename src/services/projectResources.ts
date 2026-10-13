import apiClient from "@/lib/axios";
import type { ProjectPaginationMeta } from "@/types/project";
export interface ResourcePage<T> {
  data: T[];
  meta: ProjectPaginationMeta;
}
export type ResourceQuery = Record<string, string | number | undefined>;

function validPagination(meta: ProjectPaginationMeta): boolean {
  return (
    Number.isInteger(meta.page) &&
    meta.page >= 1 &&
    Number.isInteger(meta.limit) &&
    meta.limit >= 1 &&
    Number.isInteger(meta.total) &&
    meta.total >= 0 &&
    Number.isInteger(meta.totalPages) &&
    meta.totalPages >= 0
  );
}

/** Load complete name selectors independently of the visible table page. */
export async function listAllResources<T>(
  load: (query: ResourceQuery) => Promise<ResourcePage<T>>,
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const result = await load({ page, limit: 100 });
    if (
      result.meta.page !== page ||
      !Number.isInteger(result.meta.totalPages) ||
      result.meta.totalPages < 0
    )
      throw new Error("Unable to load the complete selection list.");
    items.push(...result.data);
    totalPages = result.meta.totalPages;
    page += 1;
  } while (page <= totalPages);
  return items;
}
export async function listResource<T>(
  path: string,
  params: ResourceQuery = {},
): Promise<ResourcePage<T>> {
  const response = await apiClient.get<ResourcePage<T> | T[]>(path, { params });
  const payload = response.data;
  if (Array.isArray(payload)) {
    const meta = response.meta;
    const result = {
      data: payload,
      meta: {
        page: meta?.page ?? 1,
        limit: meta?.limit ?? Math.max(1, payload.length),
        total: meta?.total ?? payload.length,
        totalPages: meta?.totalPages ?? 1,
      },
    };
    if (validPagination(result.meta)) return result;
    throw new Error("Unexpected pagination response. Please try again.");
    throw new Error("Unexpected pagination response. Please try again.");
  }
  if (
    payload &&
    Array.isArray(payload.data) &&
    payload.meta &&
    validPagination(payload.meta)
  )
    return payload;
  throw new Error(
    "Unexpected response. Please try again or contact your administrator.",
  );
}
