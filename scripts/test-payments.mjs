import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomBytes, createHash } from "node:crypto";
import ts from "typescript";
import pg from "pg";
import { spawn } from "node:child_process";
// Exercise provider contracts with controlled responses, never real payments.
const source = readFileSync(
  new URL("../lib/paymentProviders.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
}).outputText;
const { requestProvider, verifyProvider, gatewayRedirect } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);
const authority = `A${"0".repeat(35)}`;
let outbound;
const mock = (response) => async (url, options) => {
  outbound = { url, body: JSON.parse(options.body) };
  return new Response(JSON.stringify(response), { status: 200 });
};
const baseInput = {
  provider: "zarinpal",
  mode: "live",
  merchant: "00000000-0000-0000-0000-000000000000",
  amount: 100000,
};
await requestProvider(
  {
    ...baseInput,
    callbackUrl: "https://example.com/callback",
    orderId: "test",
  },
  mock({ data: { code: 100, authority } }),
);
assert.equal(
  outbound.url,
  "https://payment.zarinpal.com/pg/v4/payment/request.json",
);
assert.equal(outbound.body.amount, 100000);
assert.equal(outbound.body.currency, "IRR");
const sandbox = await requestProvider(
  {
    ...baseInput,
    mode: "sandbox",
    callbackUrl: "http://localhost/callback",
    orderId: "test",
  },
  mock({ data: { code: 100, authority: `S${"1".repeat(35)}` } }),
);
assert.match(sandbox.url, /sandbox.zarinpal.com/);
assert.equal(
  (
    await verifyProvider(
      { ...baseInput, authority },
      mock({ data: { code: 101, ref_id: 1234 } }),
    )
  ).ok,
  true,
);
assert.equal(
  (
    await verifyProvider(
      { ...baseInput, authority },
      mock({ errors: { code: -51 } }),
    )
  ).ok,
  false,
);
await assert.rejects(
  () =>
    verifyProvider({ ...baseInput, authority }, mock({ data: { code: 100 } })),
  /missing_reference/,
);
await assert.rejects(
  () =>
    requestProvider(
      { ...baseInput, callbackUrl: "https://example.com", orderId: "test" },
      mock({ data: { code: -9 } }),
    ),
  /request_/,
);
await requestProvider(
  {
    ...baseInput,
    provider: "zibal",
    mode: "sandbox",
    merchant: "real-secret-must-not-be-used",
    callbackUrl: "http://localhost/callback",
    orderId: "test",
  },
  mock({ result: 100, trackId: 1234567 }),
);
assert.equal(outbound.body.merchant, "zibal");
assert.equal(
  (
    await verifyProvider(
      { ...baseInput, provider: "zibal", authority: "1234567" },
      mock({ result: 100, amount: 100000, refNumber: 777 }),
    )
  ).reference,
  "777",
);
await assert.rejects(
  () =>
    verifyProvider(
      { ...baseInput, provider: "zibal", authority: "1234567" },
      mock({ result: 100, amount: 99999, refNumber: 777 }),
    ),
  /amount_mismatch/,
);
assert.throws(() => gatewayRedirect("zarinpal", "live", "https://evil.test"));
await assert.rejects(
  () =>
    verifyProvider({ ...baseInput, authority }, async () => {
      throw Error("private response");
    }),
  /network_error/,
);
console.log(
  "PASS provider contracts: production/sandbox endpoints, rial amounts, replay verification, failed payment, missing reference, Zibal sandbox isolation, amount mismatch, redirect allowlist and network failure",
);

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
  options: "-c timezone=UTC",
});
const marker = randomBytes(6).toString("hex");
let userId;
const cookies = { admin: "", user: "" };
let original;
async function call(
  path,
  method = "GET",
  body,
  client = "admin",
  headers = {},
) {
  const r = await fetch(`http://localhost:3000${path}`, {
    method,
    redirect: "manual",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": `payments-test-${marker}`,
      Cookie: cookies[client] ?? "",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.headers.getSetCookie().length && client in cookies)
    cookies[client] = r.headers
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
    (await call("/api/admin/gateways", "GET", undefined, "anonymous")).status,
    401,
  );
  assert.equal(
    (await call("/api/dashboard/login", "POST", credentials)).status,
    200,
  );
  const before = await pool.query(
    "SELECT * FROM gateway_configs WHERE id='zarinpal'",
  );
  original = before.rows[0];
  if (original.enabled || original.credential_ciphertext) {
    console.log(
      "SKIP mutation test: configured ZarinPal gateway is preserved.",
    );
  } else {
    const merchant = "11111111-2222-4333-8444-555555555555";
    const settings = {
      title: "زرین‌پال",
      enabled: false,
      mode: "sandbox",
      unitPriceRial: 1234,
      priority: 10,
      merchant,
    };
    const saved = await call("/api/admin/gateways/zarinpal", "PATCH", settings);
    assert.equal(saved.status, 200);
    assert.equal(saved.data.gateway.hasCredentials, true);
    assert.ok(!JSON.stringify(saved.data).includes(merchant));
    const encrypted = (
      await pool.query(
        "SELECT credential_ciphertext FROM gateway_configs WHERE id='zarinpal'",
      )
    ).rows[0].credential_ciphertext;
    assert.ok(encrypted && !encrypted.includes(merchant));
    assert.equal(
      (
        await call("/api/admin/gateways/zarinpal", "PATCH", {
          ...settings,
          merchant: "",
          mode: "live",
          enabled: true,
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await call("/api/admin/gateways/zarinpal", "PATCH", {
          ...settings,
          unitPriceRial: -1,
        })
      ).status,
      400,
    );
    const masked = await call("/api/admin/gateways");
    assert.ok(!JSON.stringify(masked.data).includes(encrypted));
    assert.ok(masked.data.audit.some((a) => a.action === "settings_updated"));
    console.log(
      "PASS gateway admin: authorization, encrypted credentials, no secret disclosure, audit trail, invalid price and live localhost rejection",
    );
  }
  const registered = await call(
    "/api/auth/register",
    "POST",
    {
      fullName: "Payment Test User",
      phone: `+989${randomBytes(5).readUIntBE(0, 5).toString().padStart(10, "0").slice(-10)}`,
      activityType: "personal",
      intendedUse: "Testing local payments",
      consent: true,
      email: `payments-${marker}@t4v.test`,
      password: randomBytes(18).toString("hex"),
    },
    "user",
  );
  assert.equal(registered.status, 200);
  userId = registered.data.user.id;
  assert.equal(
    (await call("/api/admin/payments", "GET", undefined, "user")).status,
    401,
  );
  const paymentId = `online-${marker}`;
  const token = randomBytes(32).toString("base64url");
  const callbackHash = createHash("sha256").update(token).digest("hex");
  await pool.query(
    "INSERT INTO payments(id,user_id,credits,amount,provider,request_key,expires_at,gateway_id,gateway_mode,authority,callback_token) VALUES($1,$2,100,100000,'zarinpal',$3,NOW()+interval '15 minutes','zarinpal','sandbox',$4,$5)",
    [
      paymentId,
      userId,
      createHash("sha256").update(marker).digest("hex"),
      authority,
      callbackHash,
    ],
  );
  const balance = (await call("/api/auth/me", "GET", undefined, "user")).data
    .user.credits;
  assert.equal(
    (
      await call(
        `/api/user/payments/${paymentId}/confirm`,
        "POST",
        { outcome: "paid" },
        "user",
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await call(
        `/api/payments/callback/${paymentId}?token=wrong&Authority=${authority}`,
        "GET",
        undefined,
        "anonymous",
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await call(
        `/api/payments/callback/${paymentId}?token=${token}&Authority=wrong`,
        "GET",
        undefined,
        "anonymous",
      )
    ).status,
    400,
  );
  assert.equal(
    (await call("/api/auth/me", "GET", undefined, "user")).data.user.credits,
    balance,
  );
  const list = await call(`/api/admin/payments?q=${paymentId}`);
  assert.equal(list.status, 200);
  assert.equal(list.data.total, 1);
  assert.ok(!JSON.stringify(list.data).includes(callbackHash));
  const detail = await call(`/api/admin/payments/${paymentId}`);
  assert.equal(detail.status, 200);
  assert.equal(detail.data.payment.authority, authority);
  assert.equal(detail.data.payment.credentialSnapshot, undefined);
  const csv = await call(`/api/admin/payments/export?q=${paymentId}`);
  assert.equal(csv.status, 200);
  assert.match(csv.data, new RegExp(paymentId));
  assert.equal(
    (await call(`/checkout/${paymentId}`, "GET", undefined, "anonymous"))
      .status,
    307,
  );
  console.log(
    "PASS online payment boundary: regular-user rejection, blocked manual confirmation, forged callback token/authority rejection, no unverified credits, filtered admin list/detail/CSV and private receipt",
  );
  const maintenanceIds = [`exp-${marker}`, `crt-${marker}`, `vrf-${marker}`];
  for (const [index, id] of maintenanceIds.entries())
    await pool.query(
      "INSERT INTO payments(id,user_id,credits,amount,provider,request_key,expires_at,status,created_at,verify_lease_until) VALUES($1,$2,100,100000,'sandbox',$3,CASE WHEN $4=0 THEN NOW()-interval '1 minute' ELSE NOW()+interval '15 minutes' END,$5,NOW()-interval '6 minutes',CASE WHEN $4=2 THEN NOW()-interval '1 minute' ELSE NULL END)",
      [
        id,
        userId,
        createHash("sha256").update(id).digest("hex"),
        index,
        ["pending", "creating", "verifying"][index],
      ],
    );
  const worker = spawn(
    process.execPath,
    [
      new URL("./analytics-worker.mjs", import.meta.url).pathname.replace(
        /^\/(\w:)/,
        "$1",
      ),
    ],
    {
      env: {
        ...process.env,
        DATABASE_URL: `postgresql://t4v:${config.password}@127.0.0.1:55432/t4v`,
      },
      stdio: "ignore",
      windowsHide: true,
    },
  );
  try {
    let current = [];
    for (let attempt = 0; attempt < 40; attempt++) {
      const r = await pool.query(
        "SELECT id,status FROM payments WHERE id=ANY($1::text[])",
        [maintenanceIds],
      );
      current = maintenanceIds.map(
        (id) => r.rows.find((row) => row.id === id)?.status,
      );
      if (current.join(",") === "expired,request_unknown,pending") break;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    assert.deepEqual(current, ["expired", "request_unknown", "pending"]);
    console.log(
      "PASS payment maintenance: expiration and recovery from interrupted request/verification",
    );
  } finally {
    const stopped = new Promise((resolve) => worker.once("exit", resolve));
    worker.kill();
    await stopped;
  }
} finally {
  if (userId) await pool.query("DELETE FROM users WHERE id=$1", [userId]);
  if (original && !original.enabled && !original.credential_ciphertext)
    await pool.query(
      "UPDATE gateway_configs SET title=$1,enabled=$2,mode=$3,credential_ciphertext=$4,unit_price_rial=$5,priority=$6,updated_at=$7 WHERE id='zarinpal'",
      [
        original.title,
        original.enabled,
        original.mode,
        original.credential_ciphertext,
        original.unit_price_rial,
        original.priority,
        original.updated_at,
      ],
    );
  await pool.end();
}
