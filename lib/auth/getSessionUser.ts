import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  getUserIdForSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/sessionStore";
import { getUserById, toPublic, type UserPublic } from "@/lib/userStore";

export async function getSessionUser(): Promise<UserPublic | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  const userId = await getUserIdForSessionToken(token);
  if (!userId) return null;
  const u = await getUserById(userId);
  return u ? toPublic(u) : null;
}

export async function getSessionUserFromRequest(
  request: NextRequest,
): Promise<UserPublic | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const userId = await getUserIdForSessionToken(token);
  if (!userId) return null;
  const u = await getUserById(userId);
  return u ? toPublic(u) : null;
}
