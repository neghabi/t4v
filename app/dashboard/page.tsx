import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { DashboardApp } from "@/components/DashboardApp";
import { getServerPublicBaseUrl } from "@/lib/serverBaseUrl";
import { getLedger } from "@/lib/userStore";
import { listLinksForUser, parseLinkPage } from "@/lib/urlStore";
import { listApiKeys } from "@/lib/apiKeyStore";
import { getWorkspaceSummary } from "@/lib/analytics";
import { localServicesEnabled } from "@/lib/localServices";
import { prisma } from "@/lib/db";
import { listTopUpsForUser } from "@/lib/creditTopUpStore";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "داشبورد",
  robots: { index: false, follow: false },
};
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");
  const params = await searchParams;
  const topUps = await listTopUpsForUser(user.id);
  const [linksPage, ledger, apiKeys, base, summary, account] =
    await Promise.all([
      listLinksForUser(user.id, parseLinkPage(params.page), params),
      getLedger(user.id),
      listApiKeys(user.id),
      getServerPublicBaseUrl(),
      getWorkspaceSummary(user.id),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { emailVerifiedAt: true },
      }),
    ]);
  return (
    <DashboardApp
      key={JSON.stringify(params)}
      user={user}
      linksPage={linksPage}
      initialLedger={ledger}
      initialTopUps={topUps}
      initialApiKeys={apiKeys}
      baseUrl={base}
      nowMs={Date.now()}
      summary={summary}
      params={params}
      verified={!!account?.emailVerifiedAt}
      local={localServicesEnabled()}
    />
  );
}
