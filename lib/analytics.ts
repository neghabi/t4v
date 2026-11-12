import { prisma } from "@/lib/db";

export async function getWorkspaceSummary(userId: string) {
  const [all, activeLinks, clicksLast24h] = await Promise.all([
    prisma.shortLink.aggregate({
      where: { userId },
      _count: true,
      _sum: { clickCount: true },
    }),
    prisma.shortLink.count({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    }),
    prisma.linkClick.count({
      where: {
        link: { userId },
        clickedAt: { gte: new Date(Date.now() - 86_400_000) },
      },
    }),
  ]);
  return {
    totalLinks: all._count,
    activeLinks,
    totalClicks: all._sum.clickCount ?? 0,
    clicksLast24h,
  };
}

export type AnalyticsData = {
  days: number;
  total: number;
  unique: number;
  daily: { date: string; clicks: number }[];
  referrers: { name: string; clicks: number }[];
  devices: { name: string; clicks: number }[];
};
export async function getLinkAnalytics(
  userId: string,
  daysInput = 30,
  code?: string,
): Promise<AnalyticsData> {
  const days = [7, 30, 90].includes(daysInput) ? daysInput : 30;
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - days + 1);
  const [daily, totals, refs, devices] = await Promise.all([
    prisma.$queryRaw<
      { date: string; clicks: bigint }[]
    >`SELECT TO_CHAR(l.clicked_at, 'YYYY-MM-DD') AS date, COUNT(*) AS clicks FROM link_clicks l JOIN short_links s ON s.code=l.link_code WHERE s.user_id=${userId} AND (${code ?? null}::text IS NULL OR s.code=${code ?? null}) AND l.clicked_at >= ${since} AND COALESCE(l.user_agent,'') !~* '(bot|spider|crawler|preview|headless)' GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<
      { total: bigint; unique: bigint }[]
    >`SELECT COUNT(*) AS total, COUNT(DISTINCT l.ip_hash) AS unique FROM link_clicks l JOIN short_links s ON s.code=l.link_code WHERE s.user_id=${userId} AND (${code ?? null}::text IS NULL OR s.code=${code ?? null}) AND l.clicked_at >= ${since} AND COALESCE(l.user_agent,'') !~* '(bot|spider|crawler|preview|headless)'`,
    prisma.$queryRaw<
      { name: string | null; clicks: bigint }[]
    >`SELECT l.referer AS name, COUNT(*) AS clicks FROM link_clicks l JOIN short_links s ON s.code=l.link_code WHERE s.user_id=${userId} AND (${code ?? null}::text IS NULL OR s.code=${code ?? null}) AND l.clicked_at >= ${since} AND COALESCE(l.user_agent,'') !~* '(bot|spider|crawler|preview|headless)' GROUP BY 1 ORDER BY 2 DESC LIMIT 200`,
    prisma.$queryRaw<
      { name: string; clicks: bigint }[]
    >`SELECT CASE WHEN COALESCE(l.user_agent,'') ~* '(ipad|tablet)' THEN 'تبلت' WHEN COALESCE(l.user_agent,'') ~* '(mobile|android|iphone)' THEN 'موبایل' WHEN l.user_agent IS NULL OR l.user_agent='' THEN 'نامشخص' ELSE 'دسکتاپ' END AS name, COUNT(*) AS clicks FROM link_clicks l JOIN short_links s ON s.code=l.link_code WHERE s.user_id=${userId} AND (${code ?? null}::text IS NULL OR s.code=${code ?? null}) AND l.clicked_at >= ${since} AND COALESCE(l.user_agent,'') !~* '(bot|spider|crawler|preview|headless)' GROUP BY 1 ORDER BY 2 DESC`,
  ]);
  const dailyMap = new Map(daily.map((row) => [row.date, Number(row.clicks)]));
  const refMap = new Map<string, number>();
  for (const row of refs) {
    let name = "مستقیم / نامشخص";
    try {
      if (row.name) name = new URL(row.name).hostname;
    } catch {
      /* Invalid referrers are grouped as unknown. */
    }
    refMap.set(name, (refMap.get(name) ?? 0) + Number(row.clicks));
  }
  return {
    days,
    total: Number(totals[0]?.total ?? 0),
    unique: Number(totals[0]?.unique ?? 0),
    daily: Array.from({ length: days }, (_, index) => {
      const date = new Date(since.getTime() + index * 86_400_000)
        .toISOString()
        .slice(0, 10);
      return { date, clicks: dailyMap.get(date) ?? 0 };
    }),
    referrers: [...refMap]
      .map(([name, clicks]) => ({ name, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 8),
    devices: devices.map((row) => ({ ...row, clicks: Number(row.clicks) })),
  };
}
