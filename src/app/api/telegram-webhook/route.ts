import { NextRequest, NextResponse } from "next/server";
import { createTransaction, getTransactions, getCategories, getMonthlyStats } from "@/backend/db/operations";

// Telegram Bot Token (stored in environment variables)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// User sessions for multi-step commands
const userSessions: Map<number, { step: string; data: Record<string, unknown> }> = new Map();

interface TelegramMessage {
    message_id: number;
    from: {
        id: number;
        first_name: string;
        username?: string;
    };
    chat: {
        id: number;
        type: string;
    };
    date: number;
    text?: string;
    photo?: Array<{
        file_id: string;
        file_unique_id: string;
        file_size: number;
        width: number;
        height: number;
    }>;
    voice?: {
        file_id: string;
        file_unique_id: string;
        duration: number;
        mime_type?: string;
        file_size?: number;
    };
}

interface TelegramUpdate {
    update_id: number;
    message?: TelegramMessage;
    edited_message?: TelegramMessage;
}

/**
 * Send message to Telegram chat
 */
async function sendMessage(chatId: number, text: string, options: Record<string, unknown> = {}) {
    try {
        const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: "HTML",
                ...options,
            }),
        });
        return await response.json();
    } catch (error) {
        console.error("Error sending Telegram message:", error);
    }
}

/**
 * Format currency to Rupiah
 */
function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

/**
 * Handle /start command
 */
async function handleStart(chatId: number, firstName: string) {
    const welcomeText = `👋 <b>Halo, ${firstName}!</b>

Selamat datang di <b>Monev Finance Bot</b> 🤖💰

Saya adalah asisten keuangan pribadi Anda. Berikut yang bisa saya bantu:

📋 <b>Perintah Tersedia:</b>
/start - Tampilkan pesan ini
/help - Bantuan penggunaan
/record - Catat transaksi baru
/balance - Lihat saldo & ringkasan
/recent - Transaksi terbaru
/summary - Ringkasan bulan ini

💡 <b>Tips:</b>
• Ketik jumlah dan deskripsi langsung, contoh: "50000 makan siang"
• Kirim screenshot bukti transfer (coming soon)
• Kirim voice note untuk mencatat (coming soon)

Mari mulai mengatur keuangan dengan cerdas! 🚀`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: "➕ Catat Transaksi", callback_data: "record" },
                { text: "📊 Lihat Saldo", callback_data: "balance" },
            ],
            [
                { text: "📋 Riwayat", callback_data: "recent" },
                { text: "📈 Ringkasan", callback_data: "summary" },
            ],
        ],
    };

    await sendMessage(chatId, welcomeText, { reply_markup: keyboard });
}

/**
 * Handle /help command
 */
async function handleHelp(chatId: number) {
    const helpText = `❓ <b>Bantuan Penggunaan</b>

<b>📝 Mencatat Transaksi:</b>
1. Ketik /record untuk mode interaktif
2. Atau ketik langsung: <code>[jumlah] [deskripsi]</code>
   Contoh: <code>50000 makan siang di warteg</code>
   Contoh: <code>1000000 gaji bulanan</code>

<b>💰 Jenis Transaksi:</b>
• Pengeluaran: diawali dengan jumlah
• Pemasukan: tambahkan kata "gaji", "masuk", "terima"

<b>📊 Melihat Data:</b>
• /balance - Saldo dan ringkasan singkat
• /recent - 5 transaksi terbaru
• /summary - Statistik bulan ini

<b>📸 Coming Soon:</b>
• Kirim screenshot untuk auto-input
• Voice note untuk mencatat transaksi
• Smart categorization dengan AI

Butuh bantuan lebih lanjut? Hubungi admin.`;

    await sendMessage(chatId, helpText);
}

/**
 * Handle /balance command
 */
