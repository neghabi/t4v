import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import { readFileSync, readdirSync, unlinkSync } from "node:fs";
import pg from "pg";

// This suite only targets the disposable accounts it creates in dev:local.
const base = "http://localhost:3000";
const config = JSON.parse(
  readFileSync(new URL("../.local/config.json", import.meta.url), "utf8"),
);
const pool = new pg.Pool({
  host: "127.0.0.1",
  port: 55432,
  user: "t4v",
  password: config.password,
  database: "t4v",
  options: "-c timezone=UTC",
});
const marker = randomBytes(5).toString("hex");
const users = [];
const password = randomBytes(18).toString("hex");
let checks = 0;
function pass(label) {
  checks++;
  console.log(`PASS ${label}`);
}
function session() {
  const cookies = new Map();
  return async (pathname, method = "GET", body, headers = {}) => {
    const response = await fetch(`${base}${pathname}`, {
      method,
      redirect: "manual",
      headers: {
        "X-Forwarded-For": `smoke-${marker}`,
        Cookie: [...cookies]
          .map(([key, value]) => `${key}=${value}`)
          .join("; "),
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    for (const value of response.headers.getSetCookie()) {
      const [key, ...rest] = value.split(";")[0].split("=");
      cookies.set(key, rest.join("="));
    }
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: response.status, headers: response.headers, data };
  };
}
const owner = session();
const other = session();
const visitor = session();

try {
  const health = await owner("/api/health");
  assert.equal(health.data.database, "connected");
  pass("local database health");

  for (const [client, name] of [
    [owner, "owner"],
    [other, "other"],
  ]) {
    const result = await client("/api/auth/register", "POST", {
      fullName: "Smoke Test User",
      phone: `+989${randomBytes(5).readUIntBE(0, 5).toString().padStart(10, "0").slice(-10)}`,
      activityType: "personal",
      intendedUse: "Testing local functionality",
      consent: true,
      email: `smoke-${marker}-${name}@t4v.test`,
      password,
    });
    assert.equal(result.status, 200, JSON.stringify(result.data));
    users.push(result.data.user.id);
  }
  pass("registration and authenticated session");
  await pool.query(
    "UPDATE users SET email_verified_at=NOW(),phone_verified_at=NOW(),identity_status='approved' WHERE id=ANY($1)",
    [users],
  );
  assert.equal(
    (await visitor("/api/shorten", "POST", { url: "https://example.com" }))
      .status,
    401,
  );
  pass("anonymous creation is rejected");

  const made = await owner("/api/shorten", "POST", {
    url: "https://example.com/private",
    password: "old-password",
    expiresInDays: 1,
  });
  assert.equal(made.status, 200, JSON.stringify(made.data));
  assert.equal(made.data.credits, 117);
  const code = made.data.code;
  await pool.query(
    "UPDATE short_links SET moderation_status='approved' WHERE code=$1",
    [code],
  );
  pass("shortening debits exactly three credits");

  const free = await owner("/api/qr", "POST", {
    url: made.data.shortUrl,
    shortCode: code,
  });
  assert.equal(free.status, 200);
  assert.equal(free.data.freeQr, true);
  assert.equal(free.data.credits, 117);
  const unrelated = await owner("/api/qr", "POST", {
    url: "https://example.com/unrelated",
    shortCode: code,
  });
  assert.equal(unrelated.status, 200);
  assert.equal(unrelated.data.freeQr, false);
  assert.equal(unrelated.data.credits, 116);
  pass("only the exact owned short URL gets a free QR");

  const failedQr = await owner("/api/qr", "POST", {
    url: `https://example.com/${"a".repeat(6000)}`,
  });
  assert.equal(failedQr.status, 400);
  assert.equal((await owner("/api/auth/me")).data.user.credits, 116);
  pass("oversized QR fails without spending credits");

  assert.equal(
    (
      await other(`/api/links/${code}`, "PATCH", {
        url: "https://example.com/stolen",
      })
    ).status,
    404,
  );
  assert.equal((await other(`/api/links/${code}`, "DELETE")).status, 404);
  pass("another account cannot modify or delete links");

  assert.match((await visitor(`/${code}`)).data, /gate-pw/);
  assert.equal(
    (
      await visitor(`/api/s/${code}/unlock`, "POST", {
        password: "old-password",
      })
    ).status,
    200,
  );
  assert.equal(
    (await visitor(`/${code}`)).headers.get("location"),
    "https://example.com/private",
  );
  assert.equal(
    (await owner(`/api/links/${code}`, "PATCH", { password: "new-password" }))
      .status,
    200,
  );
  await pool.query(
    "UPDATE short_links SET moderation_status='approved' WHERE code=$1",
    [code],
  );
  assert.match((await visitor(`/${code}`)).data, /gate-pw/);
  assert.equal(
    (
      await visitor(`/api/s/${code}/unlock`, "POST", {
        password: "old-password",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await visitor(`/api/s/${code}/unlock`, "POST", {
        password: "new-password",
      })
    ).status,
    200,
  );
  assert.equal(
    (await visitor(`/${code}`)).headers.get("location"),
    "https://example.com/private",
  );
  pass("changing a link password revokes previous unlock cookies");

  const blocked = [
    "http://[::1]",
    "http://169.254.169.254",
    "http://[::ffff:127.0.0.1]",
    "ftp://example.com",
    "http://localhost.",
    "http://[fd12::1]",
  ];
  for (const url of blocked)
    assert.equal(
      (await owner("/api/shorten", "POST", { url })).status,
      400,
      url,
    );
  pass("local IPv4, IPv6 and unsupported schemes are rejected");

  const keyResult = await owner("/api/user/api-keys", "POST", {
    name: "Smoke test key",
  });
  assert.equal(keyResult.status, 201, JSON.stringify(keyResult.data));
  const apiSecret = keyResult.data.secret;
  const apiHeaders = { Authorization: `Bearer ${apiSecret}` };
  await pool.query(
    "INSERT INTO link_clicks (link_code, clicked_at) SELECT $1, NOW() - interval '1 hour' FROM generate_series(1, 500)",
    [code],
  );
  await pool.query(
    "INSERT INTO link_clicks (link_code, clicked_at) SELECT $1, NOW() - interval '2 days' FROM generate_series(1, 30)",
    [code],
  );
  const detail = await owner(
    `/api/v1/links/${code}`,
    "GET",
    undefined,
    apiHeaders,
  );
  assert.equal(detail.status, 200, JSON.stringify(detail.data));
  assert.ok(detail.data.link.clicksLast24h >= 500);
  assert.ok(detail.data.link.clicksLast24h < 530);
  assert.equal(detail.data.link.recentClicksAt.length, 200);
  pass("24-hour analytics count more than the 200-event preview");

  for (let i = 0; i < 26; i++) {
    await pool.query(
      "INSERT INTO short_links (code, user_id, url, updated_at) VALUES ($1, $2, $3, NOW())",
      [`sm${marker}${i}`, users[0], `https://example.com/${i}`],
    );
  }
  const page1 = await owner(
    "/api/v1/links?page=1",
    "GET",
    undefined,
    apiHeaders,
  );
  const page2 = await owner(
    "/api/v1/links?page=2",
    "GET",
    undefined,
    apiHeaders,
  );
  assert.equal(page1.data.links.length, 25);
  assert.equal(page2.data.links.length, 2);
  assert.equal(page1.data.total, 27);
  assert.equal(
    new Set([...page1.data.links, ...page2.data.links].map((link) => link.code))
      .size,
    27,
  );
  pass("API pagination has bounded, distinct pages");

  for (let i = 0; i < 8; i++) {
    await pool.query(
      "INSERT INTO api_keys (id, user_id, name, key_prefix, key_hash) VALUES ($1, $2, 'seed', 'test', $3)",
      [
        randomBytes(8).toString("hex"),
        users[0],
        createHash("sha256").update(randomBytes(20)).digest("hex"),
      ],
    );
  }
  const concurrentKeys = await Promise.all([
    owner("/api/user/api-keys", "POST", { name: "Concurrent one" }),
    owner("/api/user/api-keys", "POST", { name: "Concurrent two" }),
  ]);
  assert.deepEqual(
    concurrentKeys.map((result) => result.status).sort(),
    [201, 400],
  );
  assert.equal(
    Number(
      (
        await pool.query("SELECT COUNT(*) FROM api_keys WHERE user_id = $1", [
          users[0],
        ])
      ).rows[0].count,
    ),
    10,
  );
  pass("concurrent key creation cannot exceed ten keys");

  for (let i = 0; i < 2; i++)
    await pool.query(
      "INSERT INTO credit_top_ups (id, user_id, requested_credits) VALUES ($1, $2, 100)",
      [randomBytes(8).toString("hex"), users[0]],
    );
  const topUps = await Promise.all([
    owner("/api/user/top-ups", "POST", { requestedCredits: 100 }),
    owner("/api/user/top-ups", "POST", { requestedCredits: 100 }),
  ]);
  assert.deepEqual(topUps.map((result) => result.status).sort(), [201, 400]);
  pass("concurrent top-ups cannot exceed three pending requests");

  const dashboard = await owner("/dashboard?page=2");
  assert.equal(dashboard.status, 200);
  assert.match(dashboard.data, /صفحهٔ قبل/);
  pass("authenticated dashboard renders paginated links");

  const idemKey = `smoke-${marker}`;
  const customCode = `test-${marker}`;
  const newBody = {
    url: "https://example.com/campaign",
    customCode,
    title: "Campaign test",
    tags: ["launch"],
  };
  const beforeIdem = (await owner("/api/auth/me")).data.user.credits;
  const duplicate = await Promise.all([
    owner("/api/shorten", "POST", newBody, { "Idempotency-Key": idemKey }),
    owner("/api/shorten", "POST", newBody, { "Idempotency-Key": idemKey }),
  ]);
  assert.ok(
    duplicate.every((r) => r.status === 200),
    JSON.stringify(duplicate),
  );
  assert.equal((await owner("/api/auth/me")).data.user.credits, beforeIdem - 3);
  assert.equal(
    (
      await owner(
        "/api/shorten",
        "POST",
        { ...newBody, title: "Changed" },
        { "Idempotency-Key": idemKey },
      )
    ).status,
    409,
  );
  assert.equal((await owner("/api/shorten", "POST", newBody)).status, 409);
  pass("custom slug collision and concurrent idempotency never double debit");
  const filtered = await owner(
    "/api/v1/links?q=Campaign%20test",
    "GET",
    undefined,
    { Authorization: `Bearer ${apiSecret}` },
  );
  assert.equal(filtered.data.total, 1);
  const exported = await owner("/api/user/export?q=Campaign%20test");
  assert.equal(exported.status, 200);
  assert.match(exported.data, /Campaign test/);
  pass("metadata search and CSV export are scoped to the account");
  await pool.query(
    "UPDATE short_links SET moderation_status='approved' WHERE code=$1",
    [customCode],
  );
  const redirected = await visitor(`/${customCode}`);
  assert.equal(redirected.status, 307);
  for (let attempt = 0; attempt < 30; attempt++) {
    const pending = await pool.query(
      "SELECT click_count FROM short_links WHERE code=$1",
      [customCode],
    );
    if (pending.rows[0].click_count === 1) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  const queued = await pool.query(
    "SELECT click_count FROM short_links WHERE code=$1",
    [customCode],
  );
  assert.equal(queued.rows[0].click_count, 1);
  const analytics = await owner(
    `/api/user/analytics?days=7&code=${customCode}`,
  );
  assert.equal(analytics.status, 200);
  assert.equal(analytics.data.total, 1);
  assert.equal(analytics.data.daily.length, 7);
  assert.equal(
    (await other(`/api/user/analytics?code=${customCode}`)).status,
    404,
  );
  pass("durable click worker populates private, zero-filled analytics");
  const beforePayment = (await owner("/api/auth/me")).data.user.credits;
  const payment = await owner(
    "/api/user/payments",
    "POST",
    { credits: 100 },
    { "Idempotency-Key": `payment-${marker}` },
  );
  assert.equal(payment.status, 201, JSON.stringify(payment.data));
  assert.equal(
    (
      await other(`/api/user/payments/${payment.data.id}/confirm`, "POST", {
        outcome: "paid",
      })
    ).status,
    404,
  );
  const confirms = await Promise.all([
    owner(`/api/user/payments/${payment.data.id}/confirm`, "POST", {
      outcome: "paid",
    }),
    owner(`/api/user/payments/${payment.data.id}/confirm`, "POST", {
      outcome: "paid",
    }),
  ]);
  assert.ok(confirms.every((r) => r.status === 200));
  assert.equal(
    (await owner("/api/auth/me")).data.user.credits,
    beforePayment + 100,
  );
  pass(
    "sandbox payment ownership and concurrent confirmation credit only once",
  );
  const sessions = await owner("/api/user/sessions");
  assert.equal(sessions.status, 200);
  assert.equal(sessions.data.sessions.filter((s) => s.current).length, 1);
  assert.equal((await owner("/api/auth/verify-email", "POST", {})).status, 200);
  const mailboxDir = new URL("../.local/mailbox/", import.meta.url);
  const ownMail = () =>
    readdirSync(mailboxDir)
      .map((file) => ({
        file,
        ...JSON.parse(readFileSync(new URL(file, mailboxDir), "utf8")),
      }))
      .filter((m) => m.to === `smoke-${marker}-owner@t4v.test`);
  const verifyToken = new URL(ownMail()[0].actionUrl).searchParams.get("token");
  assert.equal(
    (await visitor("/api/auth/verify-email", "POST", { token: verifyToken }))
      .status,
    200,
  );
  assert.equal(
    (await visitor("/api/auth/verify-email", "POST", { token: verifyToken }))
      .status,
    400,
  );
  pass(
    "verification tokens are single-use and sessions identify the current device",
  );

  await pool.query(
    "UPDATE short_links SET expires_at = NOW() - interval '1 minute' WHERE code = $1",
    [code],
  );
  const expired = await visitor(`/${code}`);
  assert.equal(expired.headers.get("location"), null);
  assert.match(expired.data, /این پیوند دیگر فعال نیست/);
  pass("expired links never redirect");

  assert.equal((await owner("/api/auth/logout", "POST")).status, 200);
  assert.equal((await owner("/api/auth/me")).data.user, null);
  pass("logout invalidates the session");
  assert.equal(
    (
      await visitor("/api/auth/forgot-password", "POST", {
        email: `smoke-${marker}-owner@t4v.test`,
      })
    ).status,
    200,
  );
  const resetMail = ownMail().find((m) =>
    m.actionUrl.includes("reset-password"),
  );
  const resetToken = new URL(resetMail.actionUrl).searchParams.get("token");
  const resetPassword = randomBytes(18).toString("hex");
  assert.equal(
    (
      await visitor("/api/auth/reset-password", "POST", {
        token: resetToken,
        password: resetPassword,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await visitor("/api/auth/reset-password", "POST", {
        token: resetToken,
        password: resetPassword,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await owner("/api/auth/login", "POST", {
        email: `smoke-${marker}-owner@t4v.test`,
        password: resetPassword,
      })
    ).status,
    200,
  );
  for (const mail of ownMail()) unlinkSync(new URL(mail.file, mailboxDir));
  pass("local email password reset is single-use and permits the new password");
  const readKey = await other("/api/user/api-keys", "POST", {
    name: "Read only",
    scopes: ["links:read"],
  });
  assert.equal(readKey.status, 201);
  const readHeaders = { Authorization: `Bearer ${readKey.data.secret}` };
  assert.equal(
    (await other("/api/v1/links", "GET", undefined, readHeaders)).status,
    200,
  );
  assert.equal(
    (
      await other(
        "/api/v1/links",
        "POST",
        { url: "https://example.com" },
        readHeaders,
      )
    ).status,
    401,
  );
  pass("read-only API keys cannot create links");
  const beforeCancel = (await owner("/api/auth/me")).data.user.credits;
  const cancelled = await owner(
    "/api/user/payments",
    "POST",
    { credits: 100 },
    { "Idempotency-Key": `cancelled-${marker}` },
  );
  assert.equal(
    (
      await owner(`/api/user/payments/${cancelled.data.id}/confirm`, "POST", {
        outcome: "cancelled",
      })
    ).status,
    200,
  );
  await owner(`/api/user/payments/${cancelled.data.id}/confirm`, "POST", {
    outcome: "paid",
  });
  assert.equal((await owner("/api/auth/me")).data.user.credits, beforeCancel);
  pass("cancelled sandbox payments cannot later add credits");
  const anotherSession = session();
  await anotherSession("/api/auth/login", "POST", {
    email: `smoke-${marker}-owner@t4v.test`,
    password: resetPassword,
  });
  const changedPassword = randomBytes(18).toString("hex");
  assert.equal(
    (
      await owner("/api/user/password", "POST", {
        currentPassword: resetPassword,
        newPassword: changedPassword,
      })
    ).status,
    200,
  );
  assert.equal((await anotherSession("/api/auth/me")).data.user, null);
  assert.ok((await owner("/api/auth/me")).data.user);
  pass(
    "changing account passwords revokes other sessions and keeps the current one",
  );
  console.log(`${checks} checks passed.`);
} finally {
  for (const id of users)
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
  await pool.end();
}
