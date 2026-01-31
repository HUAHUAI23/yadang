"use client";

import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { HistoryItem } from "@/lib/types";

interface HistorySidebarProps {
  history: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
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
    <aside className="w-full lg:w-96 bg-white/40 border-r border-slate-200/60 flex flex-col h-[calc(100vh-80px)] sticky top-20 overflow-hidden">
      <div className="p-8 flex justify-between items-end">
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
            className="text-[10px] font-black text-slate-400 hover:text-rose-500 transition-all uppercase tracking-[0.2em] px-3 py-1 bg-white rounded-lg border border-slate-100 shadow-sm"
          >
            清空
          </button>
        )}
      </div>

      <ScrollArea className="flex-grow px-6 pb-10">
        <div className="space-y-4 pr-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-8 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
              <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-200 mb-6">
                <svg
                  className="w-8 h-8"
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
                className="group flex items-center p-4 rounded-[2rem] bg-white border border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer transition-all duration-500 active:scale-[0.96] overflow-hidden relative"
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    item.config.patents && item.config.trademarks
                      ? "bg-gradient-to-b from-blue-500 to-purple-500"
                      : item.config.patents
                        ? "bg-blue-500"
                        : "bg-purple-500"
                  }`}
                />

                <div className="relative w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-50 transition-all duration-700 group-hover:scale-95 group-hover:rotate-2">
                  <Image
                    src={item.thumbnail}
                    alt="History"
                    fill
                    sizes="64px"
                    unoptimized
                    className="object-cover group-hover:scale-125 transition-transform duration-1000"
                  />
                </div>
                <div className="ml-5 flex-grow overflow-hidden">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-black text-slate-400 tracking-wider">
                      {formatTime(item.timestamp)}
                    </span>
                    <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 shadow-sm">
                      -{item.cost}P
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.config.patents && (
                      <span className="text-[9px] px-2 py-0.5 bg-slate-900 text-white rounded-md font-black tracking-widest uppercase">
                        外观
                      </span>
                    )}
                    {item.config.trademarks && (
                      <span className="text-[9px] px-2 py-0.5 bg-indigo-600 text-white rounded-md font-black tracking-widest uppercase">
                        商标
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-8 bg-white/60 border-t border-slate-200/50 backdrop-blur-md">
        <div className="flex items-center space-x-3 text-slate-400">
          <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg">
            <svg
              className="w-3.5 h-3.5"
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
            数据加密存储于本地浏览器
          </p>
        </div>
      </div>
    </aside>
  );
}
