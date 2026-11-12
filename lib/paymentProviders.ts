// Provider endpoints are fixed here; configuration cannot inject an arbitrary URL.
export type ProviderName = "zarinpal" | "zibal";
export type ProviderInput = {
  provider: ProviderName;
  mode: string;
  merchant: string;
  amount: number;
};
export class GatewayError extends Error {
  constructor(public code: string) {
    super(`خطای ارتباط با درگاه (${code})`);
  }
}
type Transport = typeof fetch;
async function post(url: string, body: unknown, transport: Transport) {
  try {
    const r = await transport(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
      redirect: "error",
      cache: "no-store",
    });
    if (!r.ok) throw new GatewayError(`http_${r.status}`);
    return await r.json();
  } catch (e) {
    if (e instanceof GatewayError) throw e;
    throw new GatewayError("network_error");
  }
}
const zarinBase = (mode: string) =>
  mode === "sandbox"
    ? "https://sandbox.zarinpal.com"
    : "https://payment.zarinpal.com";
export function gatewayRedirect(
  provider: ProviderName,
  mode: string,
  authority: string,
) {
  if (provider === "zarinpal") {
    if (!/^[AS][A-Za-z0-9]{15,127}$/.test(authority))
      throw new GatewayError("invalid_authority");
    return `${zarinBase(mode)}/pg/StartPay/${authority}`;
  }
  if (
    !/^\d{1,18}$/.test(authority) ||
    !Number.isSafeInteger(Number(authority)) ||
    Number(authority) <= 0
  )
    throw new GatewayError("invalid_track_id");
  return `https://gateway.zibal.ir/start/${authority}`;
}
export async function requestProvider(
  input: ProviderInput & { callbackUrl: string; orderId: string },
  transport: Transport = fetch,
) {
  const { provider, mode, amount, callbackUrl, orderId } = input;
  const merchant =
    provider === "zibal" && mode === "sandbox" ? "zibal" : input.merchant;
  const response =
    provider === "zarinpal"
      ? await post(
          `${zarinBase(mode)}/pg/v4/payment/request.json`,
          {
            merchant_id: merchant,
            amount,
            currency: "IRR",
            callback_url: callbackUrl,
            description: `خرید اعتبار T4V · ${orderId}`,
            metadata: { order_id: orderId },
          },
          transport,
        )
      : await post(
          "https://gateway.zibal.ir/v1/request",
          {
            merchant,
            amount,
            callbackUrl,
            orderId,
            description: `خرید اعتبار T4V · ${orderId}`,
          },
          transport,
        );
  const code = provider === "zarinpal" ? response.data?.code : response.result;
  if (code !== 100)
    throw new GatewayError(
      `request_${Number(code ?? response.errors?.code ?? 0)}`,
    );
  const authority = String(
    provider === "zarinpal" ? response.data.authority : response.trackId,
  );
  if (
    provider === "zibal" &&
    typeof response.trackId === "number" &&
    !Number.isSafeInteger(response.trackId)
  )
    throw new GatewayError("invalid_track_id");
  return { authority, url: gatewayRedirect(provider, mode, authority) };
}
export async function verifyProvider(
  input: ProviderInput & { authority: string },
  transport: Transport = fetch,
) {
  const { provider, mode, amount, authority } = input;
  const merchant =
    provider === "zibal" && mode === "sandbox" ? "zibal" : input.merchant;
  gatewayRedirect(provider, mode, authority);
  const response =
    provider === "zarinpal"
      ? await post(
          `${zarinBase(mode)}/pg/v4/payment/verify.json`,
          { merchant_id: merchant, amount, authority },
          transport,
        )
      : await post(
          "https://gateway.zibal.ir/v1/verify",
          { merchant, trackId: Number(authority) },
          transport,
        );
  const data = provider === "zarinpal" ? response.data : response;
  const code = Number(data?.code ?? data?.result ?? response.errors?.code ?? 0);
  const success =
    provider === "zarinpal"
      ? [100, 101].includes(code)
      : [100, 201].includes(code);
  if (!success)
    return { ok: false as const, code: `verify_${code}`, reference: null };
  // ZarinPal verifies the stored amount in its request; Zibal returns it for comparison.
  if (provider === "zibal" && Number(data.amount) !== amount)
    throw new GatewayError("amount_mismatch");
  const reference = String(
    provider === "zarinpal" ? (data.ref_id ?? "") : (data.refNumber ?? ""),
  );
  const rawReference = provider === "zarinpal" ? data.ref_id : data.refNumber;
  if (typeof rawReference === "number" && !Number.isSafeInteger(rawReference))
    throw new GatewayError("invalid_reference");
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(reference))
    throw new GatewayError("missing_reference");
  return { ok: true as const, code: `verify_${code}`, reference };
}
