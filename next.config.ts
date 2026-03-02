import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  serverExternalPackages: ["ali-oss", "@zilliz/milvus2-sdk-node", "urllib"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
  },
}

export default nextConfig
