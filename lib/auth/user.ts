import { fenToYuan } from "@/lib/money";
import type { AccountState, AuthUser } from "@/lib/types";

import "server-only";

export const toAuthUser = (user: {
  id: number;
  username: string | null;
  phone: string | null;
  avatar: string;
  isAdmin: boolean;
  isBlacklisted: boolean;
  blacklistReason: string | null;
}): AuthUser => ({
  id: user.id,
  username: user.username,
  phone: user.phone,
  avatar: user.avatar,
  isAdmin: user.isAdmin,
  isBlacklisted: user.isBlacklisted,
  blacklistReason: user.blacklistReason,
});

export const toAuthAccount = (account: {
  id: number;
  balance: bigint;
}): AccountState => {
  return {
    id: account.id,
    balance: fenToYuan(account.balance),
  };
};
