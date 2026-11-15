import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  DASHBOARD_COOKIE_NAME,
  verifyDashboardToken,
} from "@/lib/dashboardAuth";
import { notificationSettings } from "@/lib/notificationDelivery";
import { localServicesEnabled } from "@/lib/localServices";
import { NotificationSettingsPanel } from "@/components/NotificationSettingsPanel";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "تنظیمات ارتباطات",
  robots: { index: false, follow: false },
};
export default async function Page() {
  if (
    !(await verifyDashboardToken(
      (await cookies()).get(DASHBOARD_COOKIE_NAME)?.value,
    ))
  )
    redirect("/admin");
  return (
    <main dir="rtl" className="mesh-bg min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="button-secondary mb-6">
          بازگشت به مدیریت
        </Link>
        <NotificationSettingsPanel
          settings={await notificationSettings()}
          local={localServicesEnabled()}
        />
      </div>
    </main>
  );
}
