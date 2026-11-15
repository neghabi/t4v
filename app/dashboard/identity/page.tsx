import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { identityProfile } from "@/lib/identity";
import { localServicesEnabled } from "@/lib/localServices";
import { IdentityPanel } from "@/components/IdentityPanel";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "پرونده و احراز هویت",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard/identity");
  const profile = await identityProfile(user.id);
  return (
    <main className="mesh-bg min-h-screen px-4 py-10" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <Link className="button-secondary mb-6" href="/dashboard">
          بازگشت به داشبورد
        </Link>
        <IdentityPanel
          profile={JSON.parse(JSON.stringify(profile))}
          local={localServicesEnabled()}
        />
      </div>
    </main>
  );
}
