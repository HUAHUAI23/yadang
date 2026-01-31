"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PatentResult } from "@/lib/types";
import { SearchType } from "@/lib/types";

interface PatentDetailProps {
  item: PatentResult | null;
  onClose: () => void;
}

export default function PatentDetail({ item, onClose }: PatentDetailProps) {
  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden p-0">
        {item && (
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 bg-gray-50 p-8 flex items-center justify-center">
              <div className="relative w-full h-[60vh] max-h-[70vh]">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain drop-shadow-xl"
                />
              </div>
            </div>

            <div className="md:w-1/2 p-10 flex flex-col h-full">
              <DialogHeader className="text-left">
                <DialogTitle className="text-3xl font-extrabold text-gray-900 leading-tight">
                  {item.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  #{item.number}
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center space-x-2 mt-6">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    item.type === SearchType.DESIGN_PATENT
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {item.type === SearchType.DESIGN_PATENT ? "外观专利" : "商标"}
                </span>
                <span className="text-xs font-bold text-gray-400">
                  {item.status || "Active"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-8 my-10">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    权利人 / 持有人
                  </label>
                  <p className="text-gray-800 font-semibold">{item.owner}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    申请日期
                  </label>
                  <p className="text-gray-800 font-semibold">
                    {item.filingDate}
                  </p>
                </div>
                {item.issueDate && (
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      授权日期
                    </label>
                    <p className="text-gray-800 font-semibold">
                      {item.issueDate}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    匹配度
                  </label>
                  <p className="text-gray-800 font-semibold">
                    {Math.round(item.similarityScore * 100)}%
                  </p>
                </div>
              </div>

              <div className="flex-grow">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  详细说明
                </label>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {item.description}
                </p>
              </div>

              <div className="mt-10 flex space-x-4">
                <Button className="flex-1 bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-bold transition-all uppercase text-xs tracking-widest">
                  查看官方详情
                </Button>
                <Button
                  variant="outline"
                  className="p-4 rounded-2xl border border-gray-200 hover:bg-gray-50"
                >
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
