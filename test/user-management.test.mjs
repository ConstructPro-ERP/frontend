import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(path, client = {}) {
  const exports = {};
  const { outputText } = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  vm.runInNewContext(outputText, {
    exports,
    encodeURIComponent,
    require: () => ({ default: client }),
  });
  return exports;
}

const rules = load("src/lib/userManagement.ts");
const users = [
  {
    id: "1",
    fullName: "Asha Silva",
    email: "asha@example.test",
    status: "ACTIVE",
    role: { roleName: "ADMIN" },
  },
  {
    id: "2",
    fullName: "Nimal Perera",
    email: "nimal@example.test",
    status: "INACTIVE",
    role: { roleName: "PROJECT_MANAGER" },
  },
  {
    id: "3",
    fullName: "Maya",
    email: "maya@example.test",
    status: "ACTIVE",
    role: null,
  },
];

test("directory filtering handles inactive and unassigned users with case-insensitive search", () => {
  assert.equal(rules.filterUsers(users, " NIMAL ", "INACTIVE")[0].id, "2");
  assert.equal(rules.filterUsers(users, "", "UNASSIGNED")[0].id, "3");
  assert.equal(rules.filterUsers(users, "administrator", "ADMIN")[0].id, "1");
  assert.equal(rules.filterUsers(users, "missing", "ALL").length, 0);
  assert.equal(rules.filterUsers([], "", "ALL").length, 0);
});

test("forms preserve compound surnames and reject unusable account details", () => {
  const parts = rules.splitName(" Asha de Silva ");
  assert.equal(parts.firstName, "Asha");
  assert.equal(parts.lastName, "de Silva");
  const valid = { ...parts, email: "asha@example.test", password: "" };
  assert.equal(rules.validateUserForm(valid), null);
  assert.match(
    rules.validateUserForm({ ...valid, firstName: " " }),
    /first name/,
  );
  assert.match(rules.validateUserForm({ ...valid, email: "wrong" }), /email/);
  assert.match(
    rules.validateUserForm({ ...valid, password: "12345" }),
    /8 characters/,
  );
});

test("directory uses the existing user endpoint and rejects malformed responses", async () => {
  const api = load("src/services/usersApi.ts", {
    get: async (url) => {
      assert.equal(url, "/users");
      return { data: users };
    },
  });
  assert.equal(await api.listUsers(), users);
  await assert.rejects(
    load("src/services/usersApi.ts", {
      get: async () => ({ data: {} }),
    }).listUsers(),
    /directory/,
  );
});

test("create and edit send backend role IDs and return the saved account", async () => {
  const calls = [];
  const api = load("src/services/usersApi.ts", {
    post: async (url, body) => {
      calls.push({ url, body });
      return { data: users[0] };
    },
    patch: async (url, body) => {
      calls.push({ url, body });
      return { data: users[1] };
    },
  });
  const input = {
    fullName: "Asha Silva",
    email: "asha@example.test",
    roleId: "role-id",
  };
  assert.equal(await api.createUser(input), users[0]);
  assert.equal(
    await api.updateUser("account/id", { status: "ACTIVE" }),
    users[1],
  );
  assert.deepEqual(calls, [
    { url: "/users", body: input },
    { url: "/users/account%2Fid", body: { status: "ACTIVE" } },
  ]);
});

test("deactivation accepts a bodyless response and propagates server failures", async () => {
  let target;
  const api = load("src/services/usersApi.ts", {
    del: async (url) => {
      target = url;
      return "";
    },
  });
  await api.deactivateUser("account/id");
  assert.equal(target, "/users/account%2Fid");
  await assert.rejects(
    load("src/services/usersApi.ts", {
      del: async () => {
        throw new Error("Forbidden");
      },
    }).deactivateUser("1"),
    /Forbidden/,
  );
});
