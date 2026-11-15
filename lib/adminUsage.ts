import { prisma } from "@/lib/db";

export async function getAdminUsage(page: number, query: string) {
  const where = query
    ? {
        OR: [
          { email: { contains: query, mode: "insensitive" as const } },
          { fullName: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};
  const [queue, users, count, clicks, ledger] = await Promise.all([
    prisma.clickEvent.aggregate({ _count: true, _min: { clickedAt: true } }),
    prisma.user.findMany({
      where,
      skip: (page - 1) * 25,
      take: 25,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      select: {
        id: true,
        email: true,
        fullName: true,
        credits: true,
        identityStatus: true,
        accountPlan: true,
        _count: { select: { links: true } },
      },
    }),
    prisma.user.count({ where }),
    prisma.linkClick.findMany({
      take: 50,
      orderBy: [{ clickedAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        clickedAt: true,
        linkCode: true,
        referer: true,
        link: { select: { user: { select: { id: true, email: true } } } },
      },
    }),
    prisma.creditLedger.findMany({
      take: 50,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        delta: true,
        reason: true,
        createdAt: true,
        user: { select: { id: true, email: true } },
      },
    }),
  ]);
  const ids = users.map((user) => user.id);
  const [links, usage] = await Promise.all([
    prisma.shortLink.groupBy({
      by: ["userId"],
      where: { userId: { in: ids } },
      _sum: { clickCount: true },
    }),
    prisma.creditLedger.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, delta: { lt: 0 } },
      _sum: { delta: true },
    }),
  ]);
  return {
    delayed: Boolean(
      queue._min.clickedAt &&
      Date.now() - queue._min.clickedAt.getTime() > 60_000,
    ),
    queue,
    count,
    clicks,
    ledger,
    users: users.map((user) => ({
      ...user,
      clicks:
        links.find((link) => link.userId === user.id)?._sum.clickCount ?? 0,
      consumed: -(usage.find((row) => row.userId === user.id)?._sum.delta ?? 0),
    })),
  };
}
