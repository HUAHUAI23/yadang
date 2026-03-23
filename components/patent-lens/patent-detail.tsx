"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TrademarkResultItem } from "@/lib/types";

interface PatentDetailProps {
  item: TrademarkResultItem | null;
  onClose: () => void;
}

export default function PatentDetail({ item, onClose }: PatentDetailProps) {
  const galleryImages = useMemo(() => {
    if (!item) return [] as string[];

    const dedup = new Set<string>();
    const images: string[] = [];

    const append = (url: string | undefined) => {
      if (!url) return;
      const normalized = url.trim();
      if (!normalized || dedup.has(normalized)) return;
      dedup.add(normalized);
      images.push(normalized);
    };

    item.imageList?.forEach((url) => append(url));
    append(item.imageUrl);

    return images;
  }, [item]);

  const [selectedImage, setSelectedImage] = useState("");
  const activeImage = useMemo(() => {
    if (!item) return "";
    if (selectedImage && galleryImages.includes(selectedImage)) {
      return selectedImage;
    }
    return galleryImages[0] ?? item.imageUrl;
  }, [galleryImages, item, selectedImage]);

  return (
    <Dialog
      open={!!item}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedImage("");
          onClose();
        }
      }}
    >
      <DialogContent
        size="wide"
        className="w-full max-w-5xl overflow-hidden rounded-4xl bg-white p-0"
      >
        {item && (
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 bg-gray-50 p-8 flex items-center justify-center">
              <div className="relative w-full h-[60vh] max-h-[70vh]">
                <Image
                  src={activeImage || item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized
                  className="object-contain"
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
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                  商标图搜
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

              {galleryImages.length ? (
                <div className="mt-8">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">
                    专利原图集（共 {galleryImages.length} 张）
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {galleryImages.map((url, index) => (
                      <button
                        key={`${item.id}-${index}`}
                        type="button"
                        onClick={() => setSelectedImage(url)}
                        className="relative block h-20 rounded-xl border border-gray-200 overflow-hidden bg-gray-100"
                        title={`查看原图 ${index + 1}`}
                      >
                        <Image
                          src={url}
                          alt={`${item.title}-source-${index + 1}`}
                          fill
                          sizes="80px"
                          unoptimized
                          className="object-cover"
                        />
                        {activeImage === url ? (
                          <span className="absolute inset-0 ring-2 ring-blue-500 ring-inset" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-10 flex space-x-4">
                <Button className="flex-1 rounded-2xl bg-gray-900 py-4 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-black">
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
