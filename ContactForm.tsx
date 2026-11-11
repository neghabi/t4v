"use client";

import { useState } from "react";

function Spinner() {
  return (
    <span
      className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-600 dark:border-white/20 dark:border-t-cyan-300"
      aria-hidden
    />
  );
}

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "خطایی رخ داد. لطفاً دوباره تلاش کنید.");
      }

      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "خطای ناشناخته");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-300/50 bg-emerald-500/10 p-6 text-center text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-200/90">
        <h3 className="text-lg font-bold">پیام شما با موفقیت ارسال شد!</h3>
        <p className="mt-2 text-sm">از تماس شما سپاسگزاریم. به زودی با شما در ارتباط خواهیم بود.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="sr-only">نام</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="نام شما" required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-violet-500/25 transition placeholder:text-slate-400 focus:border-violet-500/40 focus:ring-2 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-violet-400/40" />
        </div>
        <div>
          <label htmlFor="email" className="sr-only">ایمیل</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ایمیل شما" required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-violet-500/25 transition placeholder:text-slate-400 focus:border-violet-500/40 focus:ring-2 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-violet-400/40" />
        </div>
      </div>
      <div>
        <label htmlFor="message" className="sr-only">پیام شما</label>
        <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="پیام شما..." required rows={5} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-violet-500/25 transition placeholder:text-slate-400 focus:border-violet-500/40 focus:ring-2 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-violet-400/40"></textarea>
      </div>
      {error && (
        <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>
      )}
      <div>
        <button type="submit" disabled={status === 'loading'} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-violet-500 to-purple-400 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-violet-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
          {status === 'loading' ? (
            <>
              <Spinner />
              در حال ارسال...
            </>
          ) : (
            "ارسال پیام"
          )}
        </button>
      </div>
    </form>
  );
}