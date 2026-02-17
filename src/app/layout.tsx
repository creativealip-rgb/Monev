import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";
import { SecurityProvider } from "@/components/SecurityProvider";
import { Providers } from "@/components/Providers";
import { Metadata, Viewport } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Monev - Agentic Finance",
    description: "Asisten keuangan pribadi berbasis AI yang proaktif.",
    manifest: "/manifest.json",
    icons: {
        icon: "/icon.svg",
        apple: "/icon.svg",
    },
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
            <body className={inter.className} suppressHydrationWarning>
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
