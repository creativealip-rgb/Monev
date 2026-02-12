import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "api.qrserver.com",
            },
        ],
    },
    serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
