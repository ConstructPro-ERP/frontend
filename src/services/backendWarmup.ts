import apiClient from "@/lib/axios";

let warmupRequested = false;

/** Starts one best-effort gateway warmup per browser app session. */
export function warmBackendServices(): void {
  if (warmupRequested) return;
  warmupRequested = true;

  void apiClient.get("/health/warmup").catch(() => {
    // The UI loads independently; a warmup failure should be invisible.
    warmupRequested = false;
  });
}
