import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import pg from "pg";

// Local integration only: exercise the real running worker and private report.
const config = JSON.parse(
  readFileSync(new URL("../.local/config.json", import.meta.url), "utf8"),
);
const credentials = JSON.parse(
  readFileSync(new URL("../.local/admin-admin.json", import.meta.url), "utf8"),
);
const pool = new pg.Pool({
  host: "127.0.0.1",
  port: 55432,
  database: "t4v",
  user: "t4v",
  password: config.password,
});
const id = randomBytes(10).toString("hex");
const code = `report-${randomBytes(5).toString("hex")}`;
const email = `report-${id}@example.test`;
const base = "http://127.0.0.1:3000";
try {
  const unauth = await fetch(`${base}/admin/reports`, { redirect: "manual" });
  const unauthHtml = await unauth.text();
  assert.ok(
    unauth.status === 307 ||
      (unauth.status === 200 && unauthHtml.includes("NEXT_REDIRECT")),
    "Reports must redirect unauthenticated requests, including streamed redirects",
  );
  assert.ok(
    !unauthHtml.includes("click_batch_completed") &&
      !unauthHtml.includes("۵۰ کلیک پردازش‌شدهٔ اخیر"),
    "Unauthenticated requests must not receive report contents",
  );
  const login = await fetch(`${base}/api/dashboard/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": id },
    body: JSON.stringify({
      username: credentials.username,
      password: credentials.password,
    }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  await pool.query(
    "INSERT INTO users(id,email,password_hash,credits,updated_at,full_name) VALUES($1,$2,'test-only',17,NOW(),'Reporting fixture')",
    [id, email],
  );
  await pool.query(
    "INSERT INTO short_links(code,user_id,url,updated_at) VALUES($1,$2,'https://example.com',NOW())",
    [code, id],
  );
  await pool.query(
    "INSERT INTO credit_ledger(user_id,delta,reason) VALUES($1,-3,'reporting integration test')",
    [id],
  );
  for (let n = 0; n < 3; n++)
    await pool.query(
      "INSERT INTO click_events(id,link_code,ip_hash,user_agent) VALUES($1,$2,$3,'Mozilla/5.0')",
      [`${id}${n}`, code, "a".repeat(64)],
    );
  let done = false;
  for (let n = 0; n < 40; n++) {
    const result = await pool.query(
      "SELECT click_count,(SELECT COUNT(*) FROM link_clicks WHERE link_code=$1)::int AS processed,(SELECT COUNT(*) FROM click_events WHERE link_code=$1)::int AS pending FROM short_links WHERE code=$1",
      [code],
    );
    const row = result.rows[0];
    if (row.click_count === 3 && row.processed === 3 && row.pending === 0) {
      done = true;
      break;
    }
    await delay(500);
  }
  assert.ok(
    done,
    "Worker must persist all three events, increment exactly three times, and drain the queue",
  );
  await delay(1000);
  const counts = await pool.query(
    "SELECT click_count FROM short_links WHERE code=$1",
    [code],
  );
  assert.equal(
    counts.rows[0].click_count,
    3,
    "Subsequent worker passes must not duplicate clicks",
  );
  const response = await fetch(
    `${base}/admin/reports?q=${encodeURIComponent(email)}`,
    { headers: { Cookie: cookie } },
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  const html = await response.text();
  assert.ok(
    html.includes(email),
    "Filtered user and event owner must be shown",
  );
  assert.ok(html.includes(code), "Processed click code must be visible");
  assert.ok(
    html.includes("reporting integration test"),
    "Credit reason must be visible",
  );
  assert.ok(
    !html.includes("a".repeat(64)),
    "Visitor IP hashes must remain private",
  );
  console.log(
    "PASS reporting: worker drains queue, exact click counts, no duplicate processing, administrator authorization, private cache headers, user search, click and credit logs",
  );
} finally {
  await pool.query("DELETE FROM users WHERE id=$1", [id]);
  await pool.end();
}
