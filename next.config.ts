import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
});

const nextConfig: NextConfig = {
  /* config options here */

  serverExternalPackages: ["better-sqlite3"],
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.qrserver.com",
      },
    ],
  },
  turbopack: {
    root: __dirname,
  },
};

export default withPWA(nextConfig);
