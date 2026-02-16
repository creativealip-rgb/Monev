import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
});

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.qrserver.com",
      },
    ],
  },
  serverExternalPackages: ["better-sqlite3"],
  output: "standalone",
  turbopack: {},
};

export default withPWA(nextConfig);
