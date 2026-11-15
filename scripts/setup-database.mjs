import "dotenv/config";
import { randomBytes } from "node:crypto";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import pg from "pg";

// Explicit provisioning for a NEW dedicated database. Existing roles/data are never changed.
const adminUrl = process.env.DATABASE_ADMIN_URL;
const username = process.env.APP_DB_USER || "t4v_app";
const database = process.env.APP_DB_NAME || "t4v";
const password = process.env.APP_DB_PASSWORD || randomBytes(24).toString("hex");
if (!adminUrl)
  throw Error(
    "DATABASE_ADMIN_URL is required in the private setup environment file.",
  );
for (const name of [username, database])
  if (!/^[a-z][a-z0-9_]{2,62}$/.test(name))
    throw Error(
      "Database/user names must be 3-63 lowercase letters, digits or underscores.",
    );
if (password.length < 16)
  throw Error("Choose a database password of at least 16 characters.");
const output = process.env.DATABASE_CREDENTIALS_FILE
  ? resolve(process.env.DATABASE_CREDENTIALS_FILE)
  : new URL("../.local/database.env", import.meta.url);
if (existsSync(output))
  throw Error(
    ".local/database.env already exists; preserve it. No database changes made.",
  );
const pool = new pg.Pool({
  connectionString: adminUrl,
  connectionTimeoutMillis: 10000,
});
try {
  const role = await pool.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [
    username,
  ]);
  if (role.rowCount)
    throw Error(
      "Role already exists. No password or permissions changed; diagnose its connection instead.",
    );
  const db = await pool.query("SELECT 1 FROM pg_database WHERE datname=$1", [
    database,
  ]);
  if (db.rowCount)
    throw Error(
      "Database already exists. No data or ownership changed; diagnose its connection instead.",
    );
  await pool.query("SET standard_conforming_strings = on");
  const roleSql = await pool.query(
    "SELECT format('CREATE ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD %L', $1::text, $2::text) AS sql",
    [username, password],
  );
  await pool.query(roleSql.rows[0].sql);
  const dbSql = await pool.query(
    "SELECT format('CREATE DATABASE %I OWNER %I', $1::text, $2::text) AS sql",
    [database, username],
  );
  await pool.query(dbSql.rows[0].sql);
  const url = new URL(adminUrl);
  url.username = encodeURIComponent(username);
  url.password = encodeURIComponent(password);
  url.pathname = `/${database}`;
  const verify = new pg.Pool({
    connectionString: url.toString(),
    connectionTimeoutMillis: 10000,
  });
  try {
    await verify.query("SELECT 1");
  } finally {
    await verify.end();
  }
  mkdirSync(
    typeof output === "string"
      ? dirname(output)
      : new URL("../.local/", import.meta.url),
    { recursive: true },
  );
  writeFileSync(output, `DATABASE_URL=${url.toString()}\n`, {
    mode: 0o600,
    flag: "wx",
  });
  console.log(
    "Created dedicated database and non-superuser login. Verified connection. Private DATABASE_URL saved in .local/database.env; copy it into the application environment and run migrations.",
  );
} catch (error) {
  // Never print SQL or connection details, which can contain the generated password.
  if (error?.code)
    console.error(
      `Provisioning failed (${error.code}). A new role/database may have been created before failure; inspect privately before retrying. Existing accounts were not modified.`,
    );
  else console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
