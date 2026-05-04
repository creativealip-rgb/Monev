import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";
import { SecurityProvider } from "@/components/SecurityProvider";
import { Providers } from "@/components/Providers";
import { Metadata, Viewport } from "next";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: {
        default: "Monev - Asisten Keuangan AI Pintar",
        template: "%s | Monev"
    },
    description: "Monev adalah asisten keuangan pribadi berbasis AI yang membantu Anda mencatat transaksi lewat suara/foto, menganalisa pengeluaran secara cerdas, dan mencapai target keuangan lebih cepat.",
    manifest: "/manifest.json",
    icons: {
        icon: [
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/icon.svg", type: "image/svg+xml" },
            { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: "/icon-192.png",
    },
    openGraph: {
        title: "Monev - Agentic Finance",
        description: "Asisten keuangan pribadi berbasis AI. Catat transaksi, analisa pengeluaran, dan raih target keuanganmu.",
        type: "website",
        locale: "id_ID",
        siteName: "Monev",
    },
    twitter: {
        card: "summary",
        title: "Monev - Agentic Finance",
        description: "Asisten keuangan pribadi berbasis AI.",
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Monev",
    },
    keywords: ["keuangan", "finance", "AI", "budgeting", "expense tracker", "money management"],
};

export const viewport: Viewport = {
    themeColor: "#eff6ff",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
};

import { auth } from "@/auth";

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Skip auth check during APK build (static export)
    const isApk = process.env.NEXT_PUBLIC_IS_APK === "true";
    const session = isApk ? null : await auth();

    return (
        <html lang="id" suppressHydrationWarning>
            <body className={jakarta.className} suppressHydrationWarning>
                <Providers session={session}>
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
                                if ('serviceWorker' in navigator) {
                                    window.addEventListener('load', function() {
                                        navigator.serviceWorker.register('/push-sw.js').then(function(registration) {
                                            console.log('ServiceWorker registration successful with scope: ', registration.scope);
                                        }, function(err) {
                                            console.log('ServiceWorker registration failed: ', err);
                                        });
                                    });
                                }
                            `,
                        }}
                    />
                    <a href="#main-content" className="skip-link">
                        Lanjut ke konten utama
                    </a>
                    <div id="main-content">
                        {children}
                    </div>
                </Providers>
            </body>
        </html>
    );
}
