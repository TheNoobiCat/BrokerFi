import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@klinecharts/pro'],
};

if (process.env.NODE_ENV === 'production') nextConfig.compiler = { removeConsole: true };

export default nextConfig;
