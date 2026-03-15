"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { LANDING_CAROUSEL, LANDING_FEATURES } from "@/lib/constants";

interface LandingProps {
  onStart: () => void;
}

export default function Landing({ onStart }: LandingProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % LANDING_CAROUSEL.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-8 top-10 h-64 w-64 rounded-full border border-blue-100 bg-blue-50/70" />
        <div className="absolute bottom-16 right-8 h-56 w-56 rounded-full border border-indigo-100 bg-indigo-50/70" />
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-20 lg:py-40">
        <div className="grid grid-cols-1 items-center gap-20 lg:grid-cols-2">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-white">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                Next-Gen AI Platform
              </span>
            </div>
            <h1 className="mb-8 text-6xl font-[900] leading-[1.05] tracking-tight text-slate-900 lg:text-8xl">
              <span>重定义</span>
              <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                知识产权
              </span>
              <span>检索</span>
            </h1>
            <p className="mb-12 max-w-xl text-xl font-medium leading-relaxed text-slate-500">
              PatentLens 聚焦图片检索外观专利与商标，内测期间每天免费试用 10 次查询。
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={onStart}
                className="rounded-[2rem] bg-slate-900 px-10 py-5 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-black"
              >
                开始使用
              </button>
              <div className="ml-4 flex items-center -space-x-3">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-12 w-12 overflow-hidden rounded-full border-4 border-white bg-slate-100"
                  >
                    <Image
                      src={`https://i.pravatar.cc/100?img=${item + 10}`}
                      alt="user"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                <span className="ml-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  +2.5k Professionals
                </span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10 h-[500px] overflow-hidden rounded-[3rem] border border-slate-200 bg-white pro-card-shadow">
              {LANDING_CAROUSEL.map((image, index) => (
                <div
                  key={image.caption}
                  className={`absolute inset-0 transition-opacity duration-300 ${
                    index === activeSlide ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={image.caption}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority={index === 0}
                    className="object-cover"
                  />
                </div>
              ))}

              <div className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 space-x-3">
                {LANDING_CAROUSEL.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSlide(index)}
                    className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                      index === activeSlide
                        ? "w-10 bg-blue-600"
                        : "w-2 bg-white/50 hover:bg-white"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-40 grid grid-cols-1 gap-12 md:grid-cols-3">
          {LANDING_FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </div>
  );
}

const FeatureCard = ({ title, desc, icon, color }: {
  title: string;
  desc: string;
  icon: string;
  color: "blue" | "purple" | "indigo";
}) => {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  } as const;

  return (
    <div className="rounded-[2.5rem] border border-slate-100 bg-white p-10 pro-card-shadow transition-colors hover:border-slate-200">
      <div
        className={`mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border ${
          colorMap[color]
        }`}
      >
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <h3 className="mb-4 text-xl font-extrabold text-slate-900">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
};
