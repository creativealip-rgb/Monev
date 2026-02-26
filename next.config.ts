import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants";

const nextConfig = (phase: string): NextConfig => {
  // Only allow static export during the actual production build for APK
  const isApkBuild = process.env.IS_APK === "true" && phase === PHASE_PRODUCTION_BUILD;

  return {
    output: isApkBuild ? "export" : undefined,
    images: {
      unoptimized: true,
    },
    env: {
      NEXT_PUBLIC_IS_APK: isApkBuild ? "true" : "false",
    },
  };
};

export default nextConfig;
