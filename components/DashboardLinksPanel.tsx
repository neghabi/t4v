"use client";

import {
  Check,
  Copy,
  ExternalLink,
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useDialogFocus } from "@/components/useDialogFocus";
import { useRouter } from "next/navigation";
import { AnalyticsPanel } from "@/components/AnalyticsPanel";
import { LinkQr } from "@/components/LinkQr";
import type { ListedLink } from "@/lib/urlStore";
import { statusLabel } from "@/components/IdentityPanel";

function formatDate(ms: number) {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(ms));
}

function toLocalDateTime(ms: number | null): string {
  if (ms === null) return "";
  const date = new Date(ms);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function DashboardLinksPanel({
  initialLinks,
  baseUrl,
  nowMs,
}: {
  initialLinks: ListedLink[];
  baseUrl: string;
  nowMs: number;
}) {
  const router = useRouter();
  const [links, setLinks] = useState(initialLinks);
  const [editing, setEditing] = useState<ListedLink | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [details, setDetails] = useState<string | null>(null);
  const closeDialog = useCallback(() => {
    setEditing(null);
    setDetails(null);
  }, []);
  useDialogFocus(!!editing || !!details, closeDialog);
  const [expiresAt, setExpiresAt] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [removePassword, setRemovePassword] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function openEditor(link: ListedLink) {
    setEditing(link);
    setUrl(link.url);
    setTitle(link.title);
    setTags(link.tags.join(", "));
    setExpiresAt(toLocalDateTime(link.expiresAt));
    setNewPassword("");
    setRemovePassword(false);
    setError(null);
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(editing.code);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        title,
        tags: tags
          .split(/[,،]/)
          .map((t) => t.trim())
          .filter(Boolean),
        url: url.trim(),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      };
      if (removePassword) body.password = null;
      else if (newPassword.trim()) body.password = newPassword;

      const response = await fetch(
        `/api/links/${encodeURIComponent(editing.code)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = (await response.json()) as {
        link?: ListedLink;
        error?: string;
      };
      if (!response.ok || !data.link) {
        throw new Error(data.error ?? "ویرایش لینک انجام نشد.");
      }
      setLinks((current) =>
        current.map((link) =>
          link.code === data.link!.code ? data.link! : link,
        ),
      );
      setEditing(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ویرایش انجام نشد.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteLink(link: ListedLink) {
    const confirmed = window.confirm(
      `لینک ${link.code} و تمام آمار کلیک آن برای همیشه حذف شود؟`,
    );
    if (!confirmed) return;

    setBusy(link.code);
    setError(null);
    try {
      const response = await fetch(
        `/api/links/${encodeURIComponent(link.code)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "حذف لینک انجام نشد.");
      }
      setLinks((current) => current.filter((item) => item.code !== link.code));
      if (editing?.code === link.code) setEditing(null);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "حذف انجام نشد.");
    } finally {
      setBusy(null);
    }
  }

  async function copyLink(code: string) {
    try {
      await navigator.clipboard.writeText(`${baseUrl}/${code}`);
      setCopied(code);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setError("مرورگر اجازهٔ کپی نداد؛ لینک را انتخاب و کپی کنید.");
    }
  }

  return (
    <>
      {error && !editing ? (
        <p className="mt-6 rounded-2xl border border-rose-300/60 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:border-rose-400/30 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="mt-8 space-y-3 md:hidden">
        {links.length === 0 ? (
          <p className="rounded-2xl border border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-white/10">
            هنوز لینکی نساخته‌اید. از صفحهٔ اصلی ابزار را باز کنید.
          </p>
        ) : (
          links.map((link) => (
            <article
              key={link.code}
              className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <button
                className="mb-3 font-semibold"
                onClick={() => setDetails(link.code)}
              >
                {link.title || link.code} ↗
              </button>
              <a
                href={`${baseUrl}/${link.code}`}
                target="_blank"
                rel="noreferrer"
                dir="ltr"
                className="block break-all text-left font-mono text-sm text-brand-700 dark:text-brand-200"
              >
                {baseUrl}/{link.code}
              </a>
              <p
                dir="ltr"
                className="mt-2 truncate text-left text-xs text-zinc-500"
                title={link.url}
              >
                {link.url}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                <div>
                  <dt>کل کلیک</dt>
                  <dd className="mt-1 font-bold">
                    {link.clickCount.toLocaleString("fa-IR")}
                  </dd>
                </div>
                <div>
                  <dt>۲۴ ساعت اخیر</dt>
                  <dd className="mt-1 font-bold">
                    {link.clicksLast24h.toLocaleString("fa-IR")}
                  </dd>
                </div>
                <div>
                  <dt>رمز</dt>
                  <dd className="mt-1">
                    {link.hasPassword ? "دارد" : "ندارد"}
                  </dd>
                </div>
                <div>
                  <dt>انقضا</dt>
                  <dd className="mt-1">
                    {link.expiresAt === null
                      ? "بدون انقضا"
                      : link.expiresAt < nowMs
                        ? "منقضی"
                        : formatDate(link.expiresAt)}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-3 text-sm dark:border-white/10">
                <button
                  type="button"
                  onClick={() => void copyLink(link.code)}
                  className="min-h-11 rounded-xl bg-brand-50 px-4 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200"
                >
                  {copied === link.code ? "کپی شد" : "کپی لینک"}
                </button>
                <button
                  type="button"
                  onClick={() => openEditor(link)}
                  disabled={busy === link.code}
                  className="min-h-11 rounded-xl border border-zinc-200 px-4 dark:border-white/10"
                >
                  ویرایش
                </button>
                <button
                  type="button"
                  onClick={() => void deleteLink(link)}
                  disabled={busy === link.code}
                  className="min-h-11 rounded-xl px-4 text-rose-700 dark:text-rose-300"
                >
                  حذف
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="mt-8 hidden overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03] md:block">
        <table className="w-full min-w-[940px] text-right text-sm">
          <thead className="border-b border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">کد</th>
              <th className="px-4 py-3 font-medium">لینک کوتاه</th>
              <th className="px-4 py-3 font-medium">مقصد</th>
              <th className="px-4 py-3 font-medium">کلیک</th>
              <th className="px-4 py-3 font-medium">۲۴ ساعت</th>
              <th className="px-4 py-3 font-medium">رمز</th>
              <th className="px-4 py-3 font-medium">انقضا</th>
              <th className="px-4 py-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {links.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-slate-500 dark:text-zinc-400"
                >
                  هنوز لینکی نساخته‌اید. از صفحهٔ اصلی ابزار را باز کنید.
                </td>
              </tr>
            ) : (
              links.map((link) => {
                const shortUrl = `${baseUrl}/${link.code}`;
                const expired =
                  link.expiresAt !== null && link.expiresAt < nowMs;
                return (
                  <tr
                    key={link.code}
                    className="text-slate-800 dark:text-slate-200"
                  >
                    <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                      <button
                        className="text-right font-semibold"
                        dir="auto"
                        onClick={() => setDetails(link.code)}
                      >
                        {link.title || link.code}
                      </button>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {link.tags.join(" · ")}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" dir="ltr">
                        <a
                          href={shortUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="max-w-[150px] truncate font-mono text-xs text-brand-700 hover:underline dark:text-brand-200"
                          title={shortUrl}
                        >
                          {shortUrl}
                        </a>
                        <button
                          type="button"
                          onClick={() => void copyLink(link.code)}
                          className="flex size-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
                          title="کپی"
                        >
                          {copied === link.code ? (
                            <Check className="size-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td
                      className="max-w-[220px] truncate px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400"
                      dir="ltr"
                      title={link.url}
                    >
                      {link.url}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {link.clickCount}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-500 dark:text-slate-400">
                      {link.clicksLast24h}
                    </td>
                    <td className="px-4 py-3">
                      <p className="mb-2 text-xs font-bold">
                        {statusLabel(link.moderationStatus)}
                      </p>
                      {link.moderationNote && (
                        <p className="mb-2 max-w-48 text-xs">
                          {link.moderationNote}
                        </p>
                      )}
                      {link.hasPassword ? (
                        <span className="text-emerald-700 dark:text-emerald-300">
                          دارد
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {link.expiresAt === null ? (
                        <span className="text-slate-400">—</span>
                      ) : expired ? (
                        <span className="text-amber-700 dark:text-amber-300">
                          منقضی
                        </span>
                      ) : (
                        formatDate(link.expiresAt)
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditor(link)}
                          disabled={busy === link.code}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-40 dark:text-brand-200 dark:hover:bg-brand-500/10"
                        >
                          <Pencil className="size-3.5" />
                          ویرایش
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteLink(link)}
                          disabled={busy === link.code}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-40 dark:text-rose-300 dark:hover:bg-rose-500/10"
                        >
                          <Trash2 className="size-3.5" />
                          حذف
                        </button>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
                          title="باز کردن مقصد"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {details && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetails(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="جزئیات لینک"
            className="detail-drawer"
          >
            <div className="mb-5 flex justify-between">
              <h2 className="font-bold">جزئیات {details}</h2>
              <button
                className="icon-button"
                onClick={() => setDetails(null)}
                aria-label="بستن جزئیات"
              >
                <X size={20} />
              </button>
            </div>
            <LinkQr key={details} code={details} baseUrl={baseUrl} />
            <AnalyticsPanel code={details} />
          </section>
        </div>
      )}
      {editing ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="ویرایش لینک"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/65 p-4 backdrop-blur-sm"
        >
          <div className="premium-card max-h-[90dvh] w-full max-w-xl overflow-auto rounded-3xl border p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-brand-700 dark:text-brand-300">
                  {baseUrl}/{editing.code}
                </p>
                <h2 className="mt-1 text-xl font-bold text-zinc-950 dark:text-white">
                  ویرایش لینک
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="flex size-9 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
                aria-label="بستن"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="field-label">
                  عنوان
                  <input
                    className="field mb-4"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                  />
                </label>
                <label className="field-label">
                  برچسب‌ها، جداشده با ویرگول
                  <input
                    className="field mb-4"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </label>
                <label
                  htmlFor="edit-link-url"
                  className="mb-1.5 block text-xs text-zinc-600 dark:text-zinc-400"
                >
                  آدرس مقصد
                </label>
                <input
                  type="url"
                  id="edit-link-url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/10 dark:bg-black/25 dark:text-white"
                  dir="ltr"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-link-expiry"
                  className="mb-1.5 block text-xs text-zinc-600 dark:text-zinc-400"
                >
                  تاریخ انقضا؛ خالی یعنی بدون انقضا
                </label>
                <input
                  type="datetime-local"
                  id="edit-link-expiry"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/10 dark:bg-black/25 dark:text-white"
                  dir="ltr"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-link-password"
                  className="mb-1.5 block text-xs text-zinc-600 dark:text-zinc-400"
                >
                  رمز جدید؛ خالی یعنی حفظ رمز فعلی
                </label>
                <input
                  type="password"
                  id="edit-link-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  disabled={removePassword}
                  minLength={4}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50 dark:border-white/10 dark:bg-black/25 dark:text-white"
                  dir="ltr"
                />
                {editing.hasPassword ? (
                  <label className="mt-3 flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={removePassword}
                      onChange={(event) =>
                        setRemovePassword(event.target.checked)
                      }
                    />
                    حذف محافظت رمزی
                  </label>
                ) : null}
              </div>
            </div>

            {error ? (
              <p className="mt-5 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
                {error}
              </p>
            ) : null}

            <div className="mt-7 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void saveEdit()}
                disabled={busy === editing.code || !url.trim()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-accent-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                <Save className="size-4" />
                {busy === editing.code ? "در حال ذخیره…" : "ذخیره تغییرات"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-2xl border border-zinc-200 px-5 py-3 text-sm text-zinc-700 dark:border-white/10 dark:text-zinc-200"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
