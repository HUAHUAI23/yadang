"use client";

import { useState } from "react";
import Image from "next/image";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PatentResult } from "@/lib/types";
import { SearchType } from "@/lib/types";

interface SearchResultsProps {
  patents: PatentResult[];
  trademarks: PatentResult[];
  onSelect: (item: PatentResult) => void;
}

export default function SearchResults({
  patents,
  trademarks,
  onSelect,
}: SearchResultsProps) {
  const [activeTab, setActiveTab] = useState<SearchType>(
    SearchType.DESIGN_PATENT
  );

  if (patents.length === 0 && trademarks.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SearchType)}>
        <div className="flex flex-col items-center mb-16">
          <TabsList className="bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200">
            <TabsTrigger
              value={SearchType.DESIGN_PATENT}
              className="px-10 py-3 rounded-[1.75rem] font-black text-xs transition-all tracking-widest uppercase flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xl data-[state=active]:ring-1 data-[state=active]:ring-slate-200 text-slate-400 hover:text-slate-600"
            >
              <span>外观专利</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] bg-slate-200 text-slate-500 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                {patents.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value={SearchType.TRADEMARK}
              className="px-10 py-3 rounded-[1.75rem] font-black text-xs transition-all tracking-widest uppercase flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xl data-[state=active]:ring-1 data-[state=active]:ring-slate-200 text-slate-400 hover:text-slate-600"
            >
              <span>注册商标</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] bg-slate-200 text-slate-500 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                {trademarks.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={SearchType.DESIGN_PATENT}>
          <ResultGrid results={patents} onSelect={onSelect} />
        </TabsContent>
        <TabsContent value={SearchType.TRADEMARK}>
          <ResultGrid results={trademarks} onSelect={onSelect} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ResultGrid({
  results,
  onSelect,
}: {
  results: PatentResult[];
  onSelect: (item: PatentResult) => void;
}) {
  return (
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
          </div>
        </div>
      ))}
    </div>
  );
}
