import { describe, expect, it } from "vitest";
import {
  DashboardQueryCache,
  DASHBOARD_STALE_TIME,
} from "@/lib/dashboardQueryCache";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("dashboard query cache", () => {
  it("deduplicates requests and reuses fresh data until expiry", async () => {
    let now = 100;
    const cache = new DashboardQueryCache(() => now);
    const pending = deferred<number>();
    let requests = 0;
    const load = () => {
      requests++;
      return pending.promise;
    };
    const first = cache.fetch("summary", load);
    const second = cache.fetch("summary", load);
    pending.resolve(0);
    expect(await first).toBe(0);
    expect(await second).toBe(0);
    await cache.fetch("summary", load);
    expect(requests).toBe(1);
    now += DASHBOARD_STALE_TIME;
    await cache.fetch("summary", load);
    expect(requests).toBe(2);
  });

  it("keeps successful data on refresh failure and clears it on denied access", async () => {
    const cache = new DashboardQueryCache();
    await cache.fetch("invoices", async () => ["invoice"]);
    await expect(
      cache.fetch(
        "invoices",
        async () => {
          throw new Error("offline");
        },
        true,
      ),
    ).rejects.toThrow("offline");
    expect(cache.snapshot("invoices").data).toEqual(["invoice"]);
    await expect(
      cache.fetch(
        "invoices",
        async () => {
          throw { statusCode: 403 };
        },
        true,
      ),
    ).rejects.toEqual({ statusCode: 403 });
    expect(cache.snapshot("invoices").data).toBeUndefined();
  });

  it("rejects an old in-flight result after mutation invalidation", async () => {
    const cache = new DashboardQueryCache();
    const old = deferred<number>();
    const first = cache.fetch("invoices", () => old.promise);
    cache.invalidate();
    await cache.fetch("invoices", async () => 20);
    old.resolve(10);
    await first;
    expect(cache.snapshot("invoices").data).toBe(20);
  });

  it("clears protected data and ignores requests completing after logout", async () => {
    const cache = new DashboardQueryCache();
    const pending = deferred<string>();
    const request = cache.fetch("user-a", () => pending.promise);
    cache.clear();
    pending.resolve("private");
    await request;
    expect(cache.snapshot("user-a").data).toBeUndefined();
  });

  it("keeps filter and account keys independent", async () => {
    const cache = new DashboardQueryCache();
    await cache.fetch('["a","activity:1"]', async () => "page one");
    await cache.fetch('["a","activity:2"]', async () => "page two");
    await cache.fetch('["b","activity:1"]', async () => "other account");
    expect(cache.snapshot('["a","activity:1"]').data).toBe("page one");
  });
});
