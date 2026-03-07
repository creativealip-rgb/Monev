import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const nextConfig = (phase: string): NextConfig => {
    // Only allow static export during the actual production build for APK
    const isApkBuild = process.env.IS_APK === "true" && phase === PHASE_PRODUCTION_BUILD;
    // Use standalone output for Docker deployment (not APK build)
    const isDockerBuild = process.env.IS_DOCKER === "true" || (!isApkBuild && phase === PHASE_PRODUCTION_BUILD);

    return {
        // APK needs static export, Docker needs standalone, dev needs undefined
        output: isApkBuild ? "export" : isDockerBuild ? "standalone" : undefined,

        // Image optimization configuration
        images: {
            // Only disable for APK build (static export doesn't support image optimization)
            unoptimized: isApkBuild,
            // Enable modern image formats
            formats: ["image/avif", "image/webp"],
            // Responsive image sizes
            deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
            imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
            // Remote patterns for external images
            remotePatterns: [
                {
                    protocol: "https",
                    hostname: "**",
                },
            ],
        },

        env: {
            NEXT_PUBLIC_IS_APK: isApkBuild ? "true" : "false",
        },

        // Performance optimizations
        experimental: {
            // Enable optimized package imports
            optimizePackageImports: ["lucide-react", "framer-motion", "date-fns"],
        },

        // Compiler optimizations
        compiler: {
            // Remove console.log in production (keep errors)
            removeConsole: {
                exclude: ["error", "warn"],
            },
        },

        // Strict mode for better development experience
        reactStrictMode: true,

        // Power by header (security - hide framework info)
        poweredByHeader: false,
    };
};

export default nextConfig;
