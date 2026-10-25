export const DASHBOARD_STALE_TIME = 60_000;

export interface QuerySnapshot<T> {
  data?: T;
  error?: unknown;
  fetching: boolean;
  updatedAt: number;
  revision: number;
}

interface Entry {
  snapshot: QuerySnapshot<unknown>;
  listeners: Set<() => void>;
  promise?: Promise<unknown>;
  generation: number;
}

export class DashboardQueryCache {
  private entries = new Map<string, Entry>();

  constructor(private readonly now: () => number = () => Date.now()) {}

  private entry(key: string): Entry {
    let entry = this.entries.get(key);
    if (!entry) {
      // Bound inactive entries, including activity pages and invoice details.
      if (this.entries.size >= 100) {
        for (const [oldKey, oldEntry] of this.entries) {
          if (!oldEntry.listeners.size && !oldEntry.promise) {
            this.entries.delete(oldKey);
            break;
          }
        }
      }
      entry = {
        snapshot: { fetching: false, updatedAt: 0, revision: 0 },
        listeners: new Set(),
        generation: 0,
      };
      this.entries.set(key, entry);
    }
    return entry;
  }

  snapshot<T>(key: string): QuerySnapshot<T> {
    return this.entry(key).snapshot as QuerySnapshot<T>;
  }

  subscribe(key: string, listener: () => void): () => void {
    const entry = this.entry(key);
    entry.listeners.add(listener);
    return () => {
      entry.listeners.delete(listener);
    };
  }

  private publish(entry: Entry, snapshot: QuerySnapshot<unknown>) {
    entry.snapshot = snapshot;
    entry.listeners.forEach((listener) => listener());
  }

  async fetch<T>(
    key: string,
    loader: () => Promise<T>,
    force = false,
  ): Promise<T> {
    const entry = this.entry(key);
    if (entry.promise) return entry.promise as Promise<T>;
    if (
      !force &&
      entry.snapshot.data !== undefined &&
      entry.snapshot.updatedAt > 0 &&
      this.now() - entry.snapshot.updatedAt < DASHBOARD_STALE_TIME
    ) {
      return entry.snapshot.data as T;
    }
    const generation = entry.generation;
    const promise = Promise.resolve()
      .then(loader)
      .then((data) => {
        if (entry.generation === generation) {
          this.publish(entry, {
            data,
            fetching: false,
            updatedAt: this.now(),
            revision: entry.snapshot.revision,
          });
        }
        return data;
      })
      .catch((error: unknown) => {
        if (entry.generation === generation) {
          const denied =
            typeof error === "object" &&
            error !== null &&
            "statusCode" in error &&
            (error.statusCode === 401 || error.statusCode === 403);
          this.publish(entry, {
            ...entry.snapshot,
            ...(denied ? { data: undefined, updatedAt: 0 } : {}),
            error,
            fetching: false,
          });
        }
        throw error;
      })
      .finally(() => {
        if (entry.generation === generation) entry.promise = undefined;
      });
    entry.promise = promise;
    this.publish(entry, {
      ...entry.snapshot,
      error: undefined,
      fetching: true,
    });
    return promise;
  }

  setData<T>(key: string, update: (current: T | undefined) => T | undefined) {
    const entry = this.entry(key);
    const data = update(entry.snapshot.data as T | undefined);
    entry.generation++;
    entry.promise = undefined;
    this.publish(entry, {
      ...entry.snapshot,
      data,
      error: undefined,
      updatedAt: this.now(),
    });
  }

  invalidate() {
    this.entries.forEach((entry) => {
      entry.generation++;
      entry.promise = undefined;
      this.publish(entry, {
        ...entry.snapshot,
        error: undefined,
        fetching: false,
        updatedAt: 0,
        revision: entry.snapshot.revision + 1,
      });
    });
  }

  clear() {
    this.entries.forEach((entry, key) => {
      entry.generation++;
      entry.promise = undefined;
      this.publish(entry, {
        fetching: false,
        updatedAt: 0,
        revision: entry.snapshot.revision + 1,
      });
      if (!entry.listeners.size) this.entries.delete(key);
    });
  }
}

export const dashboardQueryCache = new DashboardQueryCache();
