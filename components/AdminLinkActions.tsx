"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useDialogFocus } from "@/components/useDialogFocus";
import type { ListedLink } from "@/lib/urlStore";
export function AdminLinkActions({ link }: { link: ListedLink }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const close = useCallback(() => setEditing(false), []);
  useDialogFocus(editing, close);
  async function mutate(method: string, body?: unknown) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(
        `/api/admin/links/${encodeURIComponent(link.code)}`,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        },
      );
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تغییر انجام نشد.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="flex gap-2">
        <button
          disabled={busy}
          className="text-brand-700 dark:text-brand-300"
          onClick={() => setEditing(true)}
        >
          ویرایش
        </button>
        <button
          disabled={busy}
          className="text-rose-700 dark:text-rose-300"
          onClick={() => {
            if (window.confirm(`لینک ${link.code} حذف شود؟`))
              void mutate("DELETE");
          }}
        >
          حذف
        </button>
      </div>
      {error && !editing && (
        <p role="alert" className="text-xs text-rose-700">
          {error}
        </p>
      )}
      {editing && (
        <div className="modal-backdrop">
          <form
            className="modal-card text-right"
            role="dialog"
            aria-modal="true"
            aria-label="ویرایش لینک توسط مدیر"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const body: Record<string, unknown> = {
                url: f.get("url"),
                title: f.get("title"),
                tags: String(f.get("tags"))
                  .split(/[,،]/)
                  .map((t) => t.trim())
                  .filter(Boolean),
              };
              if (f.get("removeExpiry")) body.expiresAt = null;
              if (f.get("removePassword")) body.password = null;
              else if (f.get("password")) body.password = f.get("password");
              void mutate("PATCH", body);
            }}
          >
            <h2 className="mb-5 text-xl font-bold">ویرایش لینک {link.code}</h2>
            <div className="grid gap-4">
              <label className="field-label">
                عنوان
                <input
                  name="title"
                  className="field"
                  maxLength={120}
                  defaultValue={link.title}
                />
              </label>
              <label className="field-label">
                مقصد
                <input
                  required
                  type="url"
                  name="url"
                  className="field"
                  dir="ltr"
                  defaultValue={link.url}
                />
              </label>
              <label className="field-label">
                برچسب‌ها
                <input
                  name="tags"
                  className="field"
                  defaultValue={link.tags.join(", ")}
                />
              </label>
              <label className="field-label">
                رمز جدید لینک (اختیاری)
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={4}
                  maxLength={200}
                  className="field"
                />
              </label>
              <label className="flex gap-2">
                <input type="checkbox" name="removePassword" />
                حذف رمز لینک
              </label>
              <label className="flex gap-2">
                <input type="checkbox" name="removeExpiry" />
                حذف تاریخ انقضا
              </label>
              {error && (
                <p role="alert" className="notice notice-error">
                  {error}
                </p>
              )}
              <div className="flex gap-3">
                <button disabled={busy} className="button-primary">
                  ذخیره تغییرات
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={close}
                >
                  بستن
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
