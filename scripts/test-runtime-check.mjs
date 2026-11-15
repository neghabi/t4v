import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { checkRuntime } from "./check-runtime.mjs";

const config = JSON.parse(
  readFileSync(new URL("../.local/config.json", import.meta.url), "utf8"),
);
const env = {
  DATABASE_URL: `postgresql://t4v:${encodeURIComponent(config.password)}@127.0.0.1:55432/t4v?schema=public`,
  APP_SECRET: config.appSecret,
};
await checkRuntime({ env });
await assert.rejects(checkRuntime({ env: { ...env, APP_SECRET: "" } }), {
  code: "APP_SECRET_INVALID",
});
await assert.rejects(
  checkRuntime({ env: { ...env, DATABASE_URL: "invalid" } }),
  { code: "DATABASE_URL_INVALID" },
);
const names = readdirSync(new URL("../prisma/migrations/", import.meta.url), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
for (const mode of ["missing", "failed", "password", "columns"]) {
  let ended = false;
  const factory = () => ({
    async query(sql) {
      if (mode === "password")
        throw Object.assign(Error("private credential"), { code: "28P01" });
      if (sql.includes("_prisma_migrations"))
        return {
          rows:
            mode === "missing"
              ? []
              : names.map((name, index) => ({
                  migration_name: name,
                  finished_at:
                    mode === "failed" && index === 0 ? null : new Date(),
                  rolled_back_at: null,
                })),
        };
      if (mode === "columns" && sql.includes("full_name"))
        throw Object.assign(Error(), { code: "42703" });
      return { rows: [] };
    },
    async end() {
      ended = true;
    },
  });
  await assert.rejects(checkRuntime({ env, poolFactory: factory }), {
    code: {
      missing: "MIGRATION_PENDING",
      failed: "MIGRATION_FAILED",
      password: "28P01",
      columns: "42703",
    }[mode],
  });
  assert.ok(
    ended,
    "Database connections must close even when validation fails",
  );
}
console.log(
  "PASS startup guard: real database/schema, missing secret, invalid URL, bad password, pending/failed migrations and missing columns",
);
