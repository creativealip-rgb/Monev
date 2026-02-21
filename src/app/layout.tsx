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

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id" suppressHydrationWarning>
            <body className={jakarta.className} suppressHydrationWarning>
                <Providers>
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
                                if ('serviceWorker' in navigator) {
                                    caches.keys().then(function(names) {
                                        for (let name of names) caches.delete(name);
                                    });
                                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                                        for (let registration of registrations) {
                                            registration.unregister();
                                        }
                                    });
                                }
                            `,
                        }}
                    />
                    {children}
                </Providers>
            </body>
        </html>
    );
}
