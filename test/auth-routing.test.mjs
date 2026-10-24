import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(file, dependencies = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    {
      exports,
      ...globals,
      require: (name) => {
        if (!(name in dependencies))
          throw new Error(`Unexpected import: ${name}`);
        return dependencies[name];
      },
    },
  );
  return exports;
}

const routing = load("src/lib/portalAccess.ts");
for (const [role, destination] of [
  ["CLIENT_PORTAL_USER", "/portal"],
  ["ADMIN", "/modules"],
]) {
  test(`Google callback stores the session and routes ${role} without role selection`, async () => {
    const events = [];
    const jsx = (type, props) => ({ type, props });
    const user = { id: "new-user", role };
    const callback = load(
      "src/app/auth/callback/GoogleCallback.tsx",
      {
        "react/jsx-runtime": { jsx, jsxs: jsx },
        react: {
          useEffect: (effect) => effect(),
          useRef: () => ({ current: null }),
          useState: () => [null, () => {}],
        },
        "next/link": { default: "Link" },
        "next/navigation": {
          useRouter: () => ({ replace: (path) => events.push(path) }),
        },
        "react-redux": { useDispatch: () => (action) => events.push(action) },
        "@/store/slices/authSlice": {
          loginStart: () => "start",
          loginSuccess: () => "success",
          loginFailure: () => "failure",
        },
        "@/lib/token": {
          clearTokens: () => events.push("clear"),
          setAccessToken: (token) => events.push(token),
          setRefreshToken: (token) => events.push(token),
        },
        "@/services/googleAuth": {
          completeGoogleLogin: async () => ({
            user,
            accessToken: "access",
            refreshToken: "refresh",
          }),
        },
        "@/lib/portalAccess": routing,
      },
      {
        window: {
          location: {
            hash: "#token=access&refreshToken=refresh",
            pathname: "/auth/callback",
          },
          history: { replaceState: () => {} },
        },
      },
    );
    callback.default();
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(events, [
      "start",
      "clear",
      "access",
      "refresh",
      "success",
      destination,
    ]);
  });

  test(`signup completion routes ${role} to its home`, () => {
    const events = [];
    const jsx = (type, props) => ({ type, props });
    const finish = load("src/app/finish/components/FinishForm.tsx", {
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "next/link": { default: "Link" },
      "next/navigation": {
        useRouter: () => ({ push: (path) => events.push(path) }),
      },
      "react-redux": {
        useSelector: (select) => select({ auth: { user: { role } } }),
      },
      "lucide-react": { CheckCircle2: "Icon" },
      "@/components/ui/AuthButton": { default: "Button" },
      "@/lib/portalAccess": routing,
    });
    const tree = finish.default();
    const button = tree.props.children.find(
      (child) => child?.props?.id === "finish-submit-btn",
    );
    button.props.onClick();
    assert.deepEqual(events, [destination]);
  });
}
