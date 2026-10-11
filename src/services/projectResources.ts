import apiClient from "@/lib/axios";
import type { ProjectPaginationMeta } from "@/types/project";
export interface ResourcePage<T> {
  data: T[];
  meta: ProjectPaginationMeta;
}
export type ResourceQuery = Record<string, string | number | undefined>;
export async function listResource<T>(
  path: string,
  params: ResourceQuery = {},
): Promise<ResourcePage<T>> {
  const response = await apiClient.get<ResourcePage<T> | T[]>(path, { params });
  const payload = response.data;
  if (Array.isArray(payload)) {
    const meta = response.meta;
    return {
      data: payload,
      meta: {
        page: meta?.page ?? 1,
        limit: meta?.limit ?? payload.length,
        total: meta?.total ?? payload.length,
        totalPages: meta?.totalPages ?? 1,
      },
    };
  }
  if (
    payload &&
    Array.isArray(payload.data) &&
    payload.meta &&
    typeof payload.meta.total === "number"
  )
    return payload;
  throw new Error(
    "Unexpected response. Please try again or contact your administrator.",
  );
}