async function handleBalance(chatId: number) {
    try {
        const now = new Date();
        const stats = await getMonthlyStats(now.getFullYear(), now.getMonth() + 1);
        
        const balanceText = `💰 <b>Ringkasan Keuangan</b>

📅 <i>${now.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</i>

💵 <b>Pemasukan:</b> ${formatRupiah(stats.income)}
💸 <b>Pengeluaran:</b> ${formatRupiah(stats.expense)}
📊 <b>Saldo:</b> ${formatRupiah(stats.balance)}

${stats.balance >= 0 
    ? "✅ Keuangan Anda sehat!" 
    : "⚠️ Pengeluaran melebihi pemasukan, perlu diperhatikan!"}`;

        const keyboard = {
            inline_keyboard: [
                [
                    { text: "➕ Catat Baru", callback_data: "record" },
                    { text: "📋 Lihat Detail", callback_data: "recent" },
                ],
            ],
        };

        await sendMessage(chatId, balanceText, { reply_markup: keyboard });
    } catch (error) {
        console.error("Error fetching balance:", error);
        await sendMessage(chatId, "❌ Gagal mengambil data saldo. Silakan coba lagi.");
    }
}

/**
 * Handle /recent command
 */
async function handleRecent(chatId: number) {
    try {
        const transactions = await getTransactions(5);
        
        if (transactions.length === 0) {
            await sendMessage(chatId, "📭 Belum ada transaksi tercatat.\n\nKetik /record untuk mulai mencatat!");
            return;
        }

        let recentText = "📋 <b>5 Transaksi Terbaru</b>\n\n";
        
        transactions.forEach((t, index) => {
            const emoji = t.type === "income" ? "💵" : "💸";
            const date = new Date(t.date).toLocaleDateString("id-ID", { 
                day: "numeric", 
                month: "short" 
            });
            recentText += `${index + 1}. ${emoji} <b>${formatRupiah(t.amount)}</b>\n`;
            recentText += `   ${t.description}\n`;
            recentText += `   <i>${date}</i>\n\n`;
        });

        const keyboard = {
            inline_keyboard: [
                [
                    { text: "➕ Tambah Baru", callback_data: "record" },
                    { text: "💰 Lihat Saldo", callback_data: "balance" },
                ],
            ],
        };

        await sendMessage(chatId, recentText, { reply_markup: keyboard });
    } catch (error) {
        console.error("Error fetching recent transactions:", error);
        await sendMessage(chatId, "❌ Gagal mengambil data transaksi.");
    }
}

/**
 * Handle /summary command
 */
async function handleSummary(chatId: number) {
    try {
        const now = new Date();
        const [stats, transactions] = await Promise.all([
            getMonthlyStats(now.getFullYear(), now.getMonth() + 1),
            getTransactions(100), // Get more for accurate counting
        ]);

        const currentMonthTrans = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        });

        const expenseCount = currentMonthTrans.filter(t => t.type === "expense").length;
        const incomeCount = currentMonthTrans.filter(t => t.type === "income").length;

        const summaryText = `📈 <b>Ringkasan Bulan Ini</b>

📅 <i>${now.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</i>

💵 <b>Total Pemasukan:</b> ${formatRupiah(stats.income)}
   <i>${incomeCount} transaksi</i>

💸 <b>Total Pengeluaran:</b> ${formatRupiah(stats.expense)}
   <i>${expenseCount} transaksi</i>

📊 <b>Net Balance:</b> ${formatRupiah(stats.balance)}

${stats.balance > 0 
    ? "🎉 Hebat! Anda berhasil menabung bulan ini!" 
    : stats.balance === 0 
        ? "⚖️ Break-even - pemasukan = pengeluaran" 
        : "⚠️ Perhatikan pengeluaran Anda"}`;

        await sendMessage(chatId, summaryText);
    } catch (error) {
        console.error("Error fetching summary:", error);
        await sendMessage(chatId, "❌ Gagal mengambil ringkasan.");
    }
}

/**
 * Handle /record command - Start interactive recording
 */
