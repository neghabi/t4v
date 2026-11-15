import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code = "invalid_request",
  ) {
    super(message);
  }
}
export function apiErrorResponse(error: unknown) {
  const requestId = randomUUID();
  const databaseUnavailable = isDatabaseUnavailable(error);
  if (!(error instanceof ApiError))
    console.error(
      JSON.stringify({
        level: "error",
        requestId,
        // Prisma messages can include query arguments and private identity data.
        message:
          error instanceof Error ? error.name : "Unexpected server error",
        code:
          error && typeof error === "object" && "code" in error
            ? String(error.code)
            : "unknown",
        databaseUnavailable,
      }),
    );
  return NextResponse.json(
    {
      error:
        error instanceof ApiError
          ? error.message
          : databaseUnavailable
            ? "ارتباط با پایگاه داده برقرار نیست. لطفاً کمی بعد دوباره تلاش کنید."
            : "درخواست انجام نشد. کمی بعد دوباره تلاش کنید.",
      code:
        error instanceof ApiError
          ? error.code
          : databaseUnavailable
            ? "database_unavailable"
            : "internal_error",
      requestId,
    },
    {
      status:
        error instanceof ApiError
          ? error.status
          : databaseUnavailable
            ? 503
            : 500,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Request-Id": requestId,
      },
    },
  );
}

function isDatabaseUnavailable(error: unknown, depth = 0): boolean {
  if (!error || typeof error !== "object" || depth > 5) return false;
  const value = error as {
    code?: string;
    originalCode?: string;
    kind?: string;
    cause?: unknown;
    meta?: { driverAdapterError?: unknown };
    errors?: unknown[];
  };
  return (
    [
      "P1000",
      "P1001",
      "P1002",
      "P1003",
      "P1010",
      "P1017",
      "ECONNREFUSED",
      "ENOTFOUND",
      "ETIMEDOUT",
      "28P01",
      "3D000",
      "57P03",
    ].includes(value.originalCode ?? value.code ?? "") ||
    [
      "DatabaseNotReachable",
      "AuthenticationFailed",
      "DatabaseDoesNotExist",
      "DatabaseAccessDenied",
      "ConnectionClosed",
      "SocketTimeout",
      "TlsConnectionError",
    ].includes(value.kind ?? "") ||
    isDatabaseUnavailable(value.cause, depth + 1) ||
    isDatabaseUnavailable(value.meta?.driverAdapterError, depth + 1) ||
    (Array.isArray(value.errors) &&
      value.errors.some((item) => isDatabaseUnavailable(item, depth + 1)))
  );
}
