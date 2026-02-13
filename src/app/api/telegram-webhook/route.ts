import { NextRequest, NextResponse } from 'next/server';
import { processOCR, processVoice, categorizeTransaction, getPsychologicalImpact, getImpulseJudgment, processNLP, askFinanceAgent, CATEGORIES } from '@/lib/ai';
import { createTransaction, getCategories, getUserSettings, getGoalById, getRecentTransactionsByCategory, getBudgets, getGoals, updateUserSettings, getMonthlyStats } from '@/backend/db/operations';
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

            const parsed = await processOCR(buffer);
            console.log("OCR Data:", parsed);

            if (parsed.type === "checkout") {
                await sendTelegramMessage(chatId, "⚖️ Hmm, sepertinya ini halaman checkout. Biar saya nilai dulu ya...");

                const cats = await getCategories();
                const category = cats.find(c => c.name.toLowerCase() === (parsed.category || "Lainnya").toLowerCase()) || { id: 1, name: "Lainnya" };

                const now = new Date();
                const monthBudgets = await getBudgets(now.getMonth() + 1, now.getFullYear());
                const categoryBudget = monthBudgets.find(b => b.categoryId === category.id);
                const recentHistory = await getRecentTransactionsByCategory(category.id);

                const judgment = await getImpulseJudgment(
                    { item: parsed.description || parsed.merchantName || "Barang ini", amount: parsed.amount, category: category.name },
                    recentHistory,
                    categoryBudget
                );

                await sendTelegramMessage(chatId, `👨‍⚖️ **IMPULSE BUYING JUDGE**\n\n${judgment}\n\n🛒: ${parsed.description || parsed.merchantName}\n💰: Rp ${parsed.amount.toLocaleString('id-ID')}`);
            } else {
                if (parsed.amount === 0) {
                    await sendTelegramMessage(chatId, "⚠️ AI gagal membaca nominal. Mencatat sebagai 0.");
                }
                await saveAndNotify(chatId, parsed);
            }

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
            const lowerText = text.toLowerCase();

            // Commands first
            if (lowerText.startsWith('set goal ')) {
                const goalName = text.substring(9).trim();
                const allGoals = await getGoals();
                const goal = allGoals.find(g => g.name.toLowerCase().includes(goalName.toLowerCase()));

                if (goal) {
                    await updateUserSettings({ primaryGoalId: goal.id });
                    await sendTelegramMessage(chatId, `🎯 Target utama berhasil diset ke: **${goal.name}**\n\nSekarang saya akan memantau dampak setiap jajanmu terhadap target ini.`);
                } else {
                    await sendTelegramMessage(chatId, `❌ Target "${goalName}" tidak ditemukan. Coba cek nama target di dashboard.`);
                }
            } else if (lowerText.startsWith('set rate ')) {
                const rate = parseInt(text.substring(9).replace(/\./g, ''));
                if (!isNaN(rate) && rate > 0) {
                    await updateUserSettings({ hourlyRate: rate });
                    await sendTelegramMessage(chatId, `⏱️ Rate per jam kamu diset ke: **Rp ${rate.toLocaleString('id-ID')}**\n\nSekarang saya bisa menghitung berapa jam kerja yang "terbuang" setiap kali kamu jajan.`);
                } else {
                    await sendTelegramMessage(chatId, `❌ Format salah. Gunakan: "set rate 50000"`);
                }
            } else if (lowerText === '/start' || lowerText === 'test') {
                await sendTelegramMessage(chatId, "Halo! Saya asisten keuangan kamu. 🚀\n\nKamu bisa:\n1. Kirim teks bebas (e.g., 'freelance 10jt', 'makan soto 25rb')\n2. Kirim foto struk (untuk catat) atau checkout (untuk dinilai)\n3. Kirim pesan suara\n\n⚙️ Pengaturan:\n- `set goal [nama]` : Set target tabungan utama\n- `set rate [angka]` : Set gaji per jam kamu");
            } else {
                // Fallback to Smart NLP
                await sendTelegramMessage(chatId, "🔍 Menganalisa pesan kamu...");
                const nlpParsed = await processNLP(text);

                if (nlpParsed) {
                    if (nlpParsed.intent === "query") {
                        await sendTelegramMessage(chatId, "🧠 Menghitung data keuangan kamu...");

                        // Fetch context data
                        const now = new Date();
                        const stats = await getMonthlyStats(now.getFullYear(), now.getMonth() + 1);
                        const allGoals = await getGoals();

                        const goalsContext = allGoals.map(g => ({
                            name: g.name,
                            targetAmount: g.targetAmount,
                            currentAmount: g.currentAmount,
                            remaining: Math.max(0, g.targetAmount - g.currentAmount),
                            percent: (g.currentAmount / g.targetAmount) * 100
                        }));

                        const aiReply = await askFinanceAgent(text, {
                            monthlyStats: stats,
                            goals: goalsContext
                        });

                        await sendTelegramMessage(chatId, aiReply);
                    } else {
                        // Original transaction logic
                        // If AI didn't provide a category, use categorizeTransaction for more depth
                        let categoryString = nlpParsed.category;
                        let merchantType = undefined;
                        let searchUsed = false;

                        if (!categoryString) {
                            const categorization = await categorizeTransaction(nlpParsed.description || text, null);
                            categoryString = categorization.category;
                            merchantType = categorization.merchantType;
                            searchUsed = categorization.searchUsed;
                        }

                        if (searchUsed && merchantType) {
                            await sendTelegramMessage(chatId, `🕵️ Detective: "${nlpParsed.description}" terdeteksi sebagai ${merchantType}`);
                        }

                        await saveAndNotify(chatId, {
                            amount: nlpParsed.amount || 0,
                            description: nlpParsed.description,
                            category: categoryString,
                            transactionType: nlpParsed.transactionType || "expense",
                            date: new Date().toISOString()
                        });
                    }
                } else {
                    await sendTelegramMessage(chatId, `Saya tidak mengerti formatnya. Gunakan bahasa santai seperti 'berapa saldo saya?' atau 'freelance 10 juta'.`);
                }
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
        const type = parsed.transactionType || "expense";

        const transaction = await createTransaction({
            amount: amount,
            description: parsed.description || parsed.merchantName || "Transaksi Telegram",
            merchantName: parsed.merchantName,
            categoryId: category.id,
            type: type,
            date: new Date(), // Always use today's date for Telegram entries
        });

        const formattedDate = format(transaction.date, "dd MMM yyyy", { locale: id });
        console.log("Transaction saved:", transaction.id);

        let message = `✅ Berhasil dicatat!\n\n🛒: ${transaction.description}\n💰: Rp ${transaction.amount.toLocaleString('id-ID')}\n📂: ${category.name}\n📅: ${formattedDate}\n🏷️: ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}`;

        // Phase 3: Psychological Feedback (Expense Only)
        if (type === 'expense' && amount > 0) {
            try {
                const settings = await getUserSettings();
                let primaryGoal = undefined;
                if (settings.primaryGoalId) {
                    primaryGoal = await getGoalById(settings.primaryGoalId);
                }
                const psychologicalImpact = await getPsychologicalImpact(amount, settings.hourlyRate, primaryGoal);
                message += `\n\n${psychologicalImpact}`;
            } catch (pError) {
                console.error("Psychological Calculation Error:", pError);
            }
        }

        // Phase 3: Freelance Reality Check (Income Only)
        if (type === 'income' && amount >= 5000000) {
            message += `\n\n💰 **FREELANCE REALITY CHECK**\n\nMantap, Bos! Dapat Rp ${amount.toLocaleString('id-ID')} 🔥\nTapi ingat, ini harus cukup buat hidup beberapa bulan ke depan. Saya akan "umpetin" sebagian saldo ini di dashboard biar kamu nggak khilaf belanja ya! 😉`;
        }

        await sendTelegramMessage(chatId, message);
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
