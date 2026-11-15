import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = readFileSync(
  new URL("../lib/notificationProviders.ts", import.meta.url),
  "utf8",
).replace(
  'import nodemailer from "nodemailer";',
  'const nodemailer = { createTransport() { throw Error("Real SMTP disabled in contract test"); } };',
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { sendSmtp, sendKavenegar } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);
let captured,
  closed = false,
  mail;
const factory = (options) => {
  captured = options;
  return {
    async sendMail(message) {
      mail = message;
      return { accepted: [message.to] };
    },
    close() {
      closed = true;
    },
  };
};
const input = {
  host: "smtp.example.com",
  port: 587,
  user: "sender",
  password: "test-secret",
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Test",
  text: "Test body",
};
await sendSmtp(input, factory);
assert.equal(captured.secure, false);
assert.equal(captured.requireTLS, true);
assert.equal(captured.disableFileAccess, true);
assert.equal(captured.disableUrlAccess, true);
assert.equal(captured.logger, false);
assert.equal(mail.text, input.text);
assert.ok(closed);
await sendSmtp({ ...input, port: 465 }, factory);
assert.equal(captured.secure, true);
closed = false;
await assert.rejects(
  sendSmtp(input, () => ({
    async sendMail() {
      throw Error("SMTP failure");
    },
    close() {
      closed = true;
    },
  })),
);
assert.ok(closed);
let request;
const sms = {
  key: "test-key",
  phone: "+989121234567",
  template: "verify",
  code: "123456",
};
await sendKavenegar(sms, async (url, options) => {
  request = { url, options };
  return Response.json({
    return: { status: 200 },
    entries: [{ messageid: 123 }],
  });
});
assert.equal(
  request.url,
  "https://api.kavenegar.com/v1/test-key/verify/lookup.json",
);
assert.equal(request.options.redirect, "error");
assert.equal(request.options.method, "POST");
assert.equal(request.options.body.get("receptor"), "09121234567");
assert.equal(request.options.body.get("token"), sms.code);
for (const body of [
  { return: { status: 403 } },
  { return: { status: 200 }, entries: [] },
  { return: { status: 200 }, entries: [{}] },
])
  await assert.rejects(sendKavenegar(sms, async () => Response.json(body)));
await assert.rejects(
  sendKavenegar(sms, async () => {
    throw Error("Network failure");
  }),
);
console.log(
  "PASS notification contracts: SMTP TLS, timeouts, no file/URL access, closed connections; Kavenegar fixed host, OTP template, acceptance validation and network failure.",
);
