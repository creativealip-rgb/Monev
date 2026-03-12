import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const mockHistory = [
            {
                id: "1",
                type: "Laporan Bulanan",
                period: "Desember 2025",
                createdAt: new Date().toISOString(),
                size: "245 KB",
            },
            {
                id: "2",
                type: "Laporan Bulanan",
                period: "November 2025",
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                size: "238 KB",
            },
            {
                id: "3",
                type: "Laporan Tahunan",
                period: "2024",
                createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
                size: "1.2 MB",
            },
        ];

        return NextResponse.json({
            success: true,
            data: mockHistory,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal mengambil riwayat";
        console.error("Report History Error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
