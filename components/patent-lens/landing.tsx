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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[520px] h-[520px] bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-20 lg:py-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-slate-900 text-white mb-8 border border-slate-800 shadow-2xl">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                Next-Gen AI Platform
              </span>
            </div>
            <h1 className="text-6xl lg:text-8xl font-[900] text-slate-900 leading-[1.05] tracking-tight mb-8">
              <span>重定义</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                知识产权
              </span>
              <span>检索</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl mb-12">
              PatentLens 聚焦图片检索外观专利与商标，内测期间每天免费试用 10 次查询。
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={onStart}
                className="bg-slate-900 hover:bg-black text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all shadow-2xl shadow-slate-200 hover:-translate-y-1 active:scale-95"
              >
                开始使用
              </button>
              <div className="flex -space-x-3 items-center ml-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="w-12 h-12 rounded-full border-4 border-white overflow-hidden bg-slate-100"
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

          <div className="relative animate-in fade-in slide-in-from-right-12 duration-1000 delay-200">
            <div className="relative z-10 rounded-[3rem] overflow-hidden pro-card-shadow border border-slate-200/50 group h-[500px]">
              {LANDING_CAROUSEL.map((image, index) => (
                <div
                  key={image.caption}
                  className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
                    index === activeSlide
                      ? "opacity-100 scale-100 translate-x-0"
                      : "opacity-0 scale-110 translate-x-full"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
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

              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3 z-30">
                {LANDING_CAROUSEL.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSlide(index)}
                    className={`h-1.5 transition-all duration-500 rounded-full ${
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

        <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-12">
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
    <div className="p-10 bg-white rounded-[2.5rem] pro-card-shadow border border-slate-100 hover:-translate-y-2 transition-all group">
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border transition-all group-hover:scale-110 ${
          colorMap[color]
        }`}
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <h3 className="text-xl font-extrabold text-slate-900 mb-4">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
};
