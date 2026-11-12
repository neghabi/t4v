import Link from "next/link";
import { cookies } from "next/headers";
import { DashboardLogin } from "@/components/DashboardLogin";
import { SiteHeader } from "@/components/SiteChrome";
import { DashboardLogoutButton } from "@/components/DashboardLogoutButton";
import { AdminDeploymentPanel } from "@/components/AdminDeploymentPanel";
import { AdminUsersPanel } from "@/components/AdminUsersPanel";
import { ProtectedPageGuard } from "@/components/ProtectedPageGuard";
import { AdminTopUpsPanel } from "@/components/AdminTopUpsPanel";
import {
  DASHBOARD_COOKIE_NAME,
  verifyDashboardToken,
} from "@/lib/dashboardAuth";
import { getServerPublicBaseUrl } from "@/lib/serverBaseUrl";
import { listAllLinks, parseLinkPage } from "@/lib/urlStore";
import { LinkPagination } from "@/components/LinkPagination";
import { AdminLinkActions } from "@/components/AdminLinkActions";
import { listUsersForAdmin } from "@/lib/userStore";
import { listTopUpsForAdmin } from "@/lib/creditTopUpStore";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "مدیریت",
  robots: { index: false, follow: false },
};

function formatDate(ms: number) {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(ms));
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const jar = await cookies();
  const authed = await verifyDashboardToken(
    jar.get(DASHBOARD_COOKIE_NAME)?.value,
  );

  if (!authed) {
    return (
      <div className="mesh-bg flex min-h-[100dvh] flex-col">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <DashboardLogin />
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const linksPage = await listAllLinks(parseLinkPage(params.page));
  const rows = linksPage.links;
  const users = await listUsersForAdmin();
  const topUps = await listTopUpsForAdmin();
  const base = await getServerPublicBaseUrl();

  return (
    <div className="mesh-bg min-h-[100dvh]">
      <ProtectedPageGuard kind="admin" />
      <SiteHeader />
      <div className="px-4 py-10 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
                مدیریت سراسری
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                مدیریت کامل کاربران، لینک‌ها و درخواست‌های افزایش اعتبار.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                خانه
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                داشبورد کاربر
              </Link>
              <DashboardLogoutButton />
            </div>
          </div>

          <AdminTopUpsPanel initialTopUps={topUps} />

          <AdminUsersPanel
            key={users.map((user) => `${user.id}:${user.updatedAt}`).join("|")}
            initialUsers={users}
          />

          <AdminDeploymentPanel />

          <div className="mt-10 overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <table className="w-full min-w-[800px] text-right text-sm">
              <thead className="border-b border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">مالک</th>
                  <th className="px-4 py-3 font-medium">کد</th>
                  <th className="px-4 py-3 font-medium">لینک کوتاه</th>
                  <th className="px-4 py-3 font-medium">مقصد</th>
                  <th className="px-4 py-3 font-medium">کلیک</th>
                  <th className="px-4 py-3 font-medium">۲۴ ساعت</th>
                  <th className="px-4 py-3 font-medium">رمز</th>
                  <th className="px-4 py-3 font-medium">انقضا</th>
                  <th className="px-4 py-3 font-medium">ساخته</th>
                  <th className="px-4 py-3 font-medium">مدیریت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-12 text-center text-slate-500 dark:text-zinc-400"
                    >
                      هنوز لینکی ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const short = `${base}/${r.code}`;
                    const expired =
                      r.expiresAt != null && r.expiresAt < Date.now();
                    return (
                      <tr
                        key={r.code}
                        className="text-slate-800 dark:text-slate-200"
                      >
                        <td
                          className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400"
                          dir="ltr"
                          title={r.userId ?? ""}
                        >
                          {r.userId ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                          {r.code}
                        </td>
                        <td
                          className="max-w-[180px] truncate px-4 py-3 font-mono text-xs text-brand-700 dark:text-brand-200/90"
                          dir="ltr"
                          title={short}
                        >
                          {short}
                        </td>
                        <td
                          className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400"
                          dir="ltr"
                          title={r.url}
                        >
                          {r.url}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {r.clickCount}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-500 dark:text-slate-400">
                          {r.clicksLast24h}
                        </td>
                        <td className="px-4 py-3">
                          {r.hasPassword ? (
                            <span className="text-emerald-700 dark:text-emerald-300">
                              دارد
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-zinc-500">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {r.expiresAt == null ? (
                            <span className="text-slate-400 dark:text-zinc-500">
                              —
                            </span>
                          ) : expired ? (
                            <span className="text-amber-700 dark:text-amber-300">
                              منقضی
                            </span>
                          ) : (
                            formatDate(r.expiresAt)
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-zinc-400">
                          {formatDate(r.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <AdminLinkActions link={r} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <LinkPagination data={linksPage} pathname="/admin" />
        </div>
      </div>
    </div>
  );
}
