/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.s3.amazonaws.com" },
      { protocol: "https", hostname: "**.vercel.app" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
};

module.exports = nextConfig;
