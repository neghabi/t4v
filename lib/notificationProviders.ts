import nodemailer from "nodemailer";

export async function sendSmtp(
  input: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
    to: string;
    subject: string;
    text: string;
  },
  factory = nodemailer.createTransport,
) {
  const transport = factory({
    host: input.host,
    port: input.port,
    secure: input.port === 465,
    requireTLS: true,
    auth: { user: input.user, pass: input.password },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
  });
  try {
    const info = await transport.sendMail({
      from: input.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    if (!info.accepted?.length) throw Error("Message not accepted");
  } finally {
    transport.close();
  }
}
export async function sendKavenegar(
  input: { key: string; template: string; phone: string; code: string },
  fetcher: typeof fetch = fetch,
) {
  const response = await fetcher(
    `https://api.kavenegar.com/v1/${encodeURIComponent(input.key)}/verify/lookup.json`,
    {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        receptor: input.phone.replace(/^\+98/, "0"),
        token: input.code,
        template: input.template,
        type: "sms",
      }),
    },
  );
  if (!response.ok) throw Error("Provider request rejected");
  const body = await response.json();
  if (
    body?.return?.status !== 200 ||
    !Array.isArray(body.entries) ||
    !body.entries.length ||
    !body.entries[0].messageid
  )
    throw Error("Provider did not accept the message");
}
