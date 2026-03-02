"use client";

import { Button } from "@/components/ui/button";
import type { AccountState } from "@/lib/types";

interface HeaderProps {
  account: AccountState | null;
  onOpenRecharge: () => void;
  isAuthenticated: boolean;
  onLogout: () => void;
  onLogin: () => void;
}

export default function Header({
  account,
  onOpenRecharge,
  isAuthenticated,
  onLogout,
  onLogin,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-slate-200/50 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-6 sm:px-10">
        <div className="flex justify-between items-center h-20">
          <div
            className="flex items-center space-x-3 group cursor-pointer"
            onClick={() => (window.location.href = "/")}
          >
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform">
              <svg
                className="w-6 h-6 text-white"
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
            <span className="text-xl font-[900] bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tighter uppercase">
              PatentLens
            </span>
          </div>

          <div className="flex items-center space-x-6">
            {isAuthenticated && (
              <div className="hidden lg:flex items-center space-x-5">
                <div className="flex flex-col items-end border-r border-slate-200 pr-5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    账户余额
                  </span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span
                      className={`text-lg font-[900] ${
                        (account?.balance ?? 0) < 20 ? "text-rose-500" : "text-slate-900"
                      }`}
                    >
                      {(account?.balance ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      PTS
                    </span>
                  </div>
                </div>

                <Button
                  onClick={onOpenRecharge}
                  className="h-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-95"
                >
                  充值
                </Button>
              </div>
            )}

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="group relative">
                  <div className="w-10 h-10 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center text-slate-900 font-black text-xs shadow-sm cursor-pointer hover:border-blue-200 transition-all">
                    ID
                  </div>
                  <div className="absolute right-0 top-full pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
                    <div className="bg-white border border-slate-100 p-2 rounded-2xl shadow-2xl min-w-[160px]">
                      <button
                        onClick={onLogout}
                        className="w-full text-left px-4 py-2 text-[10px] font-black text-rose-500 hover:bg-rose-50 rounded-xl transition-colors uppercase tracking-widest"
                      >
                        退出登录
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={onLogin}
                className="h-auto text-[11px] font-black text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-6 py-2.5 rounded-xl transition-all shadow-sm tracking-widest uppercase active:scale-95"
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
