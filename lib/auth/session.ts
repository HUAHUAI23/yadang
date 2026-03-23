import { getSessionToken, verifySessionToken } from "@/lib/auth/jwt";
import { businessPrisma } from "@/lib/db/business";
import { env } from "@/lib/env";

import "server-only";

export class AuthSessionError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type SessionUser = {
  id: number;
  username: string | null;
  phone: string | null;
  avatar: string;
  isAdmin: boolean;
  isBlacklisted: boolean;
  blacklistReason: string | null;
};

export type SessionAccount = {
  id: number;
  userId: number;
  balance: bigint;
};

export type SessionContext = {
  user: SessionUser;
  account: SessionAccount;
};

export type AdminSessionContext = SessionContext & {
  user: SessionUser & {
    isAdmin: true;
  };
};

export async function resolveSessionContext(
  options: { createAccountIfMissing?: boolean } = {},
): Promise<SessionContext> {
  const token = await getSessionToken();
  if (!token) {
    throw new AuthSessionError(401, "未登录");
  }

  let userId = 0;
  try {
    const verified = await verifySessionToken(token);
    userId = verified.userId;
  } catch {
    throw new AuthSessionError(401, "会话已失效");
  }

  const user = await businessPrisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      phone: true,
      avatar: true,
      isAdmin: true,
      isBlacklisted: true,
      blacklistReason: true,
    },
  });

  if (!user) {
    throw new AuthSessionError(401, "未登录");
  }

  let account = await businessPrisma.account.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      balance: true,
    },
  });

  if (!account && options.createAccountIfMissing) {
    try {
      account = await businessPrisma.account.create({
        data: {
          userId,
          balance: BigInt(env.initialAccountBalance),
        },
        select: {
          id: true,
          userId: true,
          balance: true,
        },
      });
    } catch {
      // Handle unique conflicts in concurrent requests.
      account = await businessPrisma.account.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          balance: true,
        },
      });
    }
  }

  if (!account) {
    throw new AuthSessionError(500, "账户初始化失败");
  }

  return {
    user,
    account,
  };
}

export async function requireAdminSession(
  options: { createAccountIfMissing?: boolean } = {},
): Promise<AdminSessionContext> {
  const session = await resolveSessionContext(options);
  if (!session.user.isAdmin) {
    throw new AuthSessionError(403, "无管理员权限");
  }

  return {
    ...session,
    user: {
      ...session.user,
      isAdmin: true,
    },
  };
}

export function assertBusinessAllowed(
  user: Pick<SessionUser, "isBlacklisted" | "blacklistReason">,
) {
  if (!user.isBlacklisted) {
    return;
  }

  const reason = user.blacklistReason?.trim();
  throw new AuthSessionError(
    403,
    reason ? `账号已被限制业务操作：${reason}` : "账号已被限制业务操作",
  );
}

export async function resolveBusinessSessionContext(
  options: { createAccountIfMissing?: boolean } = {},
): Promise<SessionContext> {
  const session = await resolveSessionContext(options);
  assertBusinessAllowed(session.user);
  return session;
}
