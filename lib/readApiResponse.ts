/** Never expose a proxy error page or a JSON parser exception to the user. */
export async function readApiResponse<T extends { error?: string }>(
  response: Response,
): Promise<T> {
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "پاسخ معتبری از سرور دریافت نشد. لطفاً کمی بعد دوباره تلاش کنید.",
    );
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("پاسخ سرور نامعتبر است. لطفاً دوباره تلاش کنید.");
  }
  if (!response.ok) {
    const error = (data as { error?: unknown }).error;
    throw new Error(
      typeof error === "string"
        ? error
        : "درخواست انجام نشد. لطفاً دوباره تلاش کنید.",
    );
  }
  return data as T;
}
