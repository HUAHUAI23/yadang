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
    <div className="max-w-7xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
          商标检索结果
        </h2>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          共 {results.length} 条
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {results.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="group bg-white rounded-[2rem] overflow-hidden border border-slate-100 pro-card-shadow hover:-translate-y-3 transition-all duration-500 cursor-pointer"
          >
            <div className="relative aspect-square bg-slate-50 flex items-center justify-center p-6 overflow-hidden">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                unoptimized
                className="object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full shadow-sm text-[10px] font-black text-slate-900 border border-white">
                匹配度: {Math.round(item.similarityScore * 100)}%
              </div>
            </div>
            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-widest">
                  {item.number}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  {item.issueDate || item.filingDate}
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 leading-tight mb-3 line-clamp-2 text-base group-hover:text-blue-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium line-clamp-1 italic">
                {item.owner}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3">
                原图集: {item.imageList?.length ?? 0}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