async function handleRecordCommand(chatId: number) {
    userSessions.set(chatId, { step: "awaiting_amount", data: {} });
    
    const recordText = `📝 <b>Catat Transaksi Baru</b>

Silakan ketik dalam format:\n<code>[jumlah] [deskripsi]</code>

<b>Contoh:</b>
• <code>50000 makan siang</code>
• <code>25000 parkir dan bensin</code>
• <code>1000000 gaji bulan Januari</code>

Atau ketik /batal untuk membatalkan.`;

    await sendMessage(chatId, recordText);
}

/**
 * Parse transaction from natural text
 */
function parseTransaction(text: string): { amount: number; description: string; type: "income" | "expense" } | null {
    // Remove common separators and normalize
    const cleanText = text.replace(/[.,](?=\d{3})/g, "").replace(/rp\.?\s*/i, "");
    
    // Try to extract amount - look for numbers
    const amountMatch = cleanText.match(/(\d[\d.,]*)/);
    if (!amountMatch) return null;
    
    const amountStr = amountMatch[1].replace(/[.,]/g, "");
    const amount = parseInt(amountStr, 10);
    
    if (isNaN(amount) || amount <= 0) return null;
    
    // Get description (everything after the amount)
    let description = cleanText.replace(amountMatch[0], "").trim();
    
    // Determine type based on keywords
    const incomeKeywords = ["gaji", "masuk", "terima", "income", "bonus", "thr", "hadiah", "investasi"];
    const lowerText = text.toLowerCase();
    const type = incomeKeywords.some(kw => lowerText.includes(kw)) ? "income" : "expense";
    
    // If no description, use default
    if (!description) {
        description = type === "income" ? "Pemasukan" : "Pengeluaran";
    }
    
    return { amount, description, type };
}

/**
 * Handle quick transaction input (direct text without command)
 */
async function handleQuickRecord(chatId: number, text: string) {
    const parsed = parseTransaction(text);
    
    if (!parsed) {
        await sendMessage(chatId, `❌ Format tidak dikenali.

Ketik dalam format:\n<code>[jumlah] [deskripsi]</code>

<b>Contoh:</b>
• <code>50000 makan siang</code>
• <code>1000000 gaji</code>

Atau ketik /help untuk bantuan.`);
        return;
    }

    try {
        // Get categories to find appropriate one
        const categories = await getCategories();
        
        // Try to find matching category based on keywords
        let categoryId: number | undefined;
        const descLower = parsed.description.toLowerCase();
        
        const categoryKeywords: Record<string, string[]> = {
            "Makanan": ["makan", "minum", "kopi", "warteg", "restoran", "kantin"],
            "Transportasi": ["bensin", "parkir", "toll", "gojek", "grab", "ojek", "bus", "kereta"],
            "Belanja": ["beli", "belanja", "shopee", "tokopedia", "lazada"],
            "Hiburan": ["nonton", "game", "hiburan", "netflix", "spotify"],
            "Kesehatan": ["obat", "dokter", "rumah sakit", "rs", "apotek"],
            "Pendidikan": ["buku", "kursus", "pelatihan", "sekolah", "kuliah"],
            "Gaji": ["gaji", "salary", "income"],
        };

        // Find matching category
        for (const [catName, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(kw => descLower.includes(kw))) {
                const match = categories.find(c => 
                    c.name.toLowerCase().includes(catName.toLowerCase()) && 
                    c.type === parsed.type
                );
                if (match) {
                    categoryId = match.id;
                    break;
                }
            }
        }

        // Default to first category of the right type if no match
        if (!categoryId) {
            const defaultCat = categories.find(c => c.type === parsed.type);
            categoryId = defaultCat?.id;
        }

        if (!categoryId) {
            await sendMessage(chatId, "❌ Tidak ada kategori yang tersedia. Silakan setup kategori terlebih dahulu di aplikasi web.");
            return;
        }

        // Create transaction
        await createTransaction({
            amount: parsed.amount,
            description: parsed.description,
            categoryId,
            type: parsed.type,
            paymentMethod: "cash",
            date: new Date(),
        });

        const emoji = parsed.type === "income" ? "💵" : "💸";
        const typeText = parsed.type === "income" ? "Pemasukan" : "Pengeluaran";
        
        const successText = `${emoji} <b>Transaksi Tercatat!</b>

<b>${typeText}:</b> ${formatRupiah(parsed.amount)}
<b>Deskripsi:</b> ${parsed.description}
<b>Kategori:</b> ${categories.find(c => c.id === categoryId)?.name || "Lainnya"}

✅ Berhasil disimpan!`;

        const keyboard = {
            inline_keyboard: [
                [
                    { text: "➕ Catat Lagi", callback_data: "record" },
                    { text: "💰 Lihat Saldo", callback_data: "balance" },
                ],
            ],
        };

        await sendMessage(chatId, successText, { reply_markup: keyboard });
        
        // Clear session if exists
        userSessions.delete(chatId);
        
    } catch (error) {
        console.error("Error creating transaction:", error);
        await sendMessage(chatId, "❌ Gagal menyimpan transaksi. Silakan coba lagi.");
    }
}

