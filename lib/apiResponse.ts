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
  if (!(error instanceof ApiError))
    console.error(
      JSON.stringify({
        level: "error",
        requestId,
        message:
          error instanceof Error ? error.message : "Unexpected server error",
      }),
    );
  return NextResponse.json(
    {
      error:
        error instanceof ApiError
          ? error.message
          : "درخواست انجام نشد. کمی بعد دوباره تلاش کنید.",
      code: error instanceof ApiError ? error.code : "internal_error",
      requestId,
    },
    {
      status: error instanceof ApiError ? error.status : 500,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Request-Id": requestId,
      },
    },
  );
}
