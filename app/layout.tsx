import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

const plusJakarta = localFont({
  src: "../public/fonts/plus-jakarta/PlusJakartaSans-Variable.ttf",
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: "200 800",
});

const notoSans = localFont({
  src: "../public/fonts/noto-sans-sc/NotoSansSC-Variable.ttf",
  variable: "--font-noto-sc",
  display: "swap",
  weight: "100 900",
});

const geistMono = localFont({
  src: "../public/fonts/geist/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "立搜 - 知识产权图像检索",
  description: "下一代知识产权智能视觉检索体验",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${plusJakarta.variable} ${notoSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
