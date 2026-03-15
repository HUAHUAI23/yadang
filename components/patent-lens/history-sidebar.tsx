"use client";

import Image from "next/image";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { SearchHistoryItem } from "@/lib/types";

interface HistorySidebarProps {
  history: SearchHistoryItem[];
  onSelectItem: (item: SearchHistoryItem) => void;
  onClearHistory: () => void;
}

export default function HistorySidebar({
  history,
  onSelectItem,
  onClearHistory,
}: HistorySidebarProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date
      .getHours()
      .toString()
      .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <aside className="sticky top-20 flex h-[calc(100vh-80px)] w-full flex-col overflow-hidden border-r border-slate-200 bg-white lg:w-96">
      <div className="flex items-end justify-between p-8">
        <div>
          <h2 className="text-sm font-[900] text-slate-900 tracking-widest uppercase">
            历史记录
          </h2>
          <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-wider">
            最近 50 条检索项
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="rounded-lg border border-slate-100 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-rose-500"
          >
            清空
          </button>
        )}
      </div>

      <ScrollArea className="flex-grow px-6 pb-10">
        <div className="space-y-4 pr-4">
          {history.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-slate-100 px-8 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-slate-50 text-slate-200">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                尚无检索数据
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="relative flex cursor-pointer items-center overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-4 transition-colors hover:border-blue-200"
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    item.status === "SUCCESS" ? "bg-blue-500" : "bg-rose-500"
                  }`}
                />

                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-50 bg-slate-50">
                  <Image
                    src={item.queryImageUrl}
                    alt="History"
                    fill
                    sizes="64px"
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="ml-5 flex-grow overflow-hidden">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 tracking-wider">
                      {formatTime(item.timestamp)}
                    </span>
                    <div className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-600">
                      -¥{item.cost.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-md font-black tracking-widest uppercase ${
                        item.status === "SUCCESS"
                          ? "bg-emerald-600 text-white"
                          : "bg-rose-600 text-white"
                      }`}
                    >
                      {item.status === "SUCCESS" ? "成功" : "失败"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {item.resultCount} 条结果
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-slate-200 p-8">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-500">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest leading-none">
            搜索记录存储于服务端并可追溯
          </p>
        </div>
      </div>
    </aside>
  );
}
