import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as crypto from "node:crypto";
import ts from "typescript";

// Isolate database failures without stopping a database or touching real accounts.
function load(path, dependencies = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require(name) {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    console: { error() {} },
  });
  return exports;
}
const next = { NextResponse: { json: (data, init) => Response.json(data, init) } };
const api = load("lib/apiResponse.ts", { "node:crypto": crypto, "next/server": next });
const unavailable = Object.assign(new Error("private database connection details"), { code: "ECONNREFUSED" });
let failure = unavailable;
const dependencies = {
  "next/server": next,
  "@/lib/apiResponse": api,
  "@/lib/rateLimit": { enforceRateLimit: async () => { if (failure) throw failure; return null; } },
  "@/lib/userStore": {
    createUser: async () => { throw new api.ApiError("Invalid email"); },
    adminCreateUser: async () => { throw new api.ApiError("Invalid email"); },
    listUsersForAdmin: async () => [],
  },
  "@/lib/adminRequest": { isAdminRequest: async () => { if (failure) throw failure; return true; } },
  "@/lib/sessionStore": { createSessionToken: async () => "test" },
  "@/lib/auth/sessionCookie": { setSessionCookie() {} },
};
const register = load("app/api/auth/register/route.ts", dependencies);
const admin = load("app/api/admin/users/route.ts", dependencies);
const request = () => new Request("http://localhost/api/test", {
  method: "POST", headers: { "content-type": "application/json" }, body: "{}",
});
for (const handler of [register.POST, admin.POST, admin.GET]) {
  const response = await handler(request());
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.code, "database_unavailable");
  assert.ok(body.requestId);
  assert.ok(!JSON.stringify(body).includes("private database"));
}
failure = null;
for (const handler of [register.POST, admin.POST]) {
  const response = await handler(request());
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "Invalid email");
}
const { readApiResponse } = load("lib/readApiResponse.ts");
for (const response of [new Response(null, { status: 500 }), new Response("<html>proxy error</html>", { status: 502 }), Response.json(null)]) {
  await assert.rejects(readApiResponse(response), (error) => !/JSON|SyntaxError|html|Unexpected/.test(error.message));
}
await assert.rejects(readApiResponse(Response.json({ error: "Service unavailable" }, { status: 503 })), /Service unavailable/);
assert.equal((await readApiResponse(Response.json({ user: { id: "test" } }))).user.id, "test");
console.log("Auth failure regression checks passed: database outage, admin auth failure, validation, empty/proxy responses, success.");
