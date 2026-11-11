"use client";

import { useState } from "react";

export function DashboardLogoutButton() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/dashboard/logout", {
        method: "POST",
        cache: "no-store",
      });
    } finally {
      window.location.replace("/");
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
    >
      {loading ? "…" : "خروج"}
    </button>
  );
}
