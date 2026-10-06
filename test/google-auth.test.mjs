import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { z } from "zod";

function load(file, dependencies) {
  const exports = {};
  const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  vm.runInNewContext(outputText, {
    exports,
    URLSearchParams,
    require: (name) => {
      if (!(name in dependencies))
        throw new Error(`Unexpected import: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}

function google(get = async () => {}) {
  return load("src/services/googleAuth.ts", {
    zod: { z },
    "@/lib/axios": { default: { get } },
    "@/lib/apiConfig": { API_URL: "http://localhost:4000/api" },
  });
}

test("Google initiation uses the gateway redirect endpoint", () => {
  assert.equal(
    google().googleLoginUrl,
    "http://localhost:4000/api/auth/google",
  );
});

test("callback accepts one fragment token and rejects missing, duplicate and denied callbacks", () => {
  const { readGoogleCallbackToken } = google();
  assert.equal(readGoogleCallbackToken("#token=abc.def.xyz"), "abc.def.xyz");
  for (const hash of [
    "",
    "#token=",
    "#token=%20",
    "#token=a&token=b",
    "#error=access_denied",
    "#error=denied&token=a",
  ]) {
    assert.throws(() => readGoogleCallbackToken(hash));
  }
});

test("callback verifies the new bearer token without refreshing the previous account", async () => {
  const { completeGoogleLogin } = google(async (url, config) => {
    assert.equal(url, "/auth/me");
    assert.equal(config.headers.Authorization, "Bearer new-token");
    assert.equal(config.skipAuthRefresh, true);
    assert.equal(config.timeout, 15000);
    return {
      success: true,
      data: {
        id: "u1",
        email: "test@example.com",
        fullName: "Jane Mary Doe",
        role: null,
        avatar: "https://example.com/avatar.png",
      },
    };
  });
  const result = await completeGoogleLogin("#token=new-token");
  assert.equal(result.accessToken, "new-token");
  assert.equal(result.user.firstName, "Jane");
  assert.equal(result.user.lastName, "Mary Doe");
  assert.equal(result.user.role, null);
  assert.equal(result.user.avatarUrl, "https://example.com/avatar.png");
});

test("callback fails on invalid profiles and rejected backend responses", async () => {
  for (const response of [{ success: false }, { success: true, data: {} }]) {
    await assert.rejects(
      google(async () => response).completeGoogleLogin("#token=invalid"),
    );
  }
  const failure = new Error("unauthorized");
  await assert.rejects(
    google(async () => {
      throw failure;
    }).completeGoogleLogin("#token=expired"),
    failure,
  );
});

test("profile normalization preserves names and roles without granting a default role", () => {
  const { normalizeAuthUser } = google();
  for (const role of [
    null,
    "user",
    "ADMIN",
    "SALES_MANAGER",
    "PROJECT_MANAGER",
    "CLIENT_PORTAL_USER",
  ]) {
    const user = normalizeAuthUser({
      id: "1",
      email: "test@example.com",
      firstName: "Jane",
      lastName: "Doe",
      role,
    });
    assert.equal(user.role, role);
    assert.equal(user.firstName, "Jane");
  }
  assert.equal(
    normalizeAuthUser({ id: "1", email: "test@example.com" }).role,
    null,
  );
});

test("API interceptor preserves callback Authorization and skips token refresh on rejection", async () => {
  let attachToken, rejectResponse;
  let refreshCalls = 0;
  const instance = {
    interceptors: {
      request: {
        use: (handler) => {
          attachToken = handler;
        },
      },
      response: {
        use: (_, handler) => {
          rejectResponse = handler;
        },
      },
    },
  };
  class ApiError extends Error {}
  load("src/lib/axios.ts", {
    axios: {
      default: {
        create: () => instance,
        post: () => {
          refreshCalls++;
        },
      },
    },
    "@/store": { store: {} },
    "@/store/slices/authSlice": {},
    "./token": { getAccessToken: () => "old-token" },
    "./ApiError": { ApiError },
    "./apiConfig": { API_URL: "http://localhost:4000/api" },
  });
  assert.equal(
    attachToken({ headers: { Authorization: "Bearer new-token" } }).headers
      .Authorization,
    "Bearer new-token",
  );
  assert.equal(
    attachToken({ headers: {} }).headers.Authorization,
    "Bearer old-token",
  );
  await assert.rejects(
    rejectResponse({
      config: { url: "/auth/me", skipAuthRefresh: true },
      response: {
        status: 401,
        data: { code: "TOKEN_INVALID", message: "Invalid token" },
      },
    }),
  );
  assert.equal(refreshCalls, 0);
});
