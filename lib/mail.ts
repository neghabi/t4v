import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { localServicesEnabled } from "@/lib/localServices";
import { ApiError } from "@/lib/apiResponse";

export type TransactionalMail = {
  to: string;
  subject: string;
  text: string;
  actionUrl: string;
};
export async function sendTransactionalMail(mail: TransactionalMail) {
  if (!localServicesEnabled())
    throw new ApiError(
      "سرویس ارسال ایمیل هنوز تنظیم نشده است.",
      503,
      "mail_not_configured",
    );
  const directory = path.join(process.cwd(), ".local", "mailbox");
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, `${Date.now()}-${randomUUID()}.json`),
    JSON.stringify({ ...mail, createdAt: new Date().toISOString() }),
    { encoding: "utf8", mode: 0o600 },
  );
}
