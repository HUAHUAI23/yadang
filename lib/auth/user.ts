import "server-only";

import { businessPrisma } from "@/lib/db/business";
import type { AuthUser, UserCredits } from "@/lib/types";

export const toAuthUser = (user: {
  id: number;
  username: string | null;
  phone: string | null;
  avatar: string;
}): AuthUser => ({
  id: user.id,
  username: user.username,
  phone: user.phone,
  avatar: user.avatar,
});

export async function ensureUserCredits(userId: number): Promise<UserCredits> {
  const credits = await businessPrisma.userCredits.findUnique({
    where: { userId },
  });

  if (credits) {
    return { balance: credits.balance, totalRecharged: credits.totalRecharged };
  }

  const created = await businessPrisma.userCredits.create({
    data: { userId, balance: 0, totalRecharged: 0 },
  });

  return { balance: created.balance, totalRecharged: created.totalRecharged };
}
