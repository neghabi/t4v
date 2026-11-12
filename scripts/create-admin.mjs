import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import pg from "pg";
const configFile = new URL("../.local/config.json", import.meta.url);
const local = existsSync(configFile)
  ? JSON.parse(readFileSync(configFile, "utf8"))
  : null;
const username = (process.argv[2] ?? "admin").toLowerCase();
if (!/^[a-z0-9_-]{3,64}$/.test(username))
  throw Error("Username must be 3–64 letters, digits, underscores or hyphens.");
const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ??
    (local
      ? `postgresql://t4v:${local.password}@127.0.0.1:55432/t4v`
      : undefined),
});
try {
  const existing = await pool.query(
    "SELECT id FROM admin_accounts WHERE username=$1",
    [username],
  );
  if (existing.rowCount) {
    console.log(
      `Admin ${username} already exists; its password was not changed.`,
    );
  } else {
    const password = randomBytes(18).toString("base64url");
    const salt = randomBytes(16);
    const key = await promisify(scryptCallback)(password, salt, 32);
    await pool.query(
      "INSERT INTO admin_accounts (id,username,password_hash) VALUES ($1,$2,$3)",
      [
        randomBytes(12).toString("hex"),
        username,
        `v1:${salt.toString("base64url")}:${key.toString("base64url")}`,
      ],
    );
    mkdirSync(new URL("../.local/", import.meta.url), { recursive: true });
    writeFileSync(
      new URL(`../.local/admin-${username}.json`, import.meta.url),
      JSON.stringify(
        { url: "http://localhost:3000/admin", username, password },
        null,
        2,
      ),
      { mode: 0o600 },
    );
    console.log(
      `Created full-access administrator ${username}. Credentials saved privately in .local/admin-${username}.json.`,
    );
  }
} finally {
  await pool.end();
}
