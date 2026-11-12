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
      className="icon-button shrink-0"
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
