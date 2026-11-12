import Link from "next/link";
import { ArrowUpLeft, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserNav } from "@/components/UserNav";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="T4V؛ صفحه اصلی">
      <span className="brand-symbol" aria-hidden>
        ↗
      </span>
      <span dir="ltr">
        t4v<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-container flex h-[76px] items-center justify-between gap-5">
        <div className="flex items-center gap-12">
          <Brand />
          <nav
            aria-label="منوی اصلی"
            className="hidden items-center gap-8 text-sm md:flex"
          >
            <Link href="/#features">محصول</Link>
            <Link href="/#pricing">اعتبار و تعرفه</Link>
            <Link href="/api-docs">
              توسعه‌دهندگان{" "}
              <ArrowUpLeft className="inline size-3.5" aria-hidden />
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <UserNav />
          <span className="mx-1 h-5 w-px bg-zinc-200 dark:bg-white/10" />
          <ThemeToggle />
          <details className="relative md:hidden">
            <summary
              className="icon-button list-none"
              aria-label="باز کردن منوی سایت"
            >
              <Menu className="size-5" />
            </summary>
            <nav
              aria-label="منوی موبایل"
              className="surface absolute left-0 top-12 z-50 grid w-56 gap-1 p-3"
            >
              <Link className="nav-mobile-link" href="/#features">
                محصول
              </Link>
              <Link className="nav-mobile-link" href="/#pricing">
                اعتبار و تعرفه
              </Link>
              <Link className="nav-mobile-link" href="/api-docs">
                مستندات API
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container flex flex-col justify-between gap-8 py-10 md:flex-row md:items-center">
        <div>
          <Brand />
          <p className="mt-3 text-xs text-muted">
            لینک‌های کوچک، ارتباط‌های ماندگار.
          </p>
        </div>
        <nav
          aria-label="پیوندهای پایین صفحه"
          className="flex flex-wrap gap-x-7 gap-y-4 text-sm text-muted"
        >
          <Link href="/#features">امکانات</Link>
          <Link href="/api-docs">مستندات</Link>
          <Link href="/#faq">پرسش‌های متداول</Link>
          <Link href="/dashboard">حساب کاربری</Link>
        </nav>
        <p className="text-xs text-muted" dir="ltr">
          © {new Date().getFullYear()} T4V
        </p>
      </div>
    </footer>
  );
}
