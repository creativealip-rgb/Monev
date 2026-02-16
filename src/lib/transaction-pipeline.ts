import { createTransaction, getUserSettings, getGoalById, getMonthlyStats, createScheduledMessage } from '@/backend/db/operations';
import { getPsychologicalImpact } from '@/lib/ai';
import { sendTelegramMessage } from '@/lib/telegram';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface TransactionData {
    amount: number;
    description: string;
    merchantName?: string;
    categoryId: number;
    categoryName: string;
    type: 'expense' | 'income';
    date: Date;
    paymentMethod: string;
}

export async function processAndSaveTransaction(userId: number, data: TransactionData, source: 'telegram' | 'notification') {
    // 1. Save to Database
    const transaction = await createTransaction(userId, data);
    const categoryName = (data as any).categoryName || "Transaksi"; // Fallback if name not passed

    const formattedDate = format(transaction.date, "dd MMM yyyy", { locale: id });
    console.log(`Transaction saved via ${source}:`, transaction.id);

    let message = `✅ Berhasil dicatat!\n\n🛒: ${transaction.description}\n💰: Rp ${transaction.amount.toLocaleString('id-ID')}\n📂: ${categoryName}\n📅: ${formattedDate}\n🏷️: ${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}`;
    if (source === 'notification') {
        message = `📱 **NOTIFIKASI HP DICATAT**\n\n${message}\n\n*Dicatat otomatis*`;
    }

    // 2. Psychological Feedback (Expense Only)
    if (transaction.type === 'expense' && transaction.amount > 0) {
        try {
            const settings = await getUserSettings(userId);
            let primaryGoal = undefined;
            if (settings.primaryGoalId) {
                primaryGoal = await getGoalById(userId, settings.primaryGoalId);
            }

            const now = new Date();
            const stats = await getMonthlyStats(userId, now.getFullYear(), now.getMonth() + 1);
            const monthlySaving = stats.balance > 0 ? stats.balance : (stats.income * 0.2) || 1000000;

            const impact = await getPsychologicalImpact(transaction.amount, settings.hourlyRate, primaryGoal, monthlySaving);
            message += `\n\n${impact}`;
        } catch (pError) {
            console.error("Psychological Calculation Error:", pError);
        }
    }

    // 3. Proactive Alerts & Logic
    if (transaction.type === 'income' && transaction.amount >= 5000000) {
        message += `\n\n💰 **FREELANCE REALITY CHECK**\n\nMantap, Bos! Dapat Rp ${transaction.amount.toLocaleString('id-ID')} 🔥\nTapi ingat, ini harus cukup buat hidup beberapa bulan ke depan. Saya akan "umpetin" sebagian saldo ini di dashboard biar kamu nggak khilaf belanja ya! 😉`;
    }

    // Reimbursable Spy
    const techVendors = ["namecheap", "niagahoster", "aws", "google cloud", "digitalocean", "envato", "themeforest", "godaddy"];
    const isTechVendor = transaction.merchantName && techVendors.some(v => transaction.merchantName!.toLowerCase().includes(v));
    if (transaction.type === 'expense' && isTechVendor) {
        message += `\n\n🕵️ **REIMBURSABLE SPY**\nLho, beli aset digital di **${transaction.merchantName}**?\nIni buat projek klien siapa? Jangan lupa tagih ya! 🧾`;
    }

    // Proactive Split Bill
    if (transaction.type === 'expense' && categoryName === "Makan & Minuman" && transaction.amount > 500000) {
        message += `\n\n💸 **SPLIT BILL CHECK**\nHabis Rp ${transaction.amount.toLocaleString('id-ID')} buat makan? 😲\nIni traktir atau patungan? Kalau patungan, langsung ketik command:\n\`/remind [Nama] [Jumlah]\` biar nggak lupa nagih!`;
    }

    // Stock Opname Scheduler
    if (transaction.type === 'expense' && (transaction.description.toLowerCase().includes("tarik tunai") || transaction.description.toLowerCase().includes("ambil uang"))) {
        const scheduleDate = new Date();
        scheduleDate.setDate(scheduleDate.getDate() + 3);
        await createScheduledMessage({
            userId: userId,
            message: `🕵️ **STOCK OPNAME (CASH)**\n\n3 hari lalu kamu tarik tunai Rp ${transaction.amount.toLocaleString('id-ID')}.\nCoba cek dompet sekarang, sisa berapa lembar? 💵\n\nJawab jujur ya, biar saya catat "uang gaib"-nya.`,
            scheduledAt: scheduleDate,
            type: "stock_opname"
        });
    }

    // 4. Send Telegram Notification
    const userSettings = await getUserSettings(userId);
    // Find user by userId to get telegramId if not available in context
    // Actually operations.ts might have a way. 
    // In this context, we usually have chatId/telegramId passed from the caller.
    return { transaction, message };
}
