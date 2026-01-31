"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DB_SYNC_TIME, SEARCH_COST_SINGLE, SEARCH_COST_BOTH } from "@/lib/constants";
import type { SearchConfig } from "@/lib/types";
import LibraryOption from "@/components/patent-lens/library-option";

interface UploadSectionProps {
  onSearch: (base64: string, config: SearchConfig) => void;
  isLoading: boolean;
  currentBalance: number;
  preview: string | null;
  setPreview: (val: string | null) => void;
  searchConfig: SearchConfig;
  setSearchConfig: (config: SearchConfig) => void;
  cost: number;
}

export default function UploadSection({
  onSearch,
  isLoading,
  currentBalance,
  preview,
  setPreview,
  searchConfig,
  setSearchConfig,
  cost,
}: UploadSectionProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSearch =
    !!preview && (searchConfig.patents || searchConfig.trademarks) && currentBalance >= cost;

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      window.alert("请上传图片文件");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const onDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(event.type === "dragenter" || event.type === "dragover");
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleFile(event.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-6 lg:py-20">
      <div className="max-w-4xl mb-16">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
            数据库更新时间: {DB_SYNC_TIME}
          </span>
        </div>
        <h1 className="text-5xl lg:text-7xl font-[900] text-slate-900 tracking-tight leading-[1.1] mb-8">
          下一代 <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">知识产权</span>
          <br />智能视觉引擎
        </h1>
        <p className="text-lg lg:text-xl text-slate-500 font-medium leading-relaxed max-w-2xl">
          通过 AI 视觉引擎，秒级识别并比对美国外观专利及商标库中的相似设计。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <div
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
            className={`relative h-[500px] flex flex-col items-center justify-center rounded-[3rem] transition-all duration-700 overflow-hidden pro-card-shadow accent-glow ${
              dragActive
                ? "bg-blue-50/50 ring-4 ring-blue-500/20"
                : "bg-white border border-slate-200/60"
            } cursor-pointer`}
            onClick={() => !isLoading && fileInputRef.current?.click()}
          >
            {isLoading && <div className="scan-line" />}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(event) =>
                event.target.files?.[0] && handleFile(event.target.files[0])
              }
              disabled={isLoading}
            />

            {preview ? (
              <div className="relative w-full h-full p-12 flex items-center justify-center group/preview">
                <div className="relative w-full h-full">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    sizes="(max-width: 1024px) 90vw, 600px"
                    unoptimized
                    className="object-contain rounded-3xl transition-all duration-1000 group-hover/preview:scale-[1.05] drop-shadow-2xl"
                  />
                </div>
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/preview:opacity-100 transition-all duration-500 backdrop-blur-[4px] flex items-center justify-center">
                  <div className="bg-white px-8 py-4 rounded-2xl text-slate-900 font-[900] text-xs uppercase tracking-widest shadow-2xl">
                    点击更换文件
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center px-10 text-center group">
                <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400 mb-8 flex items-center justify-center border border-slate-200 group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white group-hover:rotate-12 group-hover:shadow-2xl group-hover:shadow-blue-500/40 transition-all duration-700">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-[900] text-slate-900 tracking-tight">
                  拖拽文件或点击上传
                </h2>
                <p className="text-sm text-slate-400 mt-4 font-bold uppercase tracking-wide">
                  支持高分辨率 PNG, JPG (20-30 积分/次)
                </p>
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-xl flex flex-col items-center justify-center z-30">
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
                  <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                </div>
                <span className="text-sm font-black text-slate-900 uppercase tracking-[0.3em] animate-pulse">
                  正在同步全球数据库...
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col space-y-8">
          <div className="bg-white rounded-[3rem] p-10 pro-card-shadow border border-slate-200/60 flex-grow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">
                  检索配置
                </h3>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                  Live Engine
                </span>
              </div>

              <div className="space-y-5">
                <LibraryOption
                  label="美国外观专利"
                  subLabel="Design Patents"
                  checked={searchConfig.patents}
                  onChange={(value) =>
                    setSearchConfig({ ...searchConfig, patents: value })
                  }
                  color="blue"
                />
                <LibraryOption
                  label="注册商标库"
                  subLabel="Trademark Registry"
                  checked={searchConfig.trademarks}
                  onChange={(value) =>
                    setSearchConfig({ ...searchConfig, trademarks: value })
                  }
                  color="purple"
                />
              </div>
            </div>

            <div className="mt-12">
              <div className="flex justify-between items-end mb-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                    预计消耗
                  </p>
                  <p className="text-4xl font-[900] text-slate-900">
                    {cost}
                    <span className="text-xs font-bold text-slate-400 ml-2 uppercase">
                      积分
                    </span>
                  </p>
                </div>
              </div>

              <Button
                onClick={() => preview && onSearch(preview, searchConfig)}
                disabled={!canSearch || isLoading}
                className={`w-full h-auto py-6 rounded-[2rem] font-[900] text-white transition-all shadow-2xl active:scale-95 flex items-center justify-center space-x-3 text-lg tracking-widest uppercase ${
                  canSearch && !isLoading
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1"
                    : "bg-slate-200 cursor-not-allowed text-slate-400"
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>开始专业检索</span>
              </Button>

              {currentBalance < cost && !isLoading && (
                <p className="text-center mt-6 text-[10px] font-black text-rose-500 uppercase tracking-widest">
                  积分余额不足，请先充值
                </p>
              )}

              <div className="mt-6 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>单库检索 {SEARCH_COST_SINGLE} 积分</span>
                <span>双库检索 {SEARCH_COST_BOTH} 积分</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
