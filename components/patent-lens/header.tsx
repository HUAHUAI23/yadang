"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { AccountState, AuthUser } from "@/lib/types";

interface HeaderProps {
  account: AccountState | null;
  user: AuthUser | null;
  onOpenRecharge: () => void;
  isAuthenticated: boolean;
  isAdmin?: boolean;
  onLogout: () => void;
  onLogin: () => void;
}

export default function Header({
  account,
  user,
  onOpenRecharge,
  isAuthenticated,
  isAdmin = false,
  onLogout,
  onLogin,
}: HeaderProps) {
  const balance = account?.balance ?? 0;
  const userLabel = user?.phone?.trim() || user?.username?.trim() || "已登录";
  const userBadge = (user?.phone?.trim() || user?.username?.trim() || "ME")
    .slice(-2)
    .toUpperCase();
  const balanceText = balance.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95">
      <div className="mx-auto max-w-screen-2xl px-6 sm:px-10">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-900 p-2.5 text-white">
              <svg
                className="size-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <span className="text-xl font-[900] tracking-tight text-slate-950">
              立搜
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <div className="hidden items-center gap-5 lg:flex">
                {isAdmin ? (
                  <Link
                    href="/admin"
                    className="rounded-xl border border-slate-200 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    管理后台
                  </Link>
                ) : null}
                <div className="flex flex-col items-end border-r border-slate-200 pr-5">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    账户余额
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span
                      className={`text-lg font-[900] ${
                        balance < 5 ? "text-rose-500" : "text-slate-900"
                      }`}
                    >
                      ¥{balanceText}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={onOpenRecharge}
                  className="h-10 rounded-xl bg-slate-900 px-5 text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-slate-800"
                >
                  充值
                </Button>
              </div>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 lg:hidden">
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700"
                    >
                      后台
                    </Link>
                  ) : null}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      余额
                    </p>
                    <p className={`text-sm font-[900] ${balance < 5 ? "text-rose-500" : "text-slate-900"}`}>
                      ¥{balanceText}
                    </p>
                  </div>
                  <Button
                    onClick={onOpenRecharge}
                    className="h-10 rounded-xl bg-slate-900 px-4 text-[11px] font-black uppercase tracking-[0.18em] text-white hover:bg-slate-800"
                  >
                    充值
                  </Button>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                  <div className="max-w-24 text-right sm:max-w-36">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      用户手机号
                    </p>
                    <p className="truncate text-sm font-black text-slate-900">{userLabel}</p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-xs font-black text-slate-900">
                    {userBadge}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={onLogout}
                  className="h-10 rounded-xl border-slate-200 px-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                >
                  退出
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={onLogin}
                className="h-10 rounded-xl border-slate-200 bg-white px-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 hover:border-slate-300 hover:bg-slate-50"
              >
                登录
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
