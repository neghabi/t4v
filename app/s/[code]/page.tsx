import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { GATE_COOKIE_NAME, verifyGatePayload } from "@/lib/gateToken";
import { getRecord, recordClick, enqueueClick } from "@/lib/urlStore";
import { LinkGateForm } from "@/components/LinkGateForm";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function ShortLinkPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!code || code.length > 32) {
    redirect("/");
  }

  const rec = await getRecord(code);
  if (!rec) {
    redirect("/");
  }

  if (rec.moderationStatus !== "approved")
    return (
      <main
        className="mesh-bg flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"
        dir="rtl"
      >
        <h1 className="text-2xl font-bold">این لینک در حال حاضر فعال نیست</h1>
        <p>
          فعال‌سازی لینک به تأیید مدیر و تکمیل احراز هویت صاحب حساب نیاز دارد.
        </p>
        <Link className="button-secondary" href="/">
          بازگشت به خانه
        </Link>
      </main>
    );
  const now = Date.now();
  if (rec.expiresAt != null && rec.expiresAt < now) {
    return (
      <div className="mesh-bg flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          لینک منقضی شده
        </p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
          این پیوند دیگر فعال نیست
        </h1>
        <p className="mt-2 max-w-md text-slate-600 dark:text-slate-400">
          زمان اعتبار این لینک کوتاه به پایان رسیده است. در صورت نیاز از فرستندهٔ
          لینک نسخهٔ جدید بخواهید.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
        >
          بازگشت به خانه
        </Link>
      </div>
    );
  }

  const jar = await cookies();
  const gateCookie = jar.get(GATE_COOKIE_NAME)?.value;
  const gateOk =
    !rec.passwordHash || verifyGatePayload(code, gateCookie, rec.passwordHash);

  if (!gateOk) {
    return <LinkGateForm code={code} />;
  }

  const requestHeaders = await headers();
  const metadata = {
    ip:
      requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip"),
    referer: requestHeaders.get("referer"),
    userAgent: requestHeaders.get("user-agent"),
  };
  try {
    await enqueueClick(code, metadata);
  } catch {
    after(async () => {
      try {
        await recordClick(code, metadata);
      } catch {
        console.error("Failed to record link click", code);
      }
    });
  }
  redirect(rec.url);
}
