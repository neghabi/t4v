import Link from "next/link";
import Image from "next/image";
import { LoginForm } from "@/components/auth/LoginForm";
import { SiteHeader } from "@/components/SiteChrome";

export const metadata = {
  title: "ورود به حساب",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const nextHref =
    typeof sp.next === "string" &&
    sp.next.startsWith("/") &&
    !sp.next.startsWith("//")
      ? sp.next
      : "/dashboard";

  return (
    <div className="mesh-bg flex min-h-[100dvh] flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="premium-card w-full max-w-md rounded-3xl border border-zinc-200/80 bg-white/80 p-8 backdrop-blur-2xl dark:border-white/[0.09] dark:bg-white/[0.04]">
          <div className="editorial-visual mb-7">
            <Image
              src="/images/connected-links.webp"
              alt="حلقه‌های متصل؛ به فضای کاری خود برگردید"
              width={1100}
              height={619}
              sizes="380px"
              className="h-36 w-full object-cover"
            />
          </div>
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
