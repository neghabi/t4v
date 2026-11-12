import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { localServicesEnabled } from "@/lib/localServices";
import { prisma } from "@/lib/db";
import { SandboxCheckout } from "@/components/SandboxCheckout";
import { OnlineCheckout } from "@/components/OnlineCheckout";
import { paymentRedirect } from "@/lib/payments";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "پرداخت و رسید",
  robots: { index: false, follow: false },
};
export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/checkout/${encodeURIComponent(id)}`);
  const payment = await prisma.payment.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      amount: true,
      credits: true,
      status: true,
      provider: true,
      gatewayMode: true,
      authority: true,
      reference: true,
      createdAt: true,
      errorCode: true,
      expiresAt: true,
    },
  });
  if (!payment) notFound();
  if (payment.provider === "sandbox") {
    if (!localServicesEnabled()) notFound();
    return <SandboxCheckout payment={payment} />;
  }
  return (
    <OnlineCheckout
      payment={{ ...payment, createdAt: payment.createdAt.toISOString() }}
      url={paymentRedirect(payment)}
    />
  );
}
