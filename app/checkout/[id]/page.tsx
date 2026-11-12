import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { localServicesEnabled } from "@/lib/localServices";
import { prisma } from "@/lib/db";
import { SandboxCheckout } from "@/components/SandboxCheckout";
export const dynamic = "force-dynamic";
export const metadata = { title: "پرداخت آزمایشی", robots: { index: false, follow: false } };
export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  if (!localServicesEnabled()) notFound();
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/checkout/${encodeURIComponent(id)}`);
  const payment = await prisma.payment.findFirst({ where: { id, userId: user.id }, select: { id: true, amount: true, credits: true, status: true } });
  if (!payment) notFound();
  return <SandboxCheckout payment={payment}/>;
}
