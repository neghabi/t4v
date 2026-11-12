import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import pg from "pg";
const config = JSON.parse(
  readFileSync(new URL("../.local/config.json", import.meta.url), "utf8"),
);
const credentials = JSON.parse(
  readFileSync(new URL("../.local/admin-admin.json", import.meta.url), "utf8"),
);
const pool = new pg.Pool({
  host: "127.0.0.1",
  port: 55432,
  user: "t4v",
  database: "t4v",
  password: config.password,
});
const marker = randomBytes(6).toString("hex");
let cookie = "";
let userId;
const temporaryId = randomBytes(12).toString("hex");
async function request(path, method = "GET", body, authenticated = true) {
  const r = await fetch(`http://localhost:3000${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": `admin-test-${marker}`,
      ...(authenticated ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (authenticated && r.headers.getSetCookie().length)
    cookie = r.headers
      .getSetCookie()
      .map((v) => v.split(";")[0])
      .join("; ");
  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: r.status, data };
}
try {
  assert.equal(
    (await request("/api/admin/users", "GET", undefined, false)).status,
    401,
  );
  assert.equal(
    (
      await request("/api/dashboard/login", "POST", {
        username: "missing-admin",
        password: credentials.password,
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await request("/api/dashboard/login", "POST", {
        username: credentials.username,
        password: credentials.password,
      })
    ).status,
    200,
  );
  assert.equal((await request("/api/dashboard/me")).data.authenticated, true);
  assert.equal((await request("/api/admin/users")).status, 200);
  assert.equal((await request("/api/admin/top-ups")).status, 200);
  const created = await request("/api/admin/users", "POST", {
    email: `admin-test-${marker}@t4v.test`,
    password: randomBytes(16).toString("hex"),
    credits: 120,
  });
  assert.equal(created.status, 201);
  userId = created.data.user.id;
  const updated = await request(`/api/admin/users/${userId}`, "PATCH", {
    credits: 250,
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.user.credits, 250);
  const code = `admin-${marker}`;
  await pool.query(
    "INSERT INTO short_links (code,user_id,url,updated_at) VALUES ($1,$2,$3,NOW())",
    [code, userId, "https://example.com/admin-test"],
  );
  assert.equal(
    (
      await request(
        `/api/admin/links/${code}`,
        "PATCH",
        { title: "Admin changed" },
        false,
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await request(`/api/admin/links/${code}`, "PATCH", {
        title: "Admin changed",
        url: "https://example.com/admin-updated",
      })
    ).status,
    200,
  );
  assert.equal(
    (await request(`/api/admin/links/${code}`, "DELETE")).status,
    200,
  );
  assert.equal(
    (await request(`/api/admin/users/${userId}`, "DELETE")).status,
    200,
  );
  userId = null;
  assert.equal((await request("/admin")).status, 200);
  await request("/api/dashboard/logout", "POST");
  assert.equal((await request("/api/dashboard/me")).data.authenticated, false);
  const account = await pool.query(
    "SELECT password_hash FROM admin_accounts WHERE username=$1",
    [credentials.username],
  );
  await pool.query(
    "INSERT INTO admin_accounts (id,username,password_hash) VALUES ($1,$2,$3)",
    [temporaryId, `test-${marker}`, account.rows[0].password_hash],
  );
  await request("/api/dashboard/login", "POST", {
    username: `test-${marker}`,
    password: credentials.password,
  });
  assert.equal((await request("/api/dashboard/me")).data.authenticated, true);
  await pool.query("DELETE FROM admin_accounts WHERE id=$1", [temporaryId]);
  assert.equal((await request("/api/dashboard/me")).data.authenticated, false);
  console.log(
    "PASS admin login, rejected credentials, protected APIs, user creation/update/deletion, top-up access, logout and account revocation",
  );
} finally {
  if (userId) await pool.query("DELETE FROM users WHERE id=$1", [userId]);
  await pool.query("DELETE FROM admin_accounts WHERE id=$1", [temporaryId]);
  await pool.end();
}
