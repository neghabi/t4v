import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import EmbeddedPostgres from "embedded-postgres";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localDir = path.join(root, ".local");
mkdirSync(localDir, { recursive: true });
const configPath = path.join(localDir, "config.json");
if (!existsSync(configPath)) {
  writeFileSync(
    configPath,
    JSON.stringify(
      {
        password: randomBytes(24).toString("hex"),
        appSecret: randomBytes(48).toString("hex"),
        adminSecret: randomBytes(24).toString("hex"),
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
}
const config = JSON.parse(readFileSync(configPath, "utf8"));
const port = Number(process.env.PORT || 3000);
const dbPort = 55432;
const env = {
  ...process.env,
  DATABASE_URL: `postgresql://t4v:${config.password}@127.0.0.1:${dbPort}/t4v?schema=public`,
  APP_SECRET: config.appSecret,
  DASHBOARD_SECRET: config.adminSecret,
  PUBLIC_SHORT_URL_BASE: `http://localhost:${port}`,
  COOKIE_SECURE: "false",
  T4V_LOCAL_SERVICES: "true",
};
const databaseDir = path.join(localDir, "postgres-utf8");
const database = new EmbeddedPostgres({
  databaseDir,
  user: "t4v",
  password: config.password,
  port: dbPort,
  persistent: true,
  authMethod: "scram-sha-256",
  autoRehydrateSymlinks: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  postgresFlags: ["-h", "127.0.0.1", "-c", "timezone=UTC"],
  onLog: () => {},
  onError: (error) => console.error(String(error)),
});

function run(relativeFile, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(root, relativeFile), ...args],
      {
        cwd: root,
        env,
        stdio: "inherit",
        windowsHide: true,
      },
    );
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`Command failed (${code})`)),
    );
  });
}

try {
  if (!existsSync(path.join(databaseDir, "PG_VERSION")))
    await database.initialise();
  await database.start();
  const client = database.getPgClient("postgres", "127.0.0.1");
  await client.connect();
  try {
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 't4v'",
    );
    if (result.rowCount === 0) await client.query('CREATE DATABASE "t4v"');
  } finally {
    await client.end();
  }
  await run("node_modules/prisma/build/index.js", ["generate"]);
  await run("node_modules/prisma/build/index.js", ["migrate", "deploy"]);
  console.log(`Local site: http://localhost:${port}`);
  console.log(
    "Admin login: /admin. Run npm run admin:create -- admin to create a named account; credentials are saved in .local/admin-admin.json.",
  );
  const worker = spawn(
    process.execPath,
    [path.join(root, "scripts/analytics-worker.mjs")],
    { cwd: root, env, stdio: "inherit", windowsHide: true },
  );
  try {
    await run("node_modules/next/dist/bin/next", [
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ]);
  } finally {
    worker.kill();
  }
} finally {
  await database.stop();
}
