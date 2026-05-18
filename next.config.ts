import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      accounts: "./lib/stubs/accounts.ts",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      accounts: path.resolve(__dirname, "lib/stubs/accounts.ts"),
    };
    return config;
  },
};

export default nextConfig;
