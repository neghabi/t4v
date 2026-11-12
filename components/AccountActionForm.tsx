"use client";
import Link from "next/link";
import { useState } from "react";
export function AccountActionForm({
  kind,
  token = "",
}: {
  kind: "forgot" | "reset" | "verify";
  token?: string;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <form
      className="grid gap-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        setMessage("");
        try {
          const endpoint =
            kind === "forgot"
              ? "forgot-password"
              : kind === "reset"
                ? "reset-password"
                : "verify-email";
          const r = await fetch(`/api/auth/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              kind === "forgot"
                ? { email: f.get("email") }
                : kind === "reset"
                  ? { token, password: f.get("password") }
                  : { token },
            ),
          });
          const d = await r.json();
          if (!r.ok) throw Error(d.error);
          setMessage(d.message ?? "انجام شد.");
          setDone(true);
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "خطا در ارتباط");
        } finally {
          setBusy(false);
        }
      }}
    >
      {kind === "forgot" && (
        <label className="field-label">
          نشانی ایمیل
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            className="field"
            dir="ltr"
          />
        </label>
      )}
      {kind === "reset" && (
        <label className="field-label">
          رمز جدید
          <input
            required
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            className="field"
          />
        </label>
      )}
      <button disabled={busy || done} className="button-primary">
        {busy
          ? "در حال انجام…"
          : kind === "forgot"
            ? "دریافت لینک بازیابی"
            : kind === "reset"
              ? "ذخیره رمز جدید"
              : "تأیید نشانی ایمیل"}
      </button>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <Link href="/login" className="text-sm text-[var(--accent)]">
        بازگشت به ورود
      </Link>
    </form>
  );
}
