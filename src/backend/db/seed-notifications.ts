import { getDb } from "./index";
import { notificationLogs } from "./schema";

async function seed() {
    const db = getDb();
    console.log("Seeding sample notifications for all users...");
    
    const userIds = [1, 24, 25]; // IDs found in the database

    for (const userId of userIds) {
        const samples = [
            {
                userId,
                type: "weekly_summary" as const,
                title: "Rekap Keuangan Mingguan",
                body: "Wah, pengeluaranmu minggu ini turun 15% dibanding minggu lalu. Pertahankan performa hebatmu! 🚀",
                status: "sent" as const,
                isRead: false,
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
            },
            {
                userId,
                type: "budget_alert" as const,
                title: "Peringatan Anggaran!",
                body: "Anggaran kategori 'Makan & Minum' sudah terpakai 85%. Yuk, lebih hemat lagi sampai akhir bulan.",
                status: "sent" as const,
                isRead: false,
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
            },
            {
                userId,
                type: "custom" as const,
                title: "Update Fitur Baru: Monev v2.1",
                body: "Kami baru saja merilis fitur Analisa Aset yang lebih mendalam. Cek sekarang di menu Analisa!",
                status: "sent" as const,
                isRead: true,
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) // 2 days ago
            }
        ];

        try {
            for (const sample of samples) {
                await db.insert(notificationLogs).values(sample).run();
            }
        } catch (error) {
            console.error(`Seeding failed for user ${userId}:`, error);
        }
    }
    console.log("Seeding success!");
}

seed();
