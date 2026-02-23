import "server-only";

import type { AuthUser } from "@/lib/types";

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
