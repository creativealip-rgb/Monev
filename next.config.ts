import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
  output: "standalone",
};

export default withPWA(nextConfig);
