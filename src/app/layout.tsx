import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Monev - Agentic Finance",
    description: "Your proactive financial assistant.",
    manifest: "/manifest.json",
};

export const viewport = {
    themeColor: "#3b82f6",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <main className="min-h-screen max-w-[500px] mx-auto bg-white/50 backdrop-blur-sm shadow-xl shadow-slate-200/50 pb-24 relative">
                    {children}
                </main>
                <BottomNav />
            </body>
        </html>
    );
}
