import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import {
  DASHBOARD_COOKIE_NAME,
  verifyDashboardToken,
} from "@/lib/dashboardAuth";
import { identityProfile } from "@/lib/identity";
import { prisma } from "@/lib/db";
import { AdminUserCase } from "@/components/AdminUserCase";
import { AdminLinkActions } from "@/components/AdminLinkActions";
import { listLinksForUser, parseLinkPage } from "@/lib/urlStore";
import { LinkPagination } from "@/components/LinkPagination";
export const dynamic = "force-dynamic";
function describeAudit(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const labels: Record<string, string> = {
    note: "توضیح",
    status: "وضعیت",
    identity: "احراز هویت",
    plan: "سطح حساب",
    code: "شناسه لینک",
  };
  const values: Record<string, string> = {
    approved: "تأیید شده",
    pending: "در انتظار بررسی",
    rejected: "رد شده",
    suspended: "معلق",
    active: "فعال",
    standard: "استاندارد",
    business: "تجاری",
    enterprise: "سازمانی",
  };
  return Object.entries(value)
    .filter(([key, item]) => labels[key] && typeof item === "string" && item)
    .map(
      ([key, item]) =>
        `${labels[key]}: ${values[String(item)] ?? String(item)}`,
    )
    .join(" · ");
}
export const metadata = {
  title: "پرونده کاربر",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; status?: string; q?: string }>;
}) {
  if (
    !(await verifyDashboardToken(
      (await cookies()).get(DASHBOARD_COOKIE_NAME)?.value,
    ))
  )
    redirect("/admin");
  const { id } = await params;
  const filters = await searchParams;
  const profile = await identityProfile(id);
  if (!profile) notFound();
  const [links, payments, purchases, audit, counts] = await Promise.all([
    listLinksForUser(id, parseLinkPage(filters.page), filters),
    prisma.payment.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        amount: true,
        credits: true,
        currency: true,
        status: true,
        provider: true,
        createdAt: true,
      },
    }),
    prisma.payment.aggregate({
      where: { userId: id, status: "paid" },
      _sum: { amount: true, credits: true },
      _count: true,
    }),
    prisma.moderationAudit.findMany({
      where: { subjectId: id },
      take: 50,
      orderBy: { createdAt: "desc" },
    }),
    prisma.shortLink.groupBy({
      by: ["moderationStatus"],
      where: { userId: id },
      _count: true,
    }),
  ]);
  const label = (s: string) =>
    ({
      pending: "در انتظار بررسی",
      approved: "تأیید شده",
      suspended: "معلق",
      rejected: "رد شده",
      paid: "پرداخت‌شده",
      failed: "ناموفق",
      expired: "منقضی",
      cancelled: "لغوشده",
    })[s] ?? s;
  return (
    <main className="mesh-bg min-h-screen px-4 py-10" dir="rtl">
      <div className="mx-auto grid max-w-6xl gap-6">
        <Link href="/admin" className="button-secondary justify-self-start">
          بازگشت به مدیریت کاربران
        </Link>
        <h1 className="text-2xl font-bold">
          پروندهٔ {profile.fullName || profile.email}
        </h1>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["تعداد خرید موفق", purchases._count],
            ["اعتبار خریداری‌شده", purchases._sum.credits ?? 0],
            ["جمع پرداخت موفق (ریال)", purchases._sum.amount ?? 0],
          ].map(([title, value]) => (
            <div key={String(title)} className="premium-card rounded-2xl p-5">
              <p className="text-sm text-zinc-500">{title}</p>
              <p className="mt-3 text-2xl font-bold">
                {Number(value).toLocaleString("fa-IR")}
              </p>
            </div>
          ))}
        </div>
        <AdminUserCase profile={JSON.parse(JSON.stringify(profile))} />
        <section className="premium-card rounded-3xl p-6">
          <h2 className="text-xl font-bold">
            محتوا و نظارت بر لینک‌های این کاربر
          </h2>
          <div className="my-4 flex flex-wrap gap-3 text-sm">
            {counts.map((row) => (
              <span key={row.moderationStatus}>
                {label(row.moderationStatus)}: {row._count}
              </span>
            ))}
          </div>
          <form className="my-5 flex flex-wrap gap-3">
            <label className="field-label flex-1">
              جست‌وجوی محتوا
              <input
                name="q"
                className="field"
                defaultValue={filters.q}
                placeholder="عنوان، مقصد، شناسه یا برچسب"
              />
            </label>
            <label className="field-label">
              وضعیت
              <select
                name="status"
                className="field"
                defaultValue={filters.status ?? ""}
              >
                <option value="">همه</option>
                {["pending", "approved", "suspended", "rejected"].map((s) => (
                  <option key={s} value={s}>
                    {label(s)}
                  </option>
                ))}
              </select>
            </label>
            <button className="button-secondary self-end">فیلتر</button>
          </form>
          <div className="grid gap-4">
            {links.links.map((link) => (
              <article
                key={link.code}
                className="rounded-2xl border border-zinc-500/20 p-4"
              >
                <p className="font-bold">
                  {link.title || link.code} · {label(link.moderationStatus)}
                </p>
                <p className="my-3 break-all text-sm" dir="ltr">
                  {link.url}
                </p>
                <AdminLinkActions link={link} />
              </article>
            ))}
          </div>
          <LinkPagination
            data={links}
            pathname={`/admin/users/${id}`}
            filters={filters}
          />
        </section>
        <section className="premium-card overflow-x-auto rounded-3xl p-6">
          <h2 className="mb-5 text-xl font-bold">
            ۲۵ سفارش اخیر و نوع بستهٔ خرید
          </h2>
          <table className="w-full text-right text-sm">
            <thead>
              <tr>
                <th className="p-3">بستهٔ اعتبار</th>
                <th>مبلغ (ریال)</th>
                <th>درگاه</th>
                <th>وضعیت</th>
                <th>تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((row) => (
                <tr key={row.id} className="border-t border-zinc-500/10">
                  <td className="p-3">
                    {row.credits.toLocaleString("fa-IR")} اعتبار
                  </td>
                  <td>{row.amount.toLocaleString("fa-IR")}</td>
                  <td>{row.provider}</td>
                  <td>{label(row.status)}</td>
                  <td>{row.createdAt.toLocaleDateString("fa-IR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!payments.length && <p className="mt-4">خریدی ثبت نشده است.</p>}
        </section>
        <section className="premium-card rounded-3xl p-6">
          <h2 className="text-xl font-bold">۵۰ رویداد اخیر پرونده</h2>
          <div className="mt-4 grid gap-3">
            {audit.map((row) => (
              <p
                key={String(row.id)}
                className="rounded-xl border border-zinc-500/10 p-3 text-sm"
              >
                {row.createdAt.toLocaleString("fa-IR")} ·{" "}
                {{
                  "user.review": "تصمیم دربارهٔ حساب",
                  "document.review": "بررسی مدرک",
                  "document.download": "دریافت مدرک",
                  "link.review": "تصمیم دربارهٔ لینک",
                  "profile.updated": "تغییر اطلاعات پرونده",
                  "document.upload": "بارگذاری مدرک",
                  "document.delete": "حذف مدرک",
                }[row.action] ?? row.action}{" "}
                ·{" "}
                {row.actor.startsWith("user:") ? (
                  "کاربر پرونده"
                ) : (
                  <>
                    مدیر: <span dir="ltr">{row.actor}</span>
                  </>
                )}
                <span className="mt-2 block break-words">
                  {describeAudit(row.details)}
                </span>
              </p>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
