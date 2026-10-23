"use client";

import { useDashboardQuery } from "@/hooks/useDashboardQuery";

export interface PortalQuery<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
  fetching: boolean;
  retry: () => void;
}

/**
 * Portal data loader. Entries are cached per signed-in user and role, so one
 * client's records are never served to another account on the same browser.
 * `name` must include every parameter that changes the result.
 */
export function usePortalQuery<T>(
  name: string,
  loader: () => Promise<T>,
  enabled = true,
): PortalQuery<T> {
  const { data, error, loading, fetching, refresh } = useDashboardQuery<T>(
    `portal:${name}`,
    loader,
    enabled,
  );
  return {
    data,
    error,
    loading,
    fetching,
    retry: () => {
      void refresh(true);
    },
  };
}
