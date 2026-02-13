import { NextRequest, NextResponse } from 'next/server';
import { processOCR, processVoice, categorizeTransaction, CATEGORIES } from '@/lib/ai';
import { createTransaction, getCategories } from '@/backend/db/operations';
import { format } from "date-fns";
import { id } from "date-fns/locale";

export async function POST(req: NextRequest) {
    const body = await req.json();

    if (!body.message) return NextResponse.json({ ok: true });

    const chatId = body.message.chat.id;
    const text = body.message.text;
    const photo = body.message.photo;
    const voice = body.message.voice;

    try {
        if (photo) {
            console.log("Processing Telegram Photo message...");
            await sendTelegramMessage(chatId, "📸 Menemukan gambar, sedang mengunduh...");
            const fileId = photo[photo.length - 1].file_id;
            const fileUrl = await getTelegramFileUrl(fileId);

            const imgRes = await fetch(fileUrl);
            if (!imgRes.ok) throw new Error("Gagal mengunduh gambar dari Telegram");
            const buffer = Buffer.from(await imgRes.arrayBuffer());

            await sendTelegramMessage(chatId, "🔍 Menganalisa struk dengan AI...");
            const parsed = await processOCR(buffer);

            if (parsed.amount === 0) {
                await sendTelegramMessage(chatId, "⚠️ AI gagal membaca nominal. Mencatat sebagai 0.");
            }

            await saveAndNotify(chatId, parsed);

        } else if (voice) {
            console.log("Processing Telegram Voice message...");
            await sendTelegramMessage(chatId, "🎤 Mendengarkan pesan suara kamu...");
            const fileId = voice.file_id;
            const fileUrl = await getTelegramFileUrl(fileId);

            const audioRes = await fetch(fileUrl);
            if (!audioRes.ok) throw new Error("Gagal mengunduh suara dari Telegram");
            const buffer = Buffer.from(await audioRes.arrayBuffer());

            await sendTelegramMessage(chatId, "🧠 Mentranskripsi suara...");
            const { transcription, parsed } = await processVoice(buffer);

            console.log("Transcription:", transcription);
            if (!transcription) {
                await sendTelegramMessage(chatId, "❓ Suara tidak terdengar atau kosong.");
            } else {
                await saveAndNotify(chatId, parsed);
            }

        } else if (text) {
            // Check for explicit "Name Amount" format
            const expenseRegex = /(.+?)\s+(\d+)$/;
            const match = text.trim().match(expenseRegex);

            if (match) {
                const item = match[1].trim();
                const amount = parseInt(match[2]);

                await sendTelegramMessage(chatId, "🔍 Menganalisa kategori...");
                const categorization = await categorizeTransaction(item, null);

                // Show detective feedback if web search was used
                if (categorization.searchUsed && categorization.merchantType) {
                    await sendTelegramMessage(chatId, `🕵️ Detective: "${item}" terdeteksi sebagai ${categorization.merchantType}`);
                }

                await saveAndNotify(chatId, {
                    amount,
                    description: item,
                    category: categorization.category,
                    date: new Date().toISOString()
                });
            } else if (text.toLowerCase() === '/start' || text.toLowerCase() === 'test') {
                await sendTelegramMessage(chatId, "Halo! Saya asisten keuangan kamu. 🚀\n\nKamu bisa:\n1. Kirim teks (e.g., 'Kopi 20000')\n2. Kirim foto struk/transfer\n3. Kirim pesan suara");
            } else {
                await sendTelegramMessage(chatId, `Saya tidak mengerti formatnya. Gunakan 'NamaBarang Harga' atau kirim foto/suara.`);
            }
        }
    } catch (error) {
        console.error("Webhook Error:", error);
        await sendTelegramMessage(chatId, "Waduh, terjadi kesalahan saat memproses pesan kamu. Coba lagi ya!");
    }

    return NextResponse.json({ ok: true });
}

async function getTelegramFileUrl(fileId: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const res = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const data = await res.json();
    if (!data.ok) throw new Error("Failed to get file path");
    return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
}

async function saveAndNotify(chatId: number, parsed: any) {
    try {
        const cats = await getCategories();
        const categoryName = parsed.category || "Lainnya";

        // Try to find matching category from parsed.category string
        const category = cats.find(c => c.name.toLowerCase() === categoryName.toLowerCase()) ||
            cats.find(c => c.name === "Lainnya") ||
            { id: 1, name: "Lainnya" };

        const amount = Number(parsed.amount) || 0;
        const transaction = await createTransaction({
            amount: amount,
            description: parsed.description || parsed.merchantName || "Transaksi Telegram",
            merchantName: parsed.merchantName,
            categoryId: category.id,
            type: "expense",
            date: new Date(), // Always use today's date for Telegram entries
        });

        const formattedDate = format(transaction.date, "dd MMM yyyy", { locale: id });
        console.log("Transaction saved:", transaction.id);
        await sendTelegramMessage(chatId, `✅ Dicatat otomatis!\n\n🛒: ${transaction.description}\n💰: Rp ${transaction.amount.toLocaleString('id-ID')}\n📂: ${category.name}\n📅: ${formattedDate}`);
    } catch (error) {
        console.error("Save Error:", error);
        await sendTelegramMessage(chatId, "❌ Gagal menyimpan ke database.");
        throw error;
    }
}

async function sendTelegramMessage(chatId: number, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text })
    });
}
