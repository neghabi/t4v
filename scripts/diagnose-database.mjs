import "dotenv/config";
import pg from "pg";
import { readdirSync } from "node:fs";

// Read-only: no passwords, URLs, customer data or raw exceptions are printed.
const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error("FAIL DATABASE_URL is missing in this process environment.");
  process.exit(1);
}
try {
  const url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw Error();
  console.log(
    JSON.stringify(
      {
        host: url.hostname,
        port: url.port || "5432",
        database: decodeURIComponent(url.pathname.slice(1)),
        user: decodeURIComponent(url.username),
        passwordConfigured: Boolean(url.password),
        sslmode: url.searchParams.get("sslmode"),
      },
      null,
      2,
    ),
  );
} catch {
  console.error("FAIL DATABASE_URL is not a valid PostgreSQL URL.");
  process.exit(1);
}
const pool = new pg.Pool({
  connectionString,
  connectionTimeoutMillis: 10000,
  query_timeout: 10000,
});
try {
  await pool.query("SELECT 1");
  console.log("PASS database connection and authentication");
  const required = [
    "users",
    "sessions",
    "rate_limits",
    "credit_ledger",
    "admin_accounts",
    "identity_documents",
    "phone_challenges",
    "moderation_audits",
    "notification_configs",
  ];
  const { rows } = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
  );
  const tables = new Set(rows.map((row) => row.table_name));
  const missing = required.filter((name) => !tables.has(name));
  if (missing.length)
    throw Object.assign(Error(), { code: "SCHEMA_MISSING", missing });
  const privileges = await pool.query(
    "SELECT bool_and(has_table_privilege(current_user, c.oid, 'SELECT') AND has_table_privilege(current_user, c.oid, 'INSERT') AND has_table_privilege(current_user, c.oid, 'UPDATE') AND has_table_privilege(current_user, c.oid, 'DELETE')) AS allowed FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r'",
  );
  if (privileges.rows[0]?.allowed !== true)
    throw Object.assign(Error(), { code: "42501" });
  console.log("PASS application tables and read/write permissions");
  const migrations = await pool.query(
    'SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"',
  );
  const applied = new Set(
    migrations.rows
      .filter((row) => row.finished_at && !row.rolled_back_at)
      .map((row) => row.migration_name),
  );
  const expected = readdirSync(
    new URL("../prisma/migrations/", import.meta.url),
    { withFileTypes: true },
  )
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const pending = expected.filter((name) => !applied.has(name));
  if (
    pending.length ||
    migrations.rows.some((row) => !row.finished_at && !row.rolled_back_at)
  )
    throw Object.assign(Error(), { code: "MIGRATIONS_PENDING" });
  console.log("PASS all project migrations applied");
  const admins = await pool.query(
    "SELECT count(*)::int AS count FROM admin_accounts",
  );
  console.log(`INFO named website administrators: ${admins.rows[0].count}`);
} catch (error) {
  const messages = {
    ECONNREFUSED: "Database service or port is unreachable.",
    ENOTFOUND: "Database hostname cannot be resolved in this environment.",
    ETIMEDOUT: "Database connection timed out; check network/firewall.",
    "28P01":
      "Database username/password rejected. Changing .env does not change an existing PostgreSQL role password.",
    "3D000": "Configured database does not exist.",
    42501: "Database role lacks required permissions.",
    SCHEMA_MISSING:
      "Application tables are missing; run migrations against the correct database.",
    MIGRATIONS_PENDING:
      "Migrations are pending or failed; inspect prisma migrate status.",
    "42P01": "Migration history is missing; run prisma migrate deploy.",
  };
  const code = error?.code ?? error?.cause?.code ?? "UNKNOWN";
  console.error(
    `FAIL ${code}: ${messages[code] ?? "Database check failed. Inspect private server logs; do not publish credentials."}`,
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
