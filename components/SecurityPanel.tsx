"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
type Session = {
  id: string;
  current: boolean;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
};
export function SecurityPanel({
  email,
  verified,
  local,
}: {
  email: string;
  verified: boolean;
  local: boolean;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    const r = await fetch("/api/user/sessions");
    const d = await r.json();
    if (r.ok) setSessions(d.sessions);
  }
  useEffect(() => {
    let active = true;
    fetch("/api/user/sessions")
      .then((r) => r.json())
      .then((d) => {
        if (active && d.sessions) setSessions(d.sessions);
      });
    return () => {
      active = false;
    };
  }, []);
  async function action(url: string, body: unknown) {
    setBusy(true);
    setMessage("");
    try {
      if (url.endsWith("/password")) {
        const b = body as { oldPassword: string; newPassword: string };
        body = { currentPassword: b.oldPassword, newPassword: b.newPassword };
      }
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setMessage(d.message ?? "تغییرات ذخیره شد.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "خطا در ارتباط");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-6">
      <section className="surface p-6">
        <h2 className="text-lg font-bold">امنیت حساب</h2>
        <p className="my-4" dir="ltr">
          {email}
        </p>
        <p className="section-note">
          {verified
            ? "ایمیل شما تأیید شده است."
            : "ایمیل شما هنوز تأیید نشده است."}
        </p>
        {!verified && (
          <button
            disabled={busy || !local}
            className="button-secondary mt-4"
            onClick={() => action("/api/auth/verify-email", {})}
          >
            ارسال لینک تأیید
          </button>
        )}
        {local && (
          <Link href="/dev/mailbox" className="button-secondary mr-3 mt-4">
            صندوق ایمیل آزمایشی
          </Link>
        )}
        <form
          className="mt-8 grid max-w-md gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void action("/api/user/password", {
              oldPassword: f.get("oldPassword"),
              newPassword: f.get("newPassword"),
            });
          }}
        >
          <h3 className="font-semibold">تغییر رمز عبور</h3>
          <label className="field-label">
            رمز فعلی
            <input
              required
              type="password"
              name="oldPassword"
              autoComplete="current-password"
              className="field"
            />
          </label>
          <label className="field-label">
            رمز جدید
            <input
              required
              type="password"
              minLength={8}
              maxLength={128}
              name="newPassword"
              autoComplete="new-password"
              className="field"
            />
          </label>
          <button disabled={busy} className="button-primary">
            ذخیره رمز جدید
          </button>
          <p className="section-note">
            با تغییر رمز، نشست‌های دیگر بسته می‌شوند.
          </p>
        </form>
        {message && (
          <p role="status" className="notice mt-4">
            {message}
          </p>
        )}
      </section>
      <section className="surface p-6">
        <h2 className="text-lg font-bold">نشست‌های فعال</h2>
        {sessions.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-4 border-b border-[var(--line)] py-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm" dir="ltr">
                {s.userAgent ?? "دستگاه ناشناس"}
              </p>
              <p className="section-note">
                {s.current ? "همین دستگاه" : "دستگاه دیگر"} ·{" "}
                {new Date(s.createdAt).toLocaleDateString("fa-IR")}
              </p>
            </div>
            {!s.current && (
              <button
                className="button-secondary shrink-0"
                onClick={async () => {
                  const r = await fetch(`/api/user/sessions?id=${s.id}`, {
                    method: "DELETE",
                  });
                  if (r.ok) await load();
                  else setMessage("بستن نشست ممکن نشد.");
                }}
              >
                بستن نشست
              </button>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
