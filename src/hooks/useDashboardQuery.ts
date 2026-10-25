"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import {
  dashboardQueryCache,
  DASHBOARD_STALE_TIME,
  type QuerySnapshot,
} from "@/lib/dashboardQueryCache";

const serverSnapshot: QuerySnapshot<never> = {
  fetching: false,
  updatedAt: 0,
  revision: 0,
};

export function useDashboardQuery<T>(
  name: string,
  loader: () => Promise<T>,
  enabled = true,
) {
  const user = useSelector((state: RootState) => state.auth.user);
  const key = JSON.stringify([user?.id, user?.role, name]);
  const subscribe = useCallback(
    (listener: () => void) => dashboardQueryCache.subscribe(key, listener),
    [key],
  );
  const getSnapshot = useCallback(
    () => dashboardQueryCache.snapshot<T>(key),
    [key],
  );
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => serverSnapshot,
  );
  const refresh = useCallback(
    async (force = true) => {
      if (!enabled || !user) return;
      try {
        return await dashboardQueryCache.fetch(key, loader, force);
      } catch {
        // The cache exposes errors without discarding the last successful data.
        return undefined;
      }
    },
    [key, loader, enabled, user],
  );

  useEffect(() => {
    if (!enabled || !user) return;
    const revalidate = () => {
      if (document.visibilityState === "visible") void refresh(false);
    };
    revalidate();
    const timer = window.setInterval(revalidate, DASHBOARD_STALE_TIME);
    window.addEventListener("focus", revalidate);
    document.addEventListener("visibilitychange", revalidate);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", revalidate);
      document.removeEventListener("visibilitychange", revalidate);
    };
  }, [enabled, user, refresh, snapshot.revision]);

  const setData = useCallback(
    (update: (current: T | undefined) => T | undefined) =>
      dashboardQueryCache.setData(key, update),
    [key],
  );
  return {
    ...snapshot,
    loading: enabled && snapshot.data === undefined && !snapshot.error,
    refresh,
    setData,
  };
}

// Observe cached dashboard data without triggering another API request.
export function useDashboardSnapshot<T>(name: string): QuerySnapshot<T> {
  const user = useSelector((state: RootState) => state.auth.user);
  const key = JSON.stringify([user?.id, user?.role, name]);

  const subscribe = useCallback(
    (listener: () => void) => dashboardQueryCache.subscribe(key, listener),
    [key],
  );

  const getSnapshot = useCallback(
    () => dashboardQueryCache.snapshot<T>(key),
    [key],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
}
