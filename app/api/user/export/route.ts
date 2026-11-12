import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/getSessionUser";
import { linkFilterWhere } from "@/lib/urlStore";
import { prisma } from "@/lib/db";
import { getPublicBaseUrl } from "@/lib/publicBaseUrl";
import { enforceRateLimit } from "@/lib/rateLimit";

function cell(value: string | number) {
  let text = String(value);
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export async function GET(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  if (!user)
    return NextResponse.json({ error: "وارد حساب شوید." }, { status: 401 });
  const limited = await enforceRateLimit(
    request,
    `export:${user.id}`,
    5,
    60_000,
  );
  if (limited) return limited;
  const rows = await prisma.shortLink.findMany({
    where: linkFilterWhere(
      user.id,
      Object.fromEntries(request.nextUrl.searchParams),
    ),
    orderBy: [{ createdAt: "desc" }, { code: "asc" }],
    take: 5000,
  });
  const base = getPublicBaseUrl(request);
  const csv = [
    [
      "Title",
      "Short URL",
      "Destination",
      "Tags",
      "Clicks",
      "Created at (UTC)",
      "Expires at (UTC)",
    ],
    ...rows.map((row) => [
      row.title,
      `${base}/${row.code}`,
      row.url,
      row.tags.join("; "),
      row.clickCount,
      row.createdAt.toISOString(),
      row.expiresAt?.toISOString() ?? "",
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
  return new Response(`\ufeff${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="t4v-links.csv"',
      "Cache-Control": "private, no-store",
      "X-Export-Limit": "5000",
    },
  });
}
