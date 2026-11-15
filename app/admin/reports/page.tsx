import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  DASHBOARD_COOKIE_NAME,
  verifyDashboardToken,
} from "@/lib/dashboardAuth";
import { getAdminUsage } from "@/lib/adminUsage";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "گزارش مصرف و کلیک‌ها",
  robots: { index: false, follow: false },
};
const number = (n: number) => n.toLocaleString("fa-IR");
const date = (value: Date) =>
  new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Tehran",
  }).format(value);

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  if (
    !(await verifyDashboardToken(
      (await cookies()).get(DASHBOARD_COOKIE_NAME)?.value,
    ))
  )
    redirect("/admin");
  const params = await searchParams;
  const page = Math.max(
    1,
    Math.min(100000, Number.parseInt(params.page ?? "1", 10) || 1),
  );
  const q = (params.q ?? "").trim().slice(0, 160);
  const data = await getAdminUsage(page, q);
  const delayed = data.delayed;
  const pageUrl = (n: number) =>
    `/admin/reports?page=${n}&q=${encodeURIComponent(q)}`;
  return (
    <main dir="rtl" className="mesh-bg min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <nav className="flex flex-wrap gap-3">
          <Link href="/admin" className="button-secondary">
            مدیریت کاربران و پرونده‌ها
          </Link>
          <Link href="/admin/settings" className="button-secondary">
            تنظیمات تأیید ایمیل و موبایل
          </Link>
          <Link href={pageUrl(page)} className="button-secondary">
            به‌روزرسانی گزارش
          </Link>
        </nav>
        <h1 className="text-2xl font-bold">گزارش مصرف و کلیک‌ها</h1>
        <section className="surface p-5">
          <h2 className="text-lg font-bold">وضعیت ثبت بازدیدها</h2>
          <p>کلیک‌های در انتظار پردازش: {number(data.queue._count)}</p>
          {data.queue._min.clickedAt && (
            <p>قدیمی‌ترین رویداد صف: {date(data.queue._min.clickedAt)}</p>
          )}
          {delayed ? (
            <p role="alert" className="notice notice-error">
              ثبت گزارش بیش از یک دقیقه تأخیر دارد. اتصال دیتابیس و اجرای
              پردازشگر analytics-worker را بررسی کنید؛ کلیک‌های صف هنوز در
              شمارنده‌ها محاسبه نشده‌اند.
            </p>
          ) : (
            <p className="section-note">
              خالی بودن صف به‌تنهایی اجرای پردازشگر را تأیید نمی‌کند. گزارش با
              تازه‌سازی صفحه به‌روز می‌شود.
            </p>
          )}
        </section>
        <section className="surface p-5">
          <h2 className="text-lg font-bold">مصرف هر کاربر</h2>
          <form className="my-4 flex gap-3">
            <input
              className="field"
              name="q"
              defaultValue={q}
              placeholder="نام یا ایمیل کاربر"
              aria-label="جست‌وجوی کاربر"
            />
            <button className="button-primary">جست‌وجو</button>
          </form>
          <p className="section-note">
            مصرف، جمع برداشت‌های دفتر اعتبار است؛ کلیک به‌خودی‌خود اعتبار مصرف
            نمی‌کند. شمارندهٔ کلیک شامل ربات‌هاست و فقط لینک‌های موجود را پوشش
            می‌دهد.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr>
                  {[
                    "کاربر",
                    "سطح حساب",
                    "لینک",
                    "کل کلیک",
                    "اعتبار مصرف‌شده",
                    "موجودی",
                  ].map((label) => (
                    <th className="p-3" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr key={user.id} className="border-t border-[var(--line)]">
                    <td className="p-3">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="underline"
                      >
                        {user.fullName || user.email}
                      </Link>
                      <p dir="ltr">{user.email}</p>
                    </td>
                    <td className="p-3">
                      {(
                        {
                          standard: "استاندارد",
                          business: "تجاری",
                          enterprise: "سازمانی",
                        } as Record<string, string>
                      )[user.accountPlan] ?? user.accountPlan}
                    </td>
                    <td className="p-3">{number(user._count.links)}</td>
                    <td className="p-3">{number(user.clicks)}</td>
                    <td className="p-3">{number(user.consumed)}</td>
                    <td className="p-3">{number(user.credits)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.users.length && <p className="py-5">کاربری یافت نشد.</p>}
          <nav className="mt-4 flex gap-4">
            {page > 1 && <Link href={pageUrl(page - 1)}>صفحه قبل</Link>}
            <span>
              صفحه {number(page)} · {number(data.count)} کاربر
            </span>
            {page * 25 < data.count && (
              <Link href={pageUrl(page + 1)}>صفحه بعد</Link>
            )}
          </nav>
        </section>
        <section className="surface p-5">
          <h2 className="text-lg font-bold">۵۰ کلیک پردازش‌شدهٔ اخیر</h2>
          <p className="section-note">
            تمام کاربران · شامل ربات‌ها · زمان تهران · جزئیات بازدیدها تا ۹۰ روز
            نگهداری می‌شود. IP خام ذخیره یا نمایش داده نمی‌شود.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr>
                  {["زمان", "کاربر", "کد لینک", "مبدأ"].map((label) => (
                    <th key={label} className="p-3">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.clicks.map((click) => (
                  <tr
                    key={String(click.id)}
                    className="border-t border-[var(--line)]"
                  >
                    <td className="p-3 whitespace-nowrap">
                      {date(click.clickedAt)}
                    </td>
                    <td className="p-3">
                      <Link href={`/admin/users/${click.link.user.id}`}>
                        {click.link.user.email}
                      </Link>
                    </td>
                    <td className="p-3" dir="ltr">
                      {click.linkCode}
                    </td>
                    <td className="p-3 break-all">
                      {click.referer || "مستقیم / نامشخص"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.clicks.length && (
            <p className="py-5">
              هنوز کلیک پردازش‌شده‌ای ثبت نشده است. لینک باید تأیید و فعال باشد
              و پردازشگر صف اجرا شود.
            </p>
          )}
        </section>
        <section className="surface p-5">
          <h2 className="text-lg font-bold">۵۰ تغییر اعتبار اخیر</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr>
                  {["زمان", "کاربر", "تغییر اعتبار", "علت"].map((label) => (
                    <th key={label} className="p-3">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.ledger.map((row) => (
                  <tr
                    key={String(row.id)}
                    className="border-t border-[var(--line)]"
                  >
                    <td className="p-3 whitespace-nowrap">
                      {date(row.createdAt)}
                    </td>
                    <td className="p-3">
                      <Link href={`/admin/users/${row.user.id}`}>
                        {row.user.email}
                      </Link>
                    </td>
                    <td dir="ltr" className="p-3">
                      {number(row.delta)}
                    </td>
                    <td className="p-3">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.ledger.length && (
            <p className="py-5">تغییر اعتباری ثبت نشده است.</p>
          )}
        </section>
      </div>
    </main>
  );
}
