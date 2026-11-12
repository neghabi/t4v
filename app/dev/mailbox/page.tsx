import Link from "next/link";
import { notFound } from "next/navigation";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { localServicesEnabled } from "@/lib/localServices";
import { Brand } from "@/components/SiteChrome";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "ایمیل‌های آزمایشی",
  robots: { index: false, follow: false },
};
export default async function Page() {
  if (!localServicesEnabled()) notFound();
  const dir = path.join(process.cwd(), ".local", "mailbox");
  const files = await readdir(dir).catch(() => []);
  const messages = await Promise.all(
    files
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse()
      .slice(0, 50)
      .map(
        async (f) =>
          JSON.parse(await readFile(path.join(dir, f), "utf8")) as {
            to: string;
            subject: string;
            text: string;
            actionUrl: string;
            createdAt: string;
          },
      ),
  );
  return (
    <main className="site-container py-10">
      <Brand />
      <h1 className="mt-10 text-2xl font-bold">صندوق ایمیل آزمایشی محلی</h1>
      <p className="notice my-5">
        فقط در محیط توسعه فعال است. ایمیلی به اینترنت ارسال نمی‌شود.
      </p>
      <Link className="button-secondary mb-5" href="/dashboard?view=security">
        بازگشت به حساب
      </Link>
      <div className="grid gap-4">
        {messages.length ? (
          messages.map((m, i) => (
            <article key={i} className="surface p-6">
              <p className="section-note" dir="ltr">
                {m.to} · {new Date(m.createdAt).toLocaleString("fa-IR")}
              </p>
              <h2 className="my-3 font-bold">{m.subject}</h2>
              <p className="mb-4 text-sm">{m.text}</p>
              <a href={m.actionUrl} className="button-primary">
                باز کردن لینک ایمیل
              </a>
            </article>
          ))
        ) : (
          <p className="empty-state">هنوز ایمیلی ارسال نشده است.</p>
        )}
      </div>
    </main>
  );
}
