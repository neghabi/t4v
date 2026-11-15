import assert from "node:assert/strict";
import { readFileSync, existsSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { randomBytes, scryptSync } from "node:crypto";
import pg from "pg";
import { fileURLToPath } from "node:url";

// Local embedded PostgreSQL only. All provisioned resources are disposable.
const local = JSON.parse(
  readFileSync(new URL("../.local/config.json", import.meta.url), "utf8"),
);
const adminUrl = new URL("postgresql://t4v@127.0.0.1:55432/t4v");
adminUrl.password = local.password;
const suffix = randomBytes(5).toString("hex");
const name = `t4v_test_${suffix}`;
const output = new URL(
  `../.local/test-database-${suffix}.env`,
  import.meta.url,
);
const credentials = new URL(`../.local/admin-${name}.json`, import.meta.url);
const pool = new pg.Pool({
  connectionString: adminUrl.toString(),
  connectionTimeoutMillis: 5000,
});
function run(script, args = [], env = {}, expected = 0) {
  const result = spawnSync(process.execPath, [script, ...args], {
    env: { ...process.env, NODE_ENV: "production", ...env },
    encoding: "utf8",
    timeout: 60000,
  });
  if (script === "scripts/setup-database.mjs" && result.status !== expected)
    console.error(result.stderr);
  assert.equal(
    result.status,
    expected,
    `Unexpected exit from ${script}; inspect locally (output withheld to protect secrets).`,
  );
  return result.stdout + result.stderr;
}
try {
  const setup = {
    DATABASE_ADMIN_URL: adminUrl.toString(),
    APP_DB_USER: name,
    APP_DB_NAME: name,
    APP_DB_PASSWORD: `Test@#%/${randomBytes(16).toString("hex")}`,
    DATABASE_CREDENTIALS_FILE: fileURLToPath(output),
  };
  run("scripts/setup-database.mjs", [], setup);
  const connectionString = readFileSync(output, "utf8")
    .trim()
    .slice("DATABASE_URL=".length);
  const env = {
    DATABASE_URL: connectionString,
    PUBLIC_SHORT_URL_BASE: "https://t4v.ir",
  };
  assert.match(
    run("scripts/diagnose-database.mjs", [], env, 1),
    /SCHEMA_MISSING/,
  );
  run("node_modules/prisma/build/index.js", ["migrate", "deploy"], env);
  assert.match(
    run("scripts/diagnose-database.mjs", [], env),
    /PASS all project migrations applied/,
  );
  run("scripts/create-admin.mjs", [name], env);
  const saved = JSON.parse(readFileSync(credentials, "utf8"));
  assert.equal(saved.url, "https://t4v.ir/admin");
  const app = new pg.Pool({ connectionString });
  try {
    const row = (
      await app.query(
        "SELECT password_hash FROM admin_accounts WHERE username=$1",
        [name],
      )
    ).rows[0];
    const [, salt, hash] = row.password_hash.split(":");
    assert.equal(
      scryptSync(saved.password, Buffer.from(salt, "base64url"), 32).toString(
        "base64url",
      ),
      hash,
    );
    run("scripts/create-admin.mjs", [name], {
      ...env,
      T4V_ADMIN_PASSWORD: "different-strong-test-password",
    });
    assert.equal(
      (
        await app.query(
          "SELECT password_hash FROM admin_accounts WHERE username=$1",
          [name],
        )
      ).rows[0].password_hash,
      row.password_hash,
    );
    const roles = await app.query(
      "SELECT rolsuper, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname=current_user",
    );
    assert.deepEqual(roles.rows[0], {
      rolsuper: false,
      rolcreatedb: false,
      rolcreaterole: false,
    });
  } finally {
    await app.end();
  }
  const wrong = new URL(connectionString);
  wrong.password = "incorrect-test-password";
  assert.match(
    run(
      "scripts/diagnose-database.mjs",
      [],
      { ...env, DATABASE_URL: wrong.toString() },
      1,
    ),
    /28P01/,
  );
  run("scripts/setup-database.mjs", [], setup, 1);
  console.log(
    "PASS isolated database provisioning, encoded password, migrations, permissions, diagnostics, administrator creation and preservation of existing credentials.",
  );
} finally {
  await pool.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
  await pool.query(`DROP ROLE IF EXISTS "${name}"`);
  await pool.end();
  for (const path of [output, credentials])
    if (existsSync(path)) unlinkSync(path);
}
