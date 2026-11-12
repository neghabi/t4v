import { cookies } from "next/headers";
import {
  DASHBOARD_COOKIE_NAME,
  verifyDashboardToken,
} from "@/lib/dashboardAuth";
import { SiteHeader } from "@/components/SiteChrome";
import { DashboardLogin } from "@/components/DashboardLogin";
import { AdminPaymentsPanel } from "@/components/AdminPaymentsPanel";
import { ProtectedPageGuard } from "@/components/ProtectedPageGuard";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "مدیریت درگاه‌ها و پرداخت",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const jar = await cookies();
  const authed = await verifyDashboardToken(
    jar.get(DASHBOARD_COOKIE_NAME)?.value,
  );
  const { view } = await searchParams;
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      {authed ? (
        <main className="site-container py-10">
          <ProtectedPageGuard kind="admin" />
          <h1 className="mb-3 text-2xl font-bold">
            مدیریت درگاه‌ها و پرداخت‌ها
          </h1>
          <p className="section-note mb-8">
            تنظیم اتصال، نظارت بر تراکنش‌ها و پیگیری امن نتیجهٔ پرداخت.
          </p>
          <AdminPaymentsPanel
            key={view ?? "gateways"}
            view={
              ["transactions", "audit"].includes(view ?? "")
                ? view!
                : "gateways"
            }
          />
        </main>
      ) : (
        <main className="grid min-h-[75dvh] place-items-center px-5">
          <DashboardLogin />
        </main>
      )}
    </div>
  );
}
