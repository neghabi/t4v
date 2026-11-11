export const MIN_TOP_UP_CREDITS = 10;
export const MAX_TOP_UP_CREDITS = 1_000_000;
export const CREDIT_PACKAGES = [100, 500, 1000, 5000] as const;

export type CreditTopUpPublic = {
  id: string;
  userId: string;
  userEmail?: string;
  requestedCredits: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: number;
  reviewedAt: number | null;
};
