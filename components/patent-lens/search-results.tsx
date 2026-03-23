"use client";

import Image from "next/image";

import type { TrademarkResultItem } from "@/lib/types";

interface SearchResultsProps {
  results: TrademarkResultItem[];
  onSelect: (item: TrademarkResultItem) => void;
}

export default function SearchResults({ results, onSelect }: SearchResultsProps) {
  if (results.length === 0) return null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
          商标检索结果
        </h2>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          共 {results.length} 条
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {results.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="cursor-pointer overflow-hidden rounded-[2rem] border border-slate-100 bg-white pro-card-shadow transition-colors hover:border-blue-200"
          >
            <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-slate-50 p-6">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                unoptimized
                className="object-contain"
              />
              <div className="absolute right-4 top-4 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-900">
                匹配度: {Math.round(item.similarityScore * 100)}%
              </div>
            </div>
            <div className="p-8">
              <div className="mb-4 flex items-start justify-between">
                <span className="rounded bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
                  {item.number}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  {item.issueDate || item.filingDate}
                </span>
              </div>
              <h3 className="mb-3 line-clamp-2 text-base font-extrabold leading-tight text-slate-900 transition-colors hover:text-blue-600">
                {item.title}
              </h3>
              <p className="line-clamp-1 text-xs font-medium italic text-slate-500">
                {item.owner}
              </p>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                原图集: {item.imageList?.length ?? 0}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
