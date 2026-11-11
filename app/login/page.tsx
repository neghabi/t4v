import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { SiteHeader } from "@/components/SiteChrome";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const nextHref =
    typeof sp.next === "string" && sp.next.startsWith("/") && !sp.next.startsWith("//")
      ? sp.next
      : "/dashboard";

  return (
    <div className="mesh-bg flex min-h-[100dvh] flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="premium-card w-full max-w-md rounded-3xl border border-zinc-200/80 bg-white/80 p-8 backdrop-blur-2xl dark:border-white/[0.09] dark:bg-white/[0.04]">
          <h1 className="text-center text-2xl font-bold text-zinc-950 dark:text-white">
            ورود به حساب
          </h1>
          <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
            لینک‌های شما و اعتبار مصرفی، به این حساب گره خورده است.
          </p>
          <LoginForm nextHref={nextHref} />
          <Link
            href="/"
            className="mt-8 block text-center text-sm text-zinc-500 hover:text-brand-700 dark:text-zinc-400 dark:hover:text-brand-300"
          >
            بازگشت به خانه
          </Link>
        </div>
      </main>
    </div>
  );
}
