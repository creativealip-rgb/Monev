import { NextRequest, NextResponse } from 'next/server';
import { processOCR, processVoice, categorizeTransaction, getPsychologicalImpact, getImpulseJudgment, processNLP, askFinanceAgent, getSocialDebtReminder, CATEGORIES } from '@/lib/ai';
import {
    createTransaction,
    getCategories,
    getUserSettings,
    getGoalById,
    getRecentTransactionsByCategory,
    getBudgets,
    getGoals,
    updateUserSettings,
    getMonthlyStats,
    upsertUser,
    createDebt,
    createScheduledMessage,
    getFinancialHealthMetrics,
    getBills,
    getInvestments,
    getUserByTelegramId
} from '@/backend/db/operations';
import { calculateFutureValue, getRunwayStatus } from "@/lib/financial-advising";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
    const body = await req.json();

    if (!body.message) return NextResponse.json({ ok: true });

    const chatId = body.message.chat.id;
    const text = body.message.text;
    const photo = body.message.photo;
    const voice = body.message.voice;
    const from = body.message.from;

    try {
        let user: any = null; // Type User from schema

        // Upsert User
        if (from) {
            user = await upsertUser({
                telegramId: from.id,
                username: from.username,
                firstName: from.first_name,
                lastName: from.last_name
            });
        }

        if (!user) {
            await sendTelegramMessage(chatId, "⚠️ Gagal mengidentifikasi user. Coba lagi nanti.");
            return NextResponse.json({ ok: true });
        }

        const userId = user.id;

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
                const category = cats.find(c => c.name.toLowerCase() === (parsed.category || "Lainnya").toLowerCase()) || { id: 1, name: "Lainnya", color: "", icon: "", type: "expense", createdAt: new Date() };

                const now = new Date();
                const monthBudgets = await getBudgets(userId, now.getMonth() + 1, now.getFullYear());
                const categoryBudget = monthBudgets.find(b => b.categoryId === category.id);
                const recentHistory = await getRecentTransactionsByCategory(userId, category.id);

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
                await saveAndNotify(userId, chatId, parsed);
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
                await saveAndNotify(userId, chatId, parsed);
            }

        } else if (text) {
            const lowerText = text.toLowerCase();

            // Commands first
            if (lowerText.startsWith('set goal ')) {
                const goalName = text.substring(9).trim();
                const allGoals = await getGoals(userId);
                const goal = allGoals.find(g => g.name.toLowerCase().includes(goalName.toLowerCase()));

                if (goal) {
                    await updateUserSettings(userId, { primaryGoalId: goal.id });
                    await sendTelegramMessage(chatId, `🎯 Target utama berhasil diset ke: **${goal.name}**\n\nSekarang saya akan memantau dampak setiap jajanmu terhadap target ini.`);
                } else {
                    await sendTelegramMessage(chatId, `❌ Target "${goalName}" tidak ditemukan. Coba cek nama target di dashboard.`);
                }
            } else if (lowerText.startsWith('set rate ')) {
                const rate = parseInt(text.substring(9).replace(/\./g, ''));
                if (!isNaN(rate) && rate > 0) {
                    await updateUserSettings(userId, { hourlyRate: rate });
                    await sendTelegramMessage(chatId, `⏱️ Rate per jam kamu diset ke: **Rp ${rate.toLocaleString('id-ID')}**\n\nSekarang saya bisa menghitung berapa jam kerja yang "terbuang" setiap kali kamu jajan.`);
                } else {
                    await sendTelegramMessage(chatId, `❌ Format salah. Gunakan: "set rate 50000"`);
                }
            } else if (lowerText.startsWith('/remind ')) {
                // Command: /remind [Name] [Amount (optional)]
                const parts = text.substring(8).trim().split(' ');
                const debtorName = parts[0];
                const amountStr = parts[1] || "0";
                const amount = parseInt(amountStr.replace(/\./g, '').replace(/,/g, '')) || 0;

                if (debtorName) {
                    await sendTelegramMessage(chatId, `💬 Sebentar, saya racik kata-kata mutiara buat nagih si **${debtorName}**...`);
                    const reminder = await getSocialDebtReminder(debtorName, amount, "polite"); // Default polite
                    await sendTelegramMessage(chatId, `👇 Copy-paste ini ke WhatsApp dia:\n\n${reminder}`);

                    if (amount > 1000000) {
                        const firmReminder = await getSocialDebtReminder(debtorName, amount, "firm");
                        setTimeout(async () => {
                            await sendTelegramMessage(chatId, `😈 Opsi lebih tegas (kalau dia ngeyel):\n\n${firmReminder}`);
                        }, 2000);
                    }
                } else {
                    await sendTelegramMessage(chatId, `❌ Format: "/remind [Nama] [Jumlah]"\nContoh: "/remind Budi 50000"`);
                }
            } else if (lowerText === '/burn' || lowerText === '/runway') {
                const { runwayMonths, monthlyBalance, savingsRate } = await getFinancialHealthMetrics(userId);
                const stats = await getMonthlyStats(userId, new Date().getFullYear(), new Date().getMonth() + 1);

                const status = getRunwayStatus(runwayMonths);

                await sendTelegramMessage(chatId, `🔥 **BURN RATE CHECK**\n\n💸 Rata-rata pengeluaran: Rp ${stats.expense.toLocaleString('id-ID')}/bulan\n💰 Saldo bulan ini: Rp ${monthlyBalance.toLocaleString('id-ID')}\n\n⏳ **Runway: ${runwayMonths} Bulan**\n${status.message}`);

            } else if (lowerText === '/idle') {
                const { runwayMonths } = await getFinancialHealthMetrics(userId);
                // Need calculateIdleCash logic here or imported
                // calculateIdleCash needs balance and monthlyExpense
                const stats = await getMonthlyStats(userId, new Date().getFullYear(), new Date().getMonth() + 1);
                // Assuming idle cash is anything > 3 months expense + goals?
                // Simplified for now based on previous logic
                const idleCash = Math.max(0, stats.balance - (stats.expense * 3));

                if (idleCash > 100000) {
                    await sendTelegramMessage(chatId, `💤 **IDLE CASH OPTIMIZER**\n\nKamu punya uang "nganggur" sebesar **Rp ${idleCash.toLocaleString('id-ID')}** (di luar dana darurat 3 bulan).\n\nSebaiknya diinvestasikan ke Reksadana/SBN biar nggak dimakan inflasi! 📈`);
                } else {
                    await sendTelegramMessage(chatId, `💤 **IDLE CASH OPTIMIZER**\n\nBelum ada uang nganggur yang signifikan. Fokus penuhi dana darurat dulu ya! Semangat 💪`);
                }

            } else if (lowerText.startsWith('/inflation ')) {
                // /inflation [amount] [years]
                const parts = text.split(' ');
                const amount = parseInt(parts[1]?.replace(/\./g, '') || '0');
                const years = parseInt(parts[2] || '5');

                if (amount > 0) {
                    const futureValue = calculateFutureValue(amount, years);
                    await sendTelegramMessage(chatId, `🎈 **INFLASI CHECK**\n\nUang Rp ${amount.toLocaleString('id-ID')} hari ini, nilainya setara dengan **Rp ${futureValue.toLocaleString('id-ID')}** di ${years} tahun lagi (asumsi inflasi 5%).\n\nJadi kalau target kamu segitu, mending naikin dikit biar aman! 😉`);
                } else {
                    await sendTelegramMessage(chatId, `❌ Format: "/inflation [Jumlah] [Tahun]"\nContoh: "/inflation 10000000 5"`);
                }
            } else if (lowerText === '/start' || lowerText === 'test' || lowerText === '/id') {
                await sendTelegramMessage(chatId, `Halo! Saya asisten keuangan kamu. 🚀\n\n🆔 **ID Telegram Kamu:** \`${chatId}\`\n(Copy ID ini dan paste di Menu Profil Website untuk menghubungkan akun)\n\nKamu bisa:\n1. Kirim teks bebas (e.g., 'freelance 10jt', 'makan soto 25rb')\n2. Kirim foto struk (untuk catat) atau checkout (untuk dinilai)\n3. Kirim pesan suara\n\n⚙️ **Commands:**\n- \`/burn\` : Cek runway/ketahanan dana\n- \`/idle\` : Cek uang nganggur\n- \`/inflation [jumlah] [tahun]\` : Hitung efek inflasi\n- \`set goal [nama]\` : Set target utama\n- \`set rate [angka]\` : Set gaji per jam\n- \`/link\` : Cara menghubungkan akun`);
            } else {
                // Fallback to Smart NLP
                await sendTelegramMessage(chatId, "🔍 Menganalisa pesan kamu...");
                const nlpParsed = await processNLP(text);

                if (nlpParsed) {
                    if (nlpParsed.intent === "query") {
                        await sendTelegramMessage(chatId, "🧠 Menghitung data keuangan kamu...");

                        // Fetch context data
                        const now = new Date();
                        const stats = await getMonthlyStats(userId, now.getFullYear(), now.getMonth() + 1);
                        const allGoals = await getGoals(userId);
                        const { getBudgets, getTransactions, getCategories, getInvestments } = await import('@/backend/db/operations');
                        const allBudgets = await getBudgets(userId, now.getMonth() + 1, now.getFullYear());
                        const allTransactions = await getTransactions(userId, 30);
                        const allCats = await getCategories();
                        const allInvestments = await getInvestments(userId);
                        const allBills = await getBills(userId);

                        const goalsContext = allGoals.map(g => ({
                            id: g.id,
                            name: g.name,
                            targetAmount: g.targetAmount,
                            currentAmount: g.currentAmount,
                            remaining: Math.max(0, g.targetAmount - g.currentAmount),
                            percent: (g.currentAmount / g.targetAmount) * 100
                        }));

                        const budgetsContext = allBudgets.map(b => ({
                            id: b.id,
                            category: b.category?.name || "Lainnya",
                            limit: b.amount,
                            spent: b.spent,
                            remaining: Math.max(0, b.amount - b.spent),
                            percent: b.amount > 0 ? (b.spent / b.amount) * 100 : 0
                        }));

                        const transactionsContext = allTransactions.map(t => ({
                            id: t.id,
                            date: t.date instanceof Date ? t.date.toISOString() : String(t.date),
                            amount: t.amount,
                            description: t.description,
                            category: allCats.find(c => c.id === t.categoryId)?.name || "Lainnya",
                            type: t.type as "expense" | "income"
                        }));

                        const investmentsContext = allInvestments.map(i => ({
                            id: i.id,
                            name: i.name,
                            type: i.type,
                            quantity: i.quantity,
                            currentPrice: i.currentPrice,
                            totalValue: i.quantity * i.currentPrice,
                            platform: i.platform
                        }));

                        const billsContext = allBills.map(b => ({
                            id: b.id,
                            name: b.name,
                            amount: b.amount,
                            dueDate: b.dueDate,
                            isPaid: b.isPaid,
                            frequency: b.frequency || "monthly"
                        }));

                        const aiReply = await askFinanceAgent(text, {
                            monthlyStats: stats,
                            goals: goalsContext,
                            budgets: budgetsContext,
                            transactions: transactionsContext,
                            investments: investmentsContext,
                            bills: billsContext
                        });

                        await sendTelegramMessage(chatId, aiReply.content);
                    } else if (nlpParsed.intent === "debt") {
                        // SOCIAL & CASH - Debt Handling
                        const debtAmount = nlpParsed.amount || 0;
                        const debtor = nlpParsed.debtorName || "Seseorang";

                        let finalAmount = debtAmount;
                        let responseMsg = "";

                        if (nlpParsed.debtType === "payable") {
                            finalAmount = -debtAmount;
                            responseMsg = `📝 **Catatan Utang**\n\nKamu berutang ke **${debtor}** sebesar Rp ${debtAmount.toLocaleString('id-ID')}.\n\nJangan lupa bayar ya! 💸`;
                        } else {
                            responseMsg = `📝 **Catatan Piutang**\n\n**${debtor}** berutang ke kamu sebesar Rp ${debtAmount.toLocaleString('id-ID')}.\n\nNanti saya ingatkan buat nagih! 🔫`;
                        }

                        if (user) {
                            await createDebt({
                                userId: user.id,
                                debtorName: debtor,
                                amount: finalAmount,
                                description: nlpParsed.description || "Utang via Bot",
                            });
                            await sendTelegramMessage(chatId, responseMsg);
                        } else {
                            await sendTelegramMessage(chatId, "⚠️ Gagal mencatat utang. User tidak ditemukan.");
                        }

                    } else {
                        // Original transaction logic
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

                        await saveAndNotify(userId, chatId, {
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

async function saveAndNotify(userId: number, chatId: number, parsed: any) {
    try {
        const cats = await getCategories();
        const categoryName = parsed.category || "Lainnya";

        // Try to find matching category from parsed.category string
        const category = cats.find(c => c.name.toLowerCase() === categoryName.toLowerCase()) ||
            cats.find(c => c.name === "Lainnya") ||
            { id: 1, name: "Lainnya", color: "", icon: "", type: "expense", createdAt: new Date() };

        const amount = Number(parsed.amount) || 0;
        const type = parsed.transactionType || "expense";

        const transaction = await createTransaction(userId, {
            amount: amount,
            description: parsed.description || parsed.merchantName || "Transaksi Telegram",
            merchantName: parsed.merchantName,
            categoryId: category.id,
            type: type,
            date: new Date(), // Always use today's date for Telegram entries
            paymentMethod: parsed.paymentMethod || "qris", // Default to QRIS if not detected
        });

        const formattedDate = format(transaction.date, "dd MMM yyyy", { locale: id });
        console.log("Transaction saved:", transaction.id);

        let message = `✅ Berhasil dicatat!\n\n🛒: ${transaction.description}\n💰: Rp ${transaction.amount.toLocaleString('id-ID')}\n📂: ${category.name}\n📅: ${formattedDate}\n🏷️: ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}`;

        // Phase 3: Psychological Feedback (Expense Only)
        if (type === 'expense' && amount > 0) {
            try {
                const settings = await getUserSettings(userId);
                let primaryGoal = undefined;
                if (settings.primaryGoalId) {
                    primaryGoal = await getGoalById(userId, settings.primaryGoalId);
                }

                // Calculate Monthly Saving (Income - Expense) for this month
                const now = new Date();
                const stats = await getMonthlyStats(userId, now.getFullYear(), now.getMonth() + 1);
                // If balance is negative or zero, assume minimum saving capacity (e.g. 1 million or 10% income) for calculation sake
                const monthlySaving = stats.balance > 0 ? stats.balance : (stats.income * 0.2) || 1000000;

                const psychologicalImpact = await getPsychologicalImpact(amount, settings.hourlyRate, primaryGoal, monthlySaving);
                message += `\n\n${psychologicalImpact}`;
            } catch (pError) {
                console.error("Psychological Calculation Error:", pError);
            }
        }

        // Phase 3: Freelance Reality Check (Income Only)
        if (type === 'income' && amount >= 5000000) {
            message += `\n\n💰 **FREELANCE REALITY CHECK**\n\nMantap, Bos! Dapat Rp ${amount.toLocaleString('id-ID')} 🔥\nTapi ingat, ini harus cukup buat hidup beberapa bulan ke depan. Saya akan "umpetin" sebagian saldo ini di dashboard biar kamu nggak khilaf belanja ya! 😉`;
        }

        // Phase 6: Reimbursable Spy (Tech Vendors)
        const techVendors = ["namecheap", "niagahoster", "aws", "google cloud", "digitalocean", "envato", "themeforest", "godaddy"];
        const isTechVendor = parsed.merchantName && techVendors.some(v => parsed.merchantName.toLowerCase().includes(v));

        if (type === 'expense' && isTechVendor) {
            message += `\n\n🕵️ **REIMBURSABLE SPY**\n`;
            message += `Lho, beli aset digital di **${parsed.merchantName}**?`;
            message += `\nIni buat projek klien siapa? Jangan lupa tagih ya! 🧾`;
        }

        // Phase 6: Proactive Split Bill (Large F&B)
        if (type === 'expense' && category.name === "Makan & Minuman" && amount > 500000) {
            message += `\n\n💸 **SPLIT BILL CHECK**\n`;
            message += `Habis Rp ${amount.toLocaleString('id-ID')} buat makan? 😲`;
            message += `\nIni traktir atau patungan? Kalau patungan, langsung ketik command:\n\`/remind [Nama] [Jumlah]\` biar nggak lupa nagih!`;
        }

        // Phase 6: Stock Opname Scheduler (Cash Withdrawal)
        if (type === 'expense' && (parsed.description?.toLowerCase().includes("tarik tunai") || parsed.description?.toLowerCase().includes("ambil uang"))) {
            const scheduleDate = new Date();
            scheduleDate.setDate(scheduleDate.getDate() + 3); // Schedule for 3 days later

            await createScheduledMessage({
                userId: userId,
                message: `🕵️ **STOCK OPNAME (CASH)**\n\n3 hari lalu kamu tarik tunai Rp ${amount.toLocaleString('id-ID')}.\nCoba cek dompet sekarang, sisa berapa lembar? 💵\n\nJawab jujur ya, biar saya catat "uang gaib"-nya.`,
                scheduledAt: scheduleDate,
                type: "stock_opname"
            });
            console.log(`Stock Opname scheduled for user ${userId}`);
        }

        await sendTelegramMessage(chatId, message);
    } catch (error) {
        console.error("Save Error:", error);
        await sendTelegramMessage(chatId, "❌ Gagal menyimpan ke database.");
        throw error;
    }
}

// sendTelegramMessage moved to src/lib/telegram.ts