/**
 * Handle callback queries (inline keyboard buttons)
 */
async function handleCallbackQuery(callbackQuery: { id: string; from: { id: number }; message?: { chat: { id: number } }; data: string }) {
    const chatId = callbackQuery.message?.chat.id;
    if (!chatId) return;

    // Answer callback query to remove loading state
    await fetch(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackQuery.id }),
    });

    switch (callbackQuery.data) {
        case "record":
            await handleRecordCommand(chatId);
            break;
        case "balance":
            await handleBalance(chatId);
            break;
        case "recent":
            await handleRecent(chatId);
            break;
        case "summary":
            await handleSummary(chatId);
            break;
    }
}

/**
 * Main webhook handler
 */
export async function POST(request: NextRequest) {
    try {
        // Verify bot token is configured
        if (!TELEGRAM_BOT_TOKEN) {
            console.error("TELEGRAM_BOT_TOKEN not configured");
            return NextResponse.json({ error: "Bot not configured" }, { status: 500 });
        }

        const update: TelegramUpdate = await request.json();
        
        // Handle callback queries (inline keyboard)
        if ("callback_query" in update && update.callback_query) {
            await handleCallbackQuery(update.callback_query as unknown as { id: string; from: { id: number }; message?: { chat: { id: number } }; data: string });
            return NextResponse.json({ ok: true });
        }

        const message = update.message;
        if (!message || !message.text) {
            return NextResponse.json({ ok: true });
        }

        const chatId = message.chat.id;
        const text = message.text.trim();
        const firstName = message.from.first_name;

        // Handle commands
        if (text.startsWith("/")) {
            const command = text.split(" ")[0].toLowerCase();
            
            switch (command) {
                case "/start":
                    await handleStart(chatId, firstName);
                    break;
                case "/help":
                    await handleHelp(chatId);
                    break;
                case "/record":
                    await handleRecordCommand(chatId);
                    break;
                case "/balance":
                case "/saldo":
                    await handleBalance(chatId);
                    break;
                case "/recent":
                case "/riwayat":
                    await handleRecent(chatId);
                    break;
                case "/summary":
                case "/ringkasan":
                    await handleSummary(chatId);
                    break;
                case "/cancel":
                case "/batal":
                    userSessions.delete(chatId);
                    await sendMessage(chatId, "❌ Operasi dibatalkan. Ketik /record untuk mencatat transaksi baru.");
                    break;
                default:
                    await sendMessage(chatId, `❓ Perintah tidak dikenali: ${command}\n\nKetik /help untuk melihat daftar perintah.`);
            }
        } else {
            // Handle quick transaction input
            await handleQuickRecord(chatId, text);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error in Telegram webhook:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * Health check for webhook setup
 */
export async function GET() {
    if (!TELEGRAM_BOT_TOKEN) {
        return NextResponse.json(
            { status: "error", message: "TELEGRAM_BOT_TOKEN not configured" },
            { status: 500 }
        );
    }

    return NextResponse.json({
        status: "ok",
        message: "Telegram webhook endpoint is ready",
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/telegram-webhook`,
    });
}