"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "t4v-theme";

function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const t = document.documentElement.getAttribute("data-theme");
  return t === "light" || t === "dark" ? t : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const apply = useCallback((t: Theme) => {
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
    setTheme(t);
  }, []);

  const toggle = useCallback(() => {
    apply(theme === "dark" ? "light" : "dark");
  }, [apply, theme]);

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200/90 bg-white/85 text-zinc-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-200 dark:hover:border-brand-400/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-200"
      aria-label={theme === "dark" ? "فعال‌سازی تم روشن" : "فعال‌سازی تم تیره"}
      title={theme === "dark" ? "تغییر به تم روشن" : "تغییر به تم تیره"}
    >
      {theme === "dark" ? (
        <Sun className="size-[18px]" strokeWidth={1.9} aria-hidden />
      ) : (
        <Moon className="size-[18px]" strokeWidth={1.9} aria-hidden />
      )}
    </button>
  );
}
