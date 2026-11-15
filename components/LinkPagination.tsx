import Link from "next/link";
import type { LinkPage } from "@/lib/urlStore";

export function LinkPagination({
  data,
  pathname,
  filters = {},
}: {
  data: LinkPage;
  pathname: string;
  filters?: Record<string, string | undefined>;
}) {
  const href = (page: number) => {
    const q = new URLSearchParams();
    for (const [key, value] of Object.entries(filters))
      if (value) q.set(key, value);
    q.set("page", String(page));
    return `${pathname}?${q}`;
  };
  if (data.totalPages <= 1) return null;
  const buttonClass =
    "rounded-xl border border-zinc-200 px-4 py-2 text-sm text-brand-700 dark:border-white/10 dark:text-brand-200";
  return (
    <nav
      aria-label="صفحه‌بندی لینک‌ها"
      className="mt-5 flex flex-wrap items-center justify-between gap-3"
    >
      {data.page > 1 ? (
        <Link className={buttonClass} href={href(data.page - 1)}>
          صفحهٔ قبل
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        صفحهٔ {data.page.toLocaleString("fa-IR")} از{" "}
        {data.totalPages.toLocaleString("fa-IR")} ·{" "}
        {data.total.toLocaleString("fa-IR")} لینک
      </span>
      {data.page < data.totalPages ? (
        <Link className={buttonClass} href={href(data.page + 1)}>
          صفحهٔ بعد
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
