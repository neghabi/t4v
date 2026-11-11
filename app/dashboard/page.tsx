import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { DashboardApp } from "@/components/DashboardApp";
import { SiteHeader } from "@/components/SiteChrome";
import { getServerPublicBaseUrl } from "@/lib/serverBaseUrl";
import { getLedger } from "@/lib/userStore";
import { listLinksForUser } from "@/lib/urlStore";
import { listApiKeys } from "@/lib/apiKeyStore";
import { listTopUpsForUser } from "@/lib/creditTopUpStore";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const links = await listLinksForUser(user.id);
  const ledger = await getLedger(user.id);
  const apiKeys = await listApiKeys(user.id);
  const topUps = await listTopUpsForUser(user.id);
  const base = await getServerPublicBaseUrl();
  const nowMs = Date.now();

  return (
    <div className="mesh-bg min-h-[100dvh]">
      <SiteHeader />
      <DashboardApp
        user={user}
        initialLinks={links}
        initialLedger={ledger}
        initialApiKeys={apiKeys}
        initialTopUps={topUps}
        baseUrl={base}
        nowMs={nowMs}
      />
    </div>
  );
}
