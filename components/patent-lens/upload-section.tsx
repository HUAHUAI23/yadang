"use client";

import { useRef, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { DB_SYNC_TIME } from "@/lib/constants";

interface UploadSectionProps {
  onSearch: (base64: string) => void;
  isLoading: boolean;
  currentBalance: number;
  preview: string | null;
  setPreview: (val: string | null) => void;
  cost: number;
}

export default function UploadSection({
  onSearch,
  isLoading,
  currentBalance,
  preview,
  setPreview,
  cost,
}: UploadSectionProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSearch = !!preview && currentBalance >= cost && cost > 0;

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
    <div className="mx-auto w-full max-w-7xl px-6 py-12 lg:py-20">
      <div className="mb-16 max-w-4xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
            数据库更新时间: {DB_SYNC_TIME}
          </span>
        </div>
        <h1 className="mb-8 text-5xl font-[900] leading-[1.1] tracking-tight text-slate-900 lg:text-7xl">
          下一代{" "}
          <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
            商标图搜
          </span>
          <br />
          智能视觉引擎
        </h1>
        <p className="max-w-2xl text-lg font-medium leading-relaxed text-slate-500 lg:text-xl">
          上传一张图片，系统会完成向量化、Milvus 检索，并返回关联的商标/外观信息结果。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
            className={`relative h-[500px] flex flex-col items-center justify-center overflow-hidden rounded-[3rem] transition-colors duration-300 pro-card-shadow accent-glow ${
              dragActive
                ? "border border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                : "border border-slate-200 bg-white"
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
              <div className="flex h-full w-full items-center justify-center p-12">
                <div className="relative h-full w-full">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    sizes="(max-width: 1024px) 90vw, 600px"
                    unoptimized
                    className="rounded-3xl object-contain"
                  />
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
                  <div className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-xs font-[900] uppercase tracking-widest text-slate-900">
                    点击更换文件
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center px-10 text-center">
                <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] border border-slate-200 bg-slate-50 text-slate-400">
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <p className="mt-4 text-sm font-bold uppercase tracking-wide text-slate-400">
                  支持 PNG / JPG（单次动态扣费）
                </p>
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/90">
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border-4 border-blue-100">
                  <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-r-transparent" />
                </div>
                <span className="text-sm font-black uppercase tracking-[0.3em] text-slate-900">
                  正在执行商标向量检索...
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-8 lg:col-span-4">
          <div className="flex flex-grow flex-col justify-between rounded-[3rem] border border-slate-200 bg-white p-10 pro-card-shadow">
            <div>
              <div className="mb-10 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">
                  检索配置
                </h3>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                  Live Engine
                </span>
              </div>

              <div className="rounded-[2rem] border border-indigo-100 bg-indigo-50/40 p-5">
                <div className="flex items-center gap-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 font-black text-white">
                    商
                  </div>
                  <div>
                    <p className="text-sm font-[900] text-slate-800 tracking-tight">
                      商标向量检索
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Trademark Image Search
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <div className="mb-8 flex items-end justify-between rounded-[2rem] border border-slate-100 bg-slate-50 p-6">
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    预计消耗
                  </p>
                  <p className="text-4xl font-[900] text-slate-900">
                    ¥{cost.toFixed(2)}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => preview && onSearch(preview)}
                disabled={!canSearch || isLoading}
                className={`h-auto w-full rounded-[2rem] py-6 text-lg font-[900] uppercase tracking-widest text-white shadow-none ${
                  canSearch && !isLoading
                    ? "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    : "bg-slate-200 cursor-not-allowed text-slate-400"
                }`}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <p className="mt-6 text-center text-[10px] font-black uppercase tracking-widest text-rose-500">
                  余额不足，请先充值
                </p>
              )}

              <div className="mt-6 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>当前余额 ¥{currentBalance.toFixed(2)}</span>
                <span>按账户价格扣费</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
