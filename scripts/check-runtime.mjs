import pg from "pg";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export async function checkRuntime({
  env = process.env,
  connectionOnly = false,
  schemaOnly = false,
  skipSchema = false,
  poolFactory = (options) => new pg.Pool(options),
} = {}) {
  let url;
  try {
    url = new URL(env.DATABASE_URL);
  } catch {
    throw Object.assign(Error(), { code: "DATABASE_URL_INVALID" });
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.password)
    throw Object.assign(Error(), { code: "DATABASE_URL_INVALID" });
  if (
    !connectionOnly &&
    !schemaOnly &&
    (!env.APP_SECRET || env.APP_SECRET.trim().length < 32)
  )
    throw Object.assign(Error(), { code: "APP_SECRET_INVALID" });
  const pool = poolFactory({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    query_timeout: 15000,
    options: "-c timezone=UTC",
    max: 1,
  });
  try {
    await pool.query("SELECT 1");
    if (!connectionOnly && !skipSchema) {
      const expected = readdirSync(
        new URL("../prisma/migrations/", import.meta.url),
        { withFileTypes: true },
      )
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
      const { rows } = await pool.query(
        'SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"',
      );
      if (rows.some((row) => !row.finished_at && !row.rolled_back_at))
        throw Object.assign(Error(), { code: "MIGRATION_FAILED" });
      const applied = new Set(
        rows
          .filter((row) => row.finished_at && !row.rolled_back_at)
          .map((row) => row.migration_name),
      );
      if (expected.some((name) => !applied.has(name)))
        throw Object.assign(Error(), { code: "MIGRATION_PENDING" });
      await pool.query(
        "SELECT full_name, phone_verified_at, identity_status, account_status FROM users LIMIT 0",
      );
      await pool.query("SELECT moderation_status FROM short_links LIMIT 0");
      await pool.query("SELECT options FROM notification_configs LIMIT 0");
      await pool.query("SELECT 1 FROM identity_documents LIMIT 0");
      await pool.query("SELECT 1 FROM rate_limits LIMIT 0");
      await pool.query("SELECT 1 FROM sessions LIMIT 0");
    }
  } finally {
    await pool.end();
  }
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  try {
    await checkRuntime({
      connectionOnly: process.argv.includes("--connection-only"),
      schemaOnly: process.argv.includes("--schema-only"),
      skipSchema: process.argv.includes("--skip-schema"),
    });
    console.log(JSON.stringify({ event: "runtime_check_passed" }));
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "runtime_check_failed",
        code: error.code ?? "UNKNOWN",
      }),
    );
    process.exitCode = 1;
  }
}
