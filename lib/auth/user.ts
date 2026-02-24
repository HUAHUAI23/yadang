import type { AccountState, AuthUser } from "@/lib/types";

import "server-only";

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

export const toAuthAccount = (account: {
  id: number;
  balance: bigint;
}): AccountState => {
  const balance = Number(account.balance);
  if (!Number.isFinite(balance)) {
    throw new Error("账户余额超出可序列化范围");
  }

  return {
    id: account.id,
    balance,
  };
};
