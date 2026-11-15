import assert from "node:assert/strict";
import { readFileSync, readdirSync, unlinkSync } from "node:fs";
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
  password: config.password,
  database: "t4v",
});
const marker = randomBytes(5).toString("hex");
const userIds = [];
const messageFiles = [];
const phone = `+989${String(randomBytes(5).readUIntBE(0, 5)).padStart(10, "0").slice(-10)}`;
function client() {
  const cookies = new Map();
  return async (path, method = "GET", body, headers = {}) => {
    const response = await fetch(`http://localhost:3000${path}`, {
      method,
      redirect: "manual",
      headers: {
        "X-Forwarded-For": `identity-${marker}`,
        Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; "),
        ...(!(body instanceof FormData) && body
          ? { "Content-Type": "application/json" }
          : {}),
        ...headers,
      },
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    });
    for (const value of response.headers.getSetCookie()) {
      const [k, ...v] = value.split(";")[0].split("=");
      cookies.set(k, v.join("="));
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    let data;
    try {
      data = JSON.parse(Buffer.from(bytes).toString());
    } catch {
      data = Buffer.from(bytes).toString();
    }
    return { status: response.status, data, bytes, headers: response.headers };
  };
}
const admin = client(),
  user = client(),
  outsider = client(),
  second = client();
const previousNotificationRows = (
  await pool.query(
    "SELECT * FROM notification_configs WHERE id IN ('email','sms')",
  )
).rows;
let settingsTouched = false;
async function profile() {
  return (await user("/api/user/identity")).data.profile;
}
async function revision(code) {
  return Number(
    (
      await pool.query(
        "SELECT (extract(epoch FROM updated_at)*1000)::bigint AS revision FROM short_links WHERE code=$1",
        [code],
      )
    ).rows[0].revision,
  );
}
function mailbox(channel, to) {
  const directory = new URL(`../.local/${channel}/`, import.meta.url);
  for (const filename of readdirSync(directory).sort().reverse()) {
    const path = new URL(filename, directory);
    const value = JSON.parse(readFileSync(path, "utf8"));
    if (value.to === to) {
      messageFiles.push(path);
      return value;
    }
  }
  throw Error("Local message not found");
}
try {
  assert.equal(
    (
      await user("/api/auth/register", "POST", {
        email: `invalid-${marker}@t4v.test`,
        password: "testing-password",
      })
    ).status,
    400,
  );
  const registered = await user("/api/auth/register", "POST", {
    email: `identity-${marker}@t4v.test`,
    password: "testing-password",
    fullName: "Identity Test",
    phone,
    activityType: "personal",
    intendedUse: "Test responsible content sharing",
    consent: true,
  });
  assert.equal(registered.status, 200, JSON.stringify(registered.data));
  const id = registered.data.user.id;
  userIds.push(id);
  const secondRegistration = await second("/api/auth/register", "POST", {
    email: `identity-second-${marker}@t4v.test`,
    password: "testing-password",
    fullName: "Other Test User",
    phone,
    activityType: "personal",
    intendedUse: "Independent testing account",
    consent: true,
  });
  assert.equal(secondRegistration.status, 200);
  userIds.push(secondRegistration.data.user.id);
  assert.equal(
    (await admin("/api/dashboard/login", "POST", credentials)).status,
    200,
  );
  const created = await user("/api/shorten", "POST", {
    url: "https://example.com/identity",
  });
  assert.equal(created.status, 200);
  const code = created.data.code;
  for (const path of [`/${code}`, `/s/${code}`])
    assert.equal((await outsider(path)).headers.get("location"), null);
  assert.equal(
    (
      await admin(`/api/admin/links/${code}`, "PATCH", {
        moderationStatus: "approved",
        revision: await revision(code),
      })
    ).status,
    409,
  );
  console.log(
    "PASS registration requires profile; new links cannot redirect or bypass identity review",
  );
  assert.equal(
    (await user("/api/user/identity/phone", "POST", { action: "send" })).status,
    200,
  );
  assert.equal(
    (await user("/api/user/identity/phone", "POST", { action: "send" })).status,
    429,
  );
  const sms = mailbox("sms", phone);
  let otp = sms.text.match(/\b\d{6}\b/)[0];
  const wrongCode = otp === "111111" ? "222222" : "111111";
  assert.equal(
    (
      await user("/api/user/identity/phone", "POST", {
        action: "verify",
        code: wrongCode,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await pool.query(
        "SELECT attempts FROM phone_challenges WHERE user_id=$1",
        [id],
      )
    ).rows[0].attempts,
    1,
  );
  await pool.query("UPDATE phone_challenges SET attempts=4 WHERE user_id=$1", [
    id,
  ]);
  assert.equal(
    (
      await user("/api/user/identity/phone", "POST", {
        action: "verify",
        code: wrongCode,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await user("/api/user/identity/phone", "POST", {
        action: "verify",
        code: otp,
      })
    ).status,
    400,
  );
  await pool.query(
    "UPDATE phone_challenges SET created_at=NOW()-INTERVAL '61 seconds' WHERE user_id=$1",
    [id],
  );
  assert.equal(
    (await user("/api/user/identity/phone", "POST", { action: "send" })).status,
    200,
  );
  otp = mailbox("sms", phone).text.match(/\b\d{6}\b/)[0];
  assert.equal(
    (
      await user("/api/user/identity/phone", "POST", {
        action: "verify",
        code: otp,
      })
    ).status,
    200,
  );
  assert.equal(
    (await second("/api/user/identity/phone", "POST", { action: "send" }))
      .status,
    409,
  );
  assert.equal(
    (
      await user("/api/user/identity/phone", "POST", {
        action: "verify",
        code: otp,
      })
    ).status,
    400,
  );
  assert.equal((await user("/api/auth/verify-email", "POST", {})).status, 200);
  const mail = mailbox("mailbox", registered.data.user.email);
  assert.equal(
    (
      await user("/api/auth/verify-email", "POST", {
        token: new URL(mail.actionUrl).searchParams.get("token"),
      })
    ).status,
    200,
  );
  console.log(
    "PASS phone cooldown, failed-attempt persistence, single-use OTP and email verification",
  );
  const bytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aG1cAAAAASUVORK5CYII=",
    "base64",
  );
  const form = new FormData();
  form.set("kind", "identity");
  form.set("consent", "true");
  form.set("file", new Blob([bytes], { type: "image/png" }), "identity.png");
  const uploaded = await user("/api/user/identity/documents", "POST", form);
  assert.equal(uploaded.status, 201, JSON.stringify(uploaded.data));
  const docId = uploaded.data.document.id;
  assert.ok(!JSON.stringify(uploaded.data).includes("encryptedData"));
  const encrypted = (
    await pool.query(
      "SELECT encrypted_data FROM identity_documents WHERE id=$1",
      [docId],
    )
  ).rows[0].encrypted_data;
  assert.notDeepEqual(encrypted, bytes);
  assert.equal(
    (await outsider(`/api/user/identity/documents/${docId}`)).status,
    401,
  );
  assert.equal(
    (await second(`/api/user/identity/documents/${docId}`)).status,
    404,
  );
  assert.equal(
    (await outsider(`/api/admin/identity-documents/${docId}`)).status,
    401,
  );
  assert.deepEqual(
    Buffer.from((await user(`/api/user/identity/documents/${docId}`)).bytes),
    bytes,
  );
  const downloaded = await admin(`/api/admin/identity-documents/${docId}`);
  assert.equal(downloaded.status, 200);
  assert.match(downloaded.headers.get("content-disposition"), /attachment/);
  assert.equal(
    (
      await admin(`/api/admin/identity-documents/${docId}`, "PATCH", {
        status: "approved",
        note: "Verified test document",
      })
    ).status,
    200,
  );
  let current = await profile();
  assert.equal(
    (
      await admin(`/api/admin/users/${id}/review`, "POST", {
        identityStatus: "approved",
        note: "Verified test profile",
        revision: current.updatedAt,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await admin(`/api/admin/links/${code}`, "PATCH", {
        moderationStatus: "approved",
        note: "Reviewed content",
        revision: await revision(code),
      })
    ).status,
    200,
  );
  assert.equal(
    (await outsider(`/${code}`)).headers.get("location"),
    "https://example.com/identity",
  );
  console.log(
    "PASS encrypted document storage, private download, download audit, document/profile approval and approved redirect",
  );
  const stale = await revision(code);
  assert.equal(
    (
      await user(`/api/links/${code}`, "PATCH", {
        url: "https://example.com/changed",
      })
    ).status,
    200,
  );
  assert.equal((await outsider(`/${code}`)).headers.get("location"), null);
  assert.equal(
    (
      await admin(`/api/admin/links/${code}`, "PATCH", {
        moderationStatus: "approved",
        revision: stale,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await admin(`/api/admin/links/${code}`, "PATCH", {
        moderationStatus: "approved",
        revision: await revision(code),
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await admin(`/api/admin/links/${code}`, "PATCH", {
        moderationStatus: "suspended",
        note: "Test suspension",
        revision: await revision(code),
      })
    ).status,
    200,
  );
  assert.equal((await outsider(`/${code}`)).headers.get("location"), null);
  assert.equal(
    (
      await admin(`/api/admin/links/${code}`, "PATCH", {
        moderationStatus: "approved",
        revision: await revision(code),
      })
    ).status,
    200,
  );
  assert.equal(
    (await user(`/api/user/identity/documents/${docId}`, "DELETE")).status,
    200,
  );
  assert.equal((await outsider(`/${code}`)).headers.get("location"), null);
  assert.equal(
    (
      await admin(`/api/admin/links/${code}`, "PATCH", {
        moderationStatus: "approved",
        revision: await revision(code),
      })
    ).status,
    409,
  );
  console.log(
    "PASS edits invalidate approval; stale reviews rejected; suspension and document withdrawal stop redirects",
  );
  const key = await user("/api/user/api-keys", "POST", {
    name: "Identity test key",
  });
  assert.equal(key.status, 201);
  current = await profile();
  assert.equal(
    (
      await admin(`/api/admin/users/${id}/review`, "POST", {
        accountStatus: "suspended",
        note: "Test account suspension",
        revision: current.updatedAt,
      })
    ).status,
    200,
  );
  assert.equal((await user("/api/user/identity")).status, 401);
  assert.equal(
    (
      await outsider("/api/v1/links", "GET", undefined, {
        Authorization: `Bearer ${key.data.secret}`,
      })
    ).status,
    401,
  );
  assert.equal((await outsider("/api/admin/notifications")).status, 401);
  const settings = await admin("/api/admin/notifications");
  assert.equal(settings.status, 200);
  assert.ok(!JSON.stringify(settings.data).includes("encryptedToken"));
  assert.ok(
    (
      await pool.query(
        "SELECT count(*)::int AS count FROM moderation_audits WHERE subject_id=$1",
        [id],
      )
    ).rows[0].count >= 6,
  );
  console.log(
    "PASS suspended accounts lose sessions/API access; notification settings and audit remain admin-only",
  );
  settingsTouched = true;
  assert.equal(
    (
      await admin("/api/admin/notifications", "POST", {
        channel: "email",
        provider: "webhook",
        endpoint: "http://127.0.0.1/send",
        token: "test-secret",
      })
    ).status,
    400,
  );
  const token = `identity-secret-${marker}`;
  assert.equal(
    (
      await admin("/api/admin/notifications", "POST", {
        channel: "email",
        provider: "smtp",
        smtpHost: "smtp.example.com",
        smtpPort: "587",
        smtpUser: "sender",
        smtpFrom: "sender@example.com",
        token,
      })
    ).status,
    200,
  );
  const masked = await admin("/api/admin/notifications");
  assert.ok(!JSON.stringify(masked.data).includes(token));
  const stored = (
    await pool.query(
      "SELECT encrypted_token FROM notification_configs WHERE id='email'",
    )
  ).rows[0].encrypted_token;
  assert.ok(stored && !stored.includes(token));
  assert.equal(
    (
      await admin("/api/admin/notifications", "POST", {
        channel: "email",
        provider: "disabled",
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await admin("/api/admin/notifications", "POST", {
        channel: "email",
        action: "test",
        to: "recipient@example.com",
      })
    ).status,
    503,
  );
  assert.equal(
    (
      await admin("/api/admin/notifications", "POST", {
        channel: "sms",
        provider: "kavenegar",
        template: "verify",
        token,
      })
    ).status,
    200,
  );
  console.log(
    "PASS settings validate endpoints, encrypt SMTP/SMS secrets, mask credentials and refuse disabled delivery without any real external send",
  );
} finally {
  if (settingsTouched) {
    await pool.query(
      "DELETE FROM notification_configs WHERE id IN ('email','sms')",
    );
    for (const row of previousNotificationRows)
      await pool.query(
        "INSERT INTO notification_configs (id,provider,endpoint,encrypted_token,updated_at,options) VALUES ($1,$2,$3,$4,$5,$6)",
        [
          row.id,
          row.provider,
          row.endpoint,
          row.encrypted_token,
          row.updated_at,
          JSON.stringify(row.options),
        ],
      );
  }
  if (userIds.length) {
    await pool.query("DELETE FROM users WHERE id=ANY($1)", [userIds]);
    await pool.query("DELETE FROM moderation_audits WHERE subject_id=ANY($1)", [
      userIds,
    ]);
  }
  for (const path of messageFiles) {
    try {
      unlinkSync(path);
    } catch {}
  }
  await pool.end();
}
