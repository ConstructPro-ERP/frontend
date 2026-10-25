import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function setup({
  roles = [{ id: "client-id", roleName: "CLIENT_PORTAL_USER" }],
  failPost = false,
  profile = { id: "new-user", role: "CLIENT_PORTAL_USER" },
} = {}) {
  const calls = [];
  const exports = {};
  const dependencies = {
    "@/services/roles": { getRoles: async () => roles },
    "@/services/googleAuth": { normalizeAuthUser: (user) => user },
    "@/lib/axios": {
      default: {
        post: async (url, body) => {
          calls.push({ url, body });
          if (failPost) throw new Error("Account exists");
          return {
            success: true,
            data: {
              accessToken: "new-access",
              refreshToken: "new-refresh",
              user: { id: "new-user" },
            },
          };
        },
        get: async (url, config) => {
          calls.push({ url, config });
          return { success: true, data: profile };
        },
      },
    },
  };
  vm.runInNewContext(
    ts.transpileModule(readFileSync("src/services/registration.ts", "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    { exports, require: (name) => dependencies[name] },
  );
  return { register: exports.registerAccount, calls };
}

test("signup always sends the catalog client role and returns a verified session", async () => {
  const { register, calls } = setup();
  const session = await register({
    email: "new@example.com",
    password: "Password1",
    roleId: "admin",
  });
  assert.equal(calls[0].body.roleId, "client-id");
  assert.equal(calls[0].body.username, "new@example.com");
  assert.equal(calls[1].url, "/auth/me");
  assert.equal(calls[1].config.headers.Authorization, "Bearer new-access");
  assert.equal(calls[1].config.skipAuthRefresh, true);
  assert.equal(session.refreshToken, "new-refresh");
  assert.equal(session.user.role, "CLIENT_PORTAL_USER");
});

test("missing default role prevents signup rather than selecting another role", async () => {
  const { register, calls } = setup({
    roles: [{ id: "admin", roleName: "ADMIN" }],
  });
  await assert.rejects(
    register({ email: "new@example.com", password: "Password1" }),
    /unavailable/,
  );
  assert.equal(calls.length, 0);
});

test("failed signup does not load a profile", async () => {
  const { register, calls } = setup({ failPost: true });
  await assert.rejects(
    register({ email: "new@example.com", password: "Password1" }),
    /Account exists/,
  );
  assert.equal(calls.length, 1);
});

test("signup rejects mismatched accounts or unconfirmed roles", async () => {
  for (const profile of [
    { id: "other", role: "CLIENT_PORTAL_USER" },
    { id: "new-user", role: null },
  ]) {
    await assert.rejects(
      setup({ profile }).register({
        email: "new@example.com",
        password: "Password1",
      }),
      /verified/,
    );
  }
});

test("signup form has no role selector and stores the session before navigation", async () => {
  const events = [];
  let submit;
  const user = { id: "new-user", role: "CLIENT_PORTAL_USER" };
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    react: { useState: () => [null, () => {}] },
    "react-redux": { useDispatch: () => (action) => events.push(action) },
    "next/navigation": {
      useRouter: () => ({ push: (url) => events.push(url) }),
    },
    "react-hook-form": {
      useForm: () => ({
        register: () => ({}),
        handleSubmit: (handler) => {
          submit = handler;
          return handler;
        },
        formState: { errors: {}, isSubmitting: false },
      }),
    },
    "@hookform/resolvers/zod": { zodResolver: () => ({}) },
    zod: await import("zod"),
    "lucide-react": { Mail: "Mail", Lock: "Lock" },
    "@/services/registration": {
      registerAccount: async () => ({
        user,
        accessToken: "access",
        refreshToken: "refresh",
      }),
    },
    "@/store/slices/authSlice": {
      loginSuccess: (payload) => ({ type: "loginSuccess", payload }),
    },
    "@/lib/token": {
      clearTokens: () => events.push("clear"),
      setAccessToken: (value) => events.push(value),
      setRefreshToken: (value) => events.push(value),
    },
  };
  for (const name of [
    "next/link",
    "@/components/ui/GoogleLoginButton",
    "@/components/ui/AuthInput",
    "@/components/ui/AuthButton",
    "@/components/ui/AuthCheckbox",
  ])
    dependencies[name] = { default: name };
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(
      readFileSync("src/app/register/components/RegisterForm.tsx", "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
        },
      },
    ).outputText,
    {
      exports,
      require: (name) => {
        if (!(name in dependencies)) throw new Error(name);
        return dependencies[name];
      },
    },
  );
  const tree = exports.default();
  assert.equal(JSON.stringify(tree).includes("register-role"), false);
  await submit({
    email: "new@example.com",
    password: "Password1",
    agreeToTerms: true,
  });
  assert.deepEqual(events.slice(0, 3), ["clear", "access", "refresh"]);
  assert.equal(events[3].type, "loginSuccess");
  assert.equal(events[3].payload.user, user);
  assert.equal(events[4], "/finish");
});
