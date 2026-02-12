import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/frontend/components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Monev - Personal Finance Tracker",
    description: "Track your income, expenses, budgets, and financial goals with AI assistance",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    themeColor: "#10b981",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id">
            <body className={inter.className}>
                {children}
                <BottomNav />
            </body>
        </html>
    );
}
