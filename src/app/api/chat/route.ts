import { NextRequest, NextResponse } from "next/server";
import type { Goal, Transaction } from "@/backend/db/schema";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
    getMonthlyStats, getGoals, getBudgets, getTransactions, getTransactionById, getCategories,
    createCategory, createTransaction, updateTransaction, deleteTransaction, searchTransactions,
    createBudget, updateBudget, deleteBudget,
    createGoal, updateGoal, updateGoalProgress, removeGoal, getGoalById,
    getInvestments, getInvestmentById, createInvestment, updateInvestment, deleteInvestment,
    getBills, getBillById, createBill, updateBill, deleteBill, toggleBillPaid,
    getDailyAICount, logAIChat, getUserSettings
} from "@/backend/db/operations";
import { getUserVocabulary } from "@/backend/db/operations/vocabulary";
import { getAccounts } from "@/backend/db/account-operations";
import { logger } from "@/lib/logger";
import { askFinanceAgent, getPsychologicalImpact } from "@/lib/ai";
import { canUseAI, UserTier } from "@/lib/tier-gate";
import { parseLocalChatIntent } from "@/lib/chat/local-intent";
import { getDb } from "@/backend/db";

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
    Pemasukan: { icon: "TrendingUp", color: "#10b981" },
    Makanan: { icon: "Utensils", color: "#f97316" },
    Transportasi: { icon: "Train", color: "#0ea5e9" },
    Tagihan: { icon: "Receipt", color: "#6366f1" },
    Lainnya: { icon: "Wallet", color: "#3b82f6" },
};

const CHAT_AI_TIMEOUT_MS = Number(process.env.CHAT_AI_TIMEOUT_MS || 12000);
const AI_CIRCUIT_COOLDOWN_MS = Number(process.env.CHAT_AI_CIRCUIT_COOLDOWN_MS || 120000);
const AI_TIMEOUT_REPLY = "AI lagi lambat, Bos. Saya belum bisa jawab pakai analisis lengkap sekarang, tapi transaksi simpel tetap bisa dicatat. Coba format seperti `makan 20rb`, `krl 3rb`, atau kalau mau budget kirim harga target + deadline + kemampuan nabung per bulan.";
let aiCircuitOpenUntil = 0;
let aiConsecutiveFailures = 0;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`AI_TIMEOUT_${timeoutMs}MS`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
        if (timeout) clearTimeout(timeout);
    });
}

type ChatHistoryItem = { role?: string; content?: string };

function buildBudgetFollowUpMessage(message: string, history: ChatHistoryItem[]): string | null {
    const text = String(message || "").trim();
    if (!text) return null;
    const recentText = history.map((item) => item.content || "").join("\n").toLowerCase();
    const wasBudgetFlow = /budget|goal|target|harga target|sanggup sisihin|mau kebeli|jadikan ini goal/i.test(recentText);
    const hasPlanNumbers = /\d+\s*(rb|ribu|k|jt|juta|bulan|bln|tahun|thn)|sanggup|sisih|nabung|harga|target/i.test(text);
    if (!wasBudgetFlow || !hasPlanNumbers) return null;

    const originalGoal = [...history].reverse().find((item) =>
        item.role === "user" && /budget|goal|target|nabung|rencana beli/i.test(item.content || "")
    )?.content;

    return [originalGoal, text].filter(Boolean).join(" ");
}

function isGoalCreationConfirmation(message: string, history: ChatHistoryItem[]): boolean {
    const normalized = String(message || "").trim().toLowerCase();
    if (!/^(iya|ya|yes|yup|boleh|gas|buat|bikinin|jadiin|oke|ok)(\s|$)/i.test(normalized)) return false;
    return history.some((item) => item.role === "assistant" && /Mau saya bantu jadikan ini goal tabungan\?/i.test(item.content || ""));
}

function findPreviousBudgetPlan(history: ChatHistoryItem[]): { targetAmount: number; months: number } | null {
    const plan = [...history].reverse().find((item) => item.role === "assistant" && /Target:\s*Rp[\s\S]*Deadline:\s*\d+\s*bulan/i.test(item.content || ""))?.content;
    if (!plan) return null;
    const targetMatch = plan.match(/Target:\s*Rp\s*([\d.]+)/i);
    const monthsMatch = plan.match(/Deadline:\s*(\d+)\s*bulan/i);
    if (!targetMatch || !monthsMatch) return null;
    const targetAmount = Number(targetMatch[1].replace(/\./g, ""));
    const months = Number(monthsMatch[1]);
    if (!Number.isFinite(targetAmount) || !Number.isFinite(months)) return null;
    return { targetAmount, months };
}

function inferGoalName(history: ChatHistoryItem[]): string {
    const original = [...history].reverse().find((item) => item.role === "user" && /budget|goal|target|nabung|rencana beli/i.test(item.content || ""))?.content || "Goal Tabungan";
    const cleaned = original
        .replace(/\b(bantu|gw|gue|aku|saya|tolong|buat|bikin|budget|anggaran|goal|target|untuk|rencana|nabung|tabungan|beli)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
    if (!cleaned) return "Goal Tabungan";
    return cleaned.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

type GoalProgressRequest = { amount: number; goalQuery: string };

function parseGoalProgressRequest(message: string): GoalProgressRequest | null {
    const text = String(message || "").trim();
    if (!/(tambah|masukin|masukkan|setor|nabung|tabung|isi|progress)/i.test(text)) return null;
    if (!/(goal|tabungan|target|ke|buat|untuk)/i.test(text)) return null;

    const amountMatch = text.match(/(?:rp\s*)?(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta)?\b/i);
    if (!amountMatch) return null;
    const rawAmount = Number(amountMatch[1].replace(",", "."));
    if (!Number.isFinite(rawAmount)) return null;
    const unit = amountMatch[2] || "";
    const multiplier = /^(rb|ribu|k)$/i.test(unit) ? 1000 : /^(jt|juta)$/i.test(unit) ? 1000000 : 1;
    const amount = Math.round(rawAmount * multiplier);
    if (amount <= 0 || (!unit && amount < 1000)) return null;

    const goalQuery = text
        .replace(amountMatch[0], " ")
        .replace(/\b(tambah|masukin|masukkan|setor|nabung|tabung|isi|progress|ke|goal|tabungan|target|buat|untuk|sebesar|senilai|rp)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

    return { amount, goalQuery };
}

function normalizeSearchText(text: string): string {
    return String(text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function findMatchingGoal(goals: Goal[], query: string): Goal | null {
    if (goals.length === 0) return null;
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return goals.length === 1 ? goals[0] : null;

    const exact = goals.find((goal) => normalizeSearchText(goal.name) === normalizedQuery);
    if (exact) return exact;

    const queryTokens = normalizedQuery.split(" ").filter((token) => token.length >= 2);
    const scored = goals
        .map((goal) => {
            const normalizedName = normalizeSearchText(goal.name);
            const score = queryTokens.filter((token) => normalizedName.includes(token)).length;
            return { goal, score };
        })
        .sort((a, b) => b.score - a.score);

    if (scored[0]?.score > 0 && scored[0].score > (scored[1]?.score || 0)) return scored[0].goal;
    return null;
}

function isBalanceLookup(message: string): boolean {
    const text = normalizeSearchText(message);
    if (!text) return false;
    return /\b(saldo|kekayaan|rekening|akun|wallet|walet|ewallet|e wallet|dompet|cash|bank|bca|mandiri|bri|bni|gopay|ovo|dana|shopeepay)\b/i.test(text)
        && !/\b(tambah|catat|masuk|keluar|transfer|bayar|beli|buat|update|ubah|hapus)\b/i.test(text);
}

function formatAccountType(type: string): string {
    const labels: Record<string, string> = {
        bank: "Rekening",
        cash: "Cash",
        e_wallet: "E-wallet",
        ewallet: "E-wallet",
        investment: "Investasi",
        credit_card: "Kartu kredit",
    };
    return labels[type] || type.replace(/_/g, " ");
}

async function buildBalanceLookupReply(userId: number): Promise<string> {
    const [accounts, investments] = await Promise.all([
        getAccounts(userId),
        getInvestments(userId),
    ]);
    const accountRows = accounts.map((account) => {
        const signedBalance = account.type === "credit_card" ? -account.balance : account.balance;
        return { ...account, signedBalance };
    });
    const totalAccounts = accountRows.reduce((sum, account) => sum + account.signedBalance, 0);
    const totalInvestments = investments.reduce((sum, investment) => sum + (investment.quantity * investment.currentPrice), 0);
    const totalWealth = totalAccounts + totalInvestments;

    if (accountRows.length === 0 && investments.length === 0) {
        return "Belum ada saldo akun atau investasi yang tercatat, Bos. Tambahin dulu dari halaman Saldo ya.";
    }

    const accountList = accountRows.length > 0
        ? accountRows.map((account, index) => `${index + 1}. ${account.name} (${formatAccountType(account.type)}): Rp ${account.signedBalance.toLocaleString("id-ID")}`).join("\n")
        : "Belum ada akun saldo.";
    const investmentLine = totalInvestments > 0 ? `\nInvestasi: Rp ${totalInvestments.toLocaleString("id-ID")}` : "";

    return `Ini data saldo yang kebaca dari halaman Saldo, Bos:\n\n${accountList}\n\nTotal saldo akun: Rp ${totalAccounts.toLocaleString("id-ID")}${investmentLine}\nTotal kekayaan: Rp ${totalWealth.toLocaleString("id-ID")}`;
}

async function askFinanceAgentWithTimeout(...args: Parameters<typeof askFinanceAgent>): ReturnType<typeof askFinanceAgent> {
    if (Date.now() < aiCircuitOpenUntil) {
        logger.warn("[ChatAPI] AI circuit open, returning fallback without provider call");
        return { content: AI_TIMEOUT_REPLY };
    }

    const startedAt = Date.now();
    try {
        const response = await withTimeout(askFinanceAgent(...args), CHAT_AI_TIMEOUT_MS);
        aiConsecutiveFailures = 0;
        logger.info(`[ChatAPI] AI call completed in ${Date.now() - startedAt}ms`);
        return response;
    } catch (error) {
        aiConsecutiveFailures += 1;
        if (aiConsecutiveFailures >= 2) {
            aiCircuitOpenUntil = Date.now() + AI_CIRCUIT_COOLDOWN_MS;
        }
        logger.warn("[ChatAPI] AI call timed out or failed:", error);
        return { content: AI_TIMEOUT_REPLY };
    }
}


export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        const userTier: UserTier = session.user.tier || "miskin";

        const { message, history, imageBase64, undoTransactionId } = await req.json();

        if (!message && !imageBase64 && !undoTransactionId) {
            return NextResponse.json({ error: "Message or image is required" }, { status: 400 });
        }

        // 1. Log User Message
        await logAIChat(userId, "user", message || (undoTransactionId ? "[Undo Transaction]" : "[Image]"));

        const allCategories = await getCategories(userId);
        const textHistory = Array.isArray(history) ? history.slice(-10) as Array<{ role?: string; content?: string }> : [];
        const combinedBudgetMessage = buildBudgetFollowUpMessage(message || "", textHistory);
        const localIntent = !imageBase64 ? parseLocalChatIntent(combinedBudgetMessage || message || "") : { intent: "ai" as const };

        if (!imageBase64 && isGoalCreationConfirmation(message || "", textHistory)) {
            const previousPlan = findPreviousBudgetPlan(textHistory);
            if (previousPlan) {
                const goal = await createGoal(userId, {
                    name: inferGoalName(textHistory),
                    targetAmount: previousPlan.targetAmount,
                    deadline: addMonths(new Date(), previousPlan.months),
                    icon: "Target",
                    color: "#3b82f6",
                });
                const reply = `🎯 Beres, goal tabungan sudah saya buat.\n\n🏷️ ${goal.name}\n💰 Target: Rp ${goal.targetAmount.toLocaleString("id-ID")}\n📅 Deadline: ${previousPlan.months} bulan lagi\n\nSekarang kamu bisa pantau progresnya di menu Goals/Savings.`;
                await logAIChat(userId, "assistant", reply);
                return NextResponse.json({ reply, goal: { id: goal.id, name: goal.name, targetAmount: goal.targetAmount, deadline: goal.deadline } });
            }
        }

        const goalProgressRequest = !imageBase64 ? parseGoalProgressRequest(message || "") : null;
        if (goalProgressRequest) {
            const allGoals = await getGoals(userId);
            const goal = findMatchingGoal(allGoals, goalProgressRequest.goalQuery);
            if (!goal) {
                const goalNames = allGoals.map((item) => item.name).join(", ");
                const reply = allGoals.length > 0
                    ? `Saya belum yakin goal mana yang mau di-update. Goal kamu: ${goalNames}. Coba tulis: \`tambah tabungan ${allGoals[0].name} 500rb\`.`
                    : "Kamu belum punya goal tabungan. Buat goal dulu dari menu Savings atau chat: `buat budget beli laptop`.";
                await logAIChat(userId, "assistant", reply);
                return NextResponse.json({ reply });
            }

            const previousAmount = goal.currentAmount;
            const updatedGoal = await updateGoalProgress(userId, goal.id, goalProgressRequest.amount);
            if (!updatedGoal) {
                const reply = "Goal itu tidak ditemukan atau bukan milik akun ini, Bos.";
                await logAIChat(userId, "assistant", reply);
                return NextResponse.json({ reply });
            }

            const actualAdded = updatedGoal.currentAmount - previousAmount;
            const remaining = Math.max(updatedGoal.targetAmount - updatedGoal.currentAmount, 0);
            const percentage = Math.min(Math.round((updatedGoal.currentAmount / updatedGoal.targetAmount) * 100), 100);
            const reply = `✅ Masuk, progress goal ${updatedGoal.name} sudah saya update.\n\n➕ Ditambahkan: Rp ${actualAdded.toLocaleString("id-ID")}\n💰 Terkumpul: Rp ${updatedGoal.currentAmount.toLocaleString("id-ID")} / Rp ${updatedGoal.targetAmount.toLocaleString("id-ID")}\n📈 Progress: ${percentage}%\n${remaining > 0 ? `🎯 Sisa target: Rp ${remaining.toLocaleString("id-ID")}` : "🏆 Target goal ini sudah tercapai!"}`;
            await logAIChat(userId, "assistant", reply);
            return NextResponse.json({
                reply,
                goal: {
                    id: updatedGoal.id,
                    name: updatedGoal.name,
                    targetAmount: updatedGoal.targetAmount,
                    currentAmount: updatedGoal.currentAmount,
                    deadline: updatedGoal.deadline,
                },
            });
        }

        if (undoTransactionId || localIntent.intent === "undo_transaction") {
            const transactionToUndo = undoTransactionId
                ? await getTransactionById(userId, Number(undoTransactionId))
                : (await getTransactions(userId, 1))[0];
            if (!transactionToUndo) {
                const reply = undoTransactionId
                    ? "Transaksi itu sudah tidak ada atau bukan milik akun ini, Bos."
                    : "Belum ada transaksi yang bisa di-undo, Bos.";
                await logAIChat(userId, "assistant", reply);
                return NextResponse.json({ reply, undoneTransactionId: null });
            }

            await deleteTransaction(userId, transactionToUndo.id);
            const categoryName = allCategories.find(c => c.id === transactionToUndo.categoryId)?.name || "Lainnya";
            const reply = `↩️ Beres, transaksi terakhir sudah saya undo.\n\n📝 ${transactionToUndo.description || "Tanpa Deskripsi"}\n💰 Rp ${transactionToUndo.amount.toLocaleString('id-ID')}\n🏷️ ${categoryName}`;
            await logAIChat(userId, "assistant", reply);
            return NextResponse.json({ reply, undoneTransactionId: transactionToUndo.id });
        }

        if (localIntent.intent === "budget_goal" || localIntent.intent === "budget_plan" || localIntent.intent === "ambiguous_transaction") {
            await logAIChat(userId, "assistant", localIntent.reply);
            return NextResponse.json({ reply: localIntent.reply });
        }

        if (localIntent.intent === "record_transaction") {
            const { amount, description, preferredCategory, type } = localIntent;
            let category = allCategories.find(c => c.name === preferredCategory && c.type === type)
                || allCategories.find(c => c.name === preferredCategory);

            if (!category) {
                const meta = CATEGORY_META[preferredCategory] || CATEGORY_META.Lainnya;
                category = await createCategory({
                    userId,
                    name: preferredCategory,
                    icon: meta.icon,
                    color: meta.color,
                    type,
                });
            }

            category = category
                || allCategories.find(c => c.name === "Lainnya" && c.type === type)
                || allCategories.find(c => c.type === type)
                || allCategories[0];

            if (amount > 0 && category) {
                const transaction = await createTransaction(userId, { amount, description, categoryId: category.id, type, date: new Date() });
                const reply = `✅ Sip! Sudah saya catat ya.\n\n📝 ${description}\n💰 Rp ${amount.toLocaleString('id-ID')}\n🏷️ ${category.name}\n\nAda lagi yang mau dicatat?`;
                await logAIChat(userId, "assistant", reply);
                return NextResponse.json({
                    reply,
                    transaction: {
                        id: transaction.id,
                        amount,
                        description,
                        category: category.name,
                        type,
                    },
                });
            }

            const reply = "Saya sudah paham itu transaksi, tapi nominalnya belum kebaca jelas. Coba tulis contoh: `makan pagi 20rb`.";
            await logAIChat(userId, "assistant", reply);
            return NextResponse.json({ reply });
        }

        if (!imageBase64 && isBalanceLookup(message || "")) {
            const reply = await buildBalanceLookupReply(userId);
            await logAIChat(userId, "assistant", reply);
            return NextResponse.json({ reply });
        }

        // Basic IP rate limit and AI quota only apply to requests that need the AI provider.
        const limited = rateLimit(req, { maxRequests: 5, windowMs: 60000 });
        if (limited) return limited;

        const usageToday = await getDailyAICount(userId);
        if (!canUseAI(usageToday, userTier)) {
            return NextResponse.json({
                error: "Limit AI tercapai",
                message: "Ups, limit AI harianmu sudah habis, Bos! Upgrade ke Kaya atau Sultan untuk chat tanpa batas. 🚀",
                limitReached: true
            }, { status: 403 });
        }

        // Fetch full context only for finance-heavy questions; greetings/tests stay lightweight.
        const now = new Date();
        const needsFullContext = Boolean(imageBase64) || /\b(analisis|analisa|budget|anggaran|goal|target|transaksi|pengeluaran|pemasukan|saldo|akun|rekening|kekayaan|total|tagihan|investasi|hapus|ubah|update|cari|search|laporan|bulan|berapa|simulasi|beli|keuangan)\b/i.test(String(message || ""));
        const stats = await getMonthlyStats(userId, now.getFullYear(), now.getMonth() + 1);
        const allGoals = needsFullContext ? await getGoals(userId) : [];
        const allBudgets = needsFullContext ? await getBudgets(userId, now.getMonth() + 1, now.getFullYear()) : [];
        const rawTransactions = needsFullContext ? await getTransactions(userId, 30) : [];
        const allInvestments = needsFullContext ? await getInvestments(userId) : [];
        const allBills = needsFullContext ? await getBills(userId) : [];
        const allAccounts = needsFullContext ? await getAccounts(userId) : [];
        const totalAccounts = allAccounts.reduce((sum, account) => account.type === "credit_card" ? sum - account.balance : sum + account.balance, 0);
        const totalInvestments = allInvestments.reduce((sum, investment) => sum + (investment.quantity * investment.currentPrice), 0);
        
        // Fetch user vocabulary
        const db = getDb();
        const vocabulary = await getUserVocabulary(db, userId);
        
        logger.info(`[ChatAPI] Context mode: ${needsFullContext ? "full" : "lite"}, vocabulary: ${vocabulary.length} words`);

        const goalsContext = allGoals.map(g => ({
            id: g.id,
            name: g.name,
            targetAmount: g.targetAmount,
            currentAmount: g.currentAmount,
            remaining: g.targetAmount - g.currentAmount,
            percent: (g.currentAmount / g.targetAmount) * 100
        }));

        const budgetsContext = allBudgets.map((b) => ({
            id: b.id,
            category: b.category.name,
            limit: b.amount,
            spent: b.spent,
            remaining: Math.max(0, b.amount - b.spent),
            percent: (b.spent / b.amount) * 100
        }));

        const accountsContext = allAccounts.map((account) => ({
            id: account.id,
            name: account.name,
            type: account.type,
            balance: account.type === "credit_card" ? -account.balance : account.balance,
        }));

        const transactionsContext = rawTransactions.map((t) => {
            try {
                return {
                    id: t.id,
                    date: t.date instanceof Date ? t.date.toISOString() : new Date(t.date).toISOString(),
                    amount: t.amount,
                    description: t.description || "Tanpa Deskripsi",
                    category: allCategories.find(c => c.id === t.categoryId)?.name || "Lainnya",
                    type: t.type as "expense" | "income"
                };
            } catch (e) {
                console.error("Error mapping transaction context:", e, t);
                return null;
            }
        }).filter((t): t is NonNullable<typeof t> => t !== null);

        // Get AI response
        const aiResponse = await askFinanceAgentWithTimeout(message || "Analyze this image", {
            monthlyStats: {
                ...stats,
                totalAccounts,
                accountCount: allAccounts.length,
                totalInvestments,
                totalWealth: totalAccounts + totalInvestments,
            },
            accounts: accountsContext,
            goals: goalsContext,
            budgets: budgetsContext,
            transactions: transactionsContext,
            investments: allInvestments.map(i => ({
                id: i.id,
                name: i.name,
                type: i.type,
                quantity: i.quantity,
                currentPrice: i.currentPrice,
                totalValue: i.quantity * i.currentPrice,
                platform: i.platform
            })),
            bills: allBills.map(b => ({
                id: b.id,
                name: b.name,
                amount: b.amount,
                dueDate: b.dueDate,
                isPaid: b.isPaid,
                frequency: b.frequency
            })),
            vocabulary: vocabulary.map(v => ({
                word: v.word,
                type: v.type
            }))
        }, history, imageBase64);

        logger.info("[ChatAPI] AI Response received");
        logger.debug("[ChatAPI] Response details:", aiResponse);

        let finalReply = aiResponse.content;

        // Handle Tool Call (Record Transaction)
        if (aiResponse.toolCall) {
            const toolName = aiResponse.toolCall.function.name;
            const args = JSON.parse(aiResponse.toolCall.function.arguments);

            logger.info(`[ChatAPI] ToolCall triggered: ${toolName}`, args);

            if (toolName === "record_transaction") {
                const requestedCategory = String(args.category || "").toLowerCase();
                const category = allCategories.find(c =>
                    c.name.toLowerCase() === requestedCategory
                ) || allCategories.find(c =>
                    requestedCategory && c.name.toLowerCase().includes(requestedCategory)
                ) || allCategories.find(c => c.name === "Makanan")
                    || allCategories.find(c => c.name === "Lainnya")
                    || allCategories[0];

                const amount = Number(args.amount) || 0;
                const description = String(args.description || "").trim();
                const type = args.type === "income" ? "income" : "expense";

                if (amount <= 0 || !description) {
                    finalReply = "Halo! Mau catat transaksi? Tulis aja contohnya: `Beli makan di warteg 20rb`.";
                } else if (!category) {
                    finalReply = "Maaf, saya belum bisa mencatat transaksi karena kategori belum tersedia. Coba tambah kategori dulu ya.";
                } else {
                    await createTransaction(userId, {
                        amount,
                        description,
                        categoryId: category.id,
                        type,
                        date: new Date()
                    });

                    let extraFeedback = "";
                    if (type === "expense") {
                        try {
                            const settings = await getUserSettings(userId);
                            let primaryGoal = undefined;
                            if (settings?.primaryGoalId) {
                                primaryGoal = await getGoalById(userId, settings.primaryGoalId);
                            }
                            const monthlySaving = (stats && stats.balance > 0) ? stats.balance : (stats?.income || 0) * 0.2 || 1000000;
                            const impact = await getPsychologicalImpact(amount, settings?.hourlyRate || 50000, primaryGoal, monthlySaving, category.name);
                            extraFeedback = `\n\n${impact}`;
                        } catch (impactError) {
                            logger.warn("[ChatAPI] Psychological impact skipped:", impactError);
                        }
                    }

                    finalReply = `✅ Sip! Sudah saya catat ya.\n\n📝 ${description}\n💰 Rp ${amount.toLocaleString('id-ID')}\n🏷️ ${category.name}${extraFeedback}\n\nAda lagi yang mau dicatat?`;
                }
            } else if (toolName === "create_budget") {
                const category = allCategories.find(c =>
                    c.name.toLowerCase() === args.category.toLowerCase()
                ) || allCategories.find(c => c.name === "Lainnya");

                if (category) {
                    await createBudget(userId, {
                        categoryId: category.id,
                        amount: args.amount,
                        month: args.month,
                        year: args.year
                    });

                    finalReply = `✅ Oke Bos! Budget ${category.name} sebesar Rp ${args.amount.toLocaleString('id-ID')} untuk bulan ${args.month}/${args.year} sudah saya buatkan. 🏦⚡`;
                }
            } else if (toolName === "create_goal") {
                await createGoal(userId, {
                    name: args.name,
                    targetAmount: args.targetAmount,
                    deadline: args.deadline ? new Date(args.deadline) : undefined,
                    icon: args.icon
                });

                finalReply = `✅ Mantap Alip! Target baru "${args.name}" sebesar Rp ${args.targetAmount.toLocaleString('id-ID')} sudah saya pasang. 🎯✨ Semangat nabungnya ya!`;
            } else if (toolName === "update_transaction") {
                const updateData: { amount?: number; description?: string; type?: "income" | "expense" | "transfer"; categoryId?: number } = {};
                if (args.amount) updateData.amount = args.amount;
                if (args.description) updateData.description = args.description;
                if (args.type) updateData.type = args.type;
                if (args.category) {
                    const category = allCategories.find(c =>
                        c.name.toLowerCase() === args.category.toLowerCase()
                    );
                    if (category) updateData.categoryId = category.id;
                }

                const result = await updateTransaction(userId, args.id, updateData);
                if (result) {
                    finalReply = `✅ Beres, Bos! Transaksi [ID: ${args.id}] sudah saya perbarui. 📝✨`;
                } else {
                    finalReply = `❌ Waduh Bos, transaksi [ID: ${args.id}] tidak ketemu. Mungkin sudah terhapus sebelumnya? 🤔`;
                }
            } else if (toolName === "delete_transaction") {
                const transaction = await getTransactionById(userId, args.id);
                await deleteTransaction(userId, args.id);
                finalReply = `🗑️ Oke Bos, transaksi "${transaction ? transaction.description : 'ID ' + args.id}" sudah saya hapus dari catatan.`;
            } else if (toolName === "update_budget") {
                const result = await updateBudget(userId, args.id, { amount: args.amount });
                if (result) {
                    finalReply = `✅ Budget [ID: ${args.id}] sudah saya sesuaikan jadi Rp ${args.amount.toLocaleString('id-ID')}. 🏦⚡`;
                } else {
                    finalReply = `❌ Hmm, budget [ID: ${args.id}] tidak ditemukan nih, Bos. 🤔`;
                }
            } else if (toolName === "delete_budget") {
                await deleteBudget(userId, args.id);
                finalReply = `🗑️ Budget [ID: ${args.id}] sudah dihapus ya, Bos.`;
            } else if (toolName === "update_goal") {
                const updateData: { name?: string; targetAmount?: number; deadline?: Date; icon?: string } = {};
                if (args.name) updateData.name = args.name;
                if (args.targetAmount) updateData.targetAmount = args.targetAmount;
                if (args.deadline) updateData.deadline = new Date(args.deadline);
                if (args.icon) updateData.icon = args.icon;

                const result = await updateGoal(userId, args.id, updateData);
                if (result) {
                    finalReply = `✅ Target goal [ID: ${args.id}] sudah saya perbarui sesuai permintaan Bos! 🎯✨`;
                } else {
                    finalReply = `❌ Maaf Bos, goal [ID: ${args.id}] tidak ketemu di database. Coba cek lagi kodenya atau buat goal baru saja? 😊`;
                }
            } else if (toolName === "delete_goal") {
                const result = await removeGoal(userId, args.id);
                if (result) {
                    finalReply = `🗑️ Goal "${result.name}" [ID: ${args.id}] sudah saya hapus dari daftar target Bos.`;
                } else {
                    finalReply = `❌ Hmm, goal [ID: ${args.id}] sepertinya sudah tidak ada di database kita, Bos. 🤔`;
                }
            } else if (toolName === "reallocate_goal_funds") {
                const fromGoal = allGoals.find(g => g.id === args.fromGoalId);
                if (!fromGoal) {
                    finalReply = `❌ Waduh Bos, goal asal [ID: ${args.fromGoalId}] tidak ketemu.`;
                } else {
                    const amountToMove = args.amount || fromGoal.currentAmount;

                    if (args.target === "goal" && args.toGoalId) {
                        const toGoal = allGoals.find(g => g.id === args.toGoalId);
                        if (toGoal) {
                            await updateGoal(userId, toGoal.id, {
                                currentAmount: toGoal.currentAmount + amountToMove
                            });
                            // Also decrease fromGoal
                            await updateGoal(userId, fromGoal.id, {
                                currentAmount: fromGoal.currentAmount - amountToMove
                            });

                            finalReply = `✅ Dana sebesar Rp ${amountToMove.toLocaleString('id-ID')} sudah saya pindahkan dari "${fromGoal.name}" ke "${toGoal.name}". Pindahan beres! 💸✨`;
                        } else {
                            finalReply = `❌ Goal tujuan [ID: ${args.toGoalId}] tidak ditemukan nih, Bos.`;
                        }
                    } else if (args.target === "balance") {
                        // Create income transaction to "return" funds to balance
                        await createTransaction(userId, {
                            amount: amountToMove,
                            description: `Pengalihan dana dari Goal: ${fromGoal.name}`,
                            categoryId: allCategories.find(c => c.name === "Tabungan")?.id ||
                                allCategories.find(c => c.name === "Investasi")?.id ||
                                allCategories.find(c => c.name === "Lainnya")?.id ||
                                allCategories[0].id,
                            type: "income",
                            date: new Date()
                        });
                        // Decrease fromGoal
                        await updateGoal(userId, fromGoal.id, {
                            currentAmount: fromGoal.currentAmount - amountToMove
                        });

                        finalReply = `✅ Dana sebesar Rp ${amountToMove.toLocaleString('id-ID')} dari "${fromGoal.name}" sudah saya kembalikan ke Saldo Utama sebagai Pemasukan ya, Bos! 💰⚡`;
                    }
                }
            } else if (toolName === "add_goal_funds") {
                const targetGoal = allGoals.find(g => g.id === args.goalId);
                if (!targetGoal) {
                    finalReply = `❌ Waduh Bos, goal [ID: ${args.goalId}] tidak ditemukan.`;
                } else {
                    // Create expense transaction (moving money from balance to goal)
                    await createTransaction(userId, {
                        amount: args.amount,
                        description: `Setoran ke Goal: ${targetGoal.name}`,
                        categoryId: allCategories.find(c => c.name === "Tabungan")?.id ||
                            allCategories.find(c => c.name === "Investasi")?.id ||
                            allCategories.find(c => c.name === "Lainnya")?.id ||
                            allCategories[0].id,
                        type: "expense",
                        date: new Date()
                    });

                    // Update goal currentAmount
                    await updateGoal(userId, targetGoal.id, {
                        currentAmount: targetGoal.currentAmount + args.amount
                    });

                    finalReply = `✅ Beres Bos! Dana sebesar Rp ${args.amount.toLocaleString('id-ID')} sudah saya sisihkan dari Saldo Utama ke goal "${targetGoal.name}". Semangat nabungnya ya! 🎯✨`;
                }
            } else if (toolName === "create_bill") {
                await createBill(userId, {
                    name: args.name,
                    amount: args.amount,
                    dueDate: args.dueDate,
                    frequency: args.frequency,
                    icon: args.icon
                });
                finalReply = `✅ Sip! Tagihan "${args.name}" sebesar Rp ${args.amount.toLocaleString('id-ID')} (Tgl ${args.dueDate}) sudah saya catat. Jangan lupa bayar ya Bos! 🧾⚡`;
            } else if (toolName === "update_bill") {
                const updateData: { name?: string; amount?: number; dueDate?: number } = {};
                if (args.name) updateData.name = args.name;
                if (args.amount) updateData.amount = args.amount;
                if (args.dueDate) updateData.dueDate = Number(args.dueDate);

                await updateBill(userId, args.id, updateData);
                finalReply = `✅ Tagihan [ID: ${args.id}] sudah saya update sesuai permintaan Bos! 👌`;
            } else if (toolName === "delete_bill") {
                const bill = await getBillById(userId, args.id);
                await deleteBill(userId, args.id);
                finalReply = `🗑️ Oke, tagihan "${bill ? bill.name : 'ID ' + args.id}" sudah saya hapus.`;
            } else if (toolName === "mark_bill_paid") {
                const bill = await toggleBillPaid(userId, args.id);
                if (bill) {
                    let extraMessage = "";
                    if (args.paidFromBalance && bill.isPaid) {
                        // Create expense transaction
                        await createTransaction(userId, {
                            amount: bill.amount,
                            description: `Bayar Tagihan: ${bill.name}`,
                            categoryId: allCategories.find(c => c.name === "Tagihan")?.id || allCategories[0].id,
                            type: "expense",
                            date: new Date()
                        });
                        extraMessage = "\n💸 Saldo utama sudah dipotong untuk pembayaran ini.";
                    }

                    finalReply = bill.isPaid
                        ? `✅ Mantap! Tagihan "${bill.name}" sudah ditandai LUNAS. 🎉${extraMessage}`
                        : `✅ Oke, status tagihan "${bill.name}" saya ubah jadi BELUM DIBAYAR.`;
                } else {
                    finalReply = `❌ Tagihan tidak ditemukan Bos.`;
                }
            } else if (toolName === "create_investment") {
                await createInvestment(userId, {
                    name: args.name,
                    type: args.type,
                    quantity: args.quantity,
                    avgBuyPrice: args.buyPrice,
                    currentPrice: args.currentPrice,
                    platform: args.platform
                });
                finalReply = `✅ Keren! Aset investasi baru "${args.name}" (${args.quantity} unit) sudah saya tambahkan ke portofolio. 📈🚀`;
            } else if (toolName === "update_investment") {
                const investment = await getInvestmentById(userId, args.id);
                const updateData: { quantity?: number; avgBuyPrice?: number; currentPrice?: number } = {};
                if (args.quantity) updateData.quantity = args.quantity;
                if (args.buyPrice) updateData.avgBuyPrice = args.buyPrice;
                if (args.currentPrice) updateData.currentPrice = args.currentPrice;

                await updateInvestment(userId, args.id, updateData);
                const updatedInvestment = await getInvestmentById(userId, args.id); // Re-fetch to confirm

                if (!updatedInvestment) {
                    finalReply = `❌ Gagal mengupdate investasi [ID: ${args.id}]. Data tidak ditemukan di database.`;
                } else {
                    let extra = "";
                    if (args.soldAmount) {
                        await createTransaction(userId, {
                            amount: args.soldAmount,
                            description: `Penjualan Aset Partial: ${updatedInvestment.name}`,
                            categoryId: allCategories.find(c => c.name === "Investasi")?.id || allCategories.find(c => c.name === "Pemasukan")?.id || allCategories[0].id,
                            type: "income",
                            date: new Date()
                        });
                        extra = `\n💰 Uang hasil penjualan Rp ${args.soldAmount.toLocaleString('id-ID')} sudah masuk ke Saldo Utama.`;
                    }

                    finalReply = `✅ Data portofolio "${updatedInvestment.name}" sudah diperbarui!\n📊 Total Unit Sekarang: ${updatedInvestment.quantity}${extra}`;
                }
            } else if (toolName === "search_transactions") {
                const category = allCategories.find(c =>
                    c.name.toLowerCase() === (args.category || "").toLowerCase()
                );

                const searchResults = await searchTransactions(userId, {
                    search: args.query,
                    categoryId: category?.id,
                    type: args.type,
                    startDate: args.startDate ? new Date(args.startDate) : undefined,
                    endDate: args.endDate ? new Date(args.endDate) : undefined,
                    minAmount: args.minAmount,
                    maxAmount: args.maxAmount,
                    limit: 100 // Get more for analysis
                });

                // Format results for AI
                const formattedResults = searchResults.map((t: Transaction) => {
                    const catName = allCategories.find(c => c.id === t.categoryId)?.name || "Lainnya";
                    return `- [${new Date(t.date).toLocaleDateString('id-ID')}] ${t.description}: ${t.type === 'expense' ? '-' : '+'}Rp ${t.amount.toLocaleString('id-ID')} (${catName})`;
                }).join("\n");

                // SECOUND PASS: Give search results back to AI to answer the user
                const secondResponse = await askFinanceAgentWithTimeout(
                    `HASIL PENCARIAN:\n${formattedResults || "Tidak ditemukan transaksi yang cocok."}\n\nBerdasarkan hasil pencarian di atas, jawablah pertanyaan awal saya: "${message}"`,
                    {
                        monthlyStats: stats,
                        goals: goalsContext,
                        budgets: budgetsContext,
                        transactions: transactionsContext,
                        investments: allInvestments.map(i => ({
                            id: i.id,
                            name: i.name,
                            type: i.type,
                            quantity: i.quantity,
                            currentPrice: i.currentPrice,
                            totalValue: i.quantity * i.currentPrice,
                            platform: i.platform
                        })),
                        bills: allBills.map(b => ({
                            id: b.id,
                            name: b.name,
                            amount: b.amount,
                            dueDate: b.dueDate,
                            isPaid: b.isPaid,
                            frequency: b.frequency
                        }))
                    },
                    [...history, { role: "assistant", content: aiResponse.content }]
                );

                finalReply = secondResponse.content;
            } else if (toolName === "delete_investment") {
                const investment = await getInvestmentById(userId, args.id); // Need to fetch details first
                await deleteInvestment(userId, args.id);

                let extra = "";
                if (args.soldAmount && investment) {
                    await createTransaction(userId, {
                        amount: args.soldAmount,
                        description: `Penjualan Aset: ${investment.name}`,
                        categoryId: allCategories.find(c => c.name === "Investasi")?.id || allCategories.find(c => c.name === "Pemasukan")?.id || allCategories[0].id,
                        type: "income",
                        date: new Date()
                    });
                    extra = `\n💰 Uang hasil penjualan Rp ${args.soldAmount.toLocaleString('id-ID')} sudah masuk ke Saldo Utama.`;
                }

                finalReply = `🗑️ Aset investasi "${investment ? investment.name : 'ID ' + args.id}" sudah saya hapus dari portofolio.${extra}`;
            } else if (toolName === "simulate_scenario") {
                // This is a pure AI "thinking" tool, we don't need to mutate DB
                // We just let the AI provide the final reply with calculations
                // But we can add a second pass if we want more precision

                finalReply = aiResponse.content;
            }
        }

        // Final cleanup to remove any markdown bold syntax that might have slipped through
        finalReply = finalReply.replace(/\*\*/g, "");

        // 3. Log Assistant Response
        await logAIChat(userId, "assistant", finalReply);

        return NextResponse.json({ reply: finalReply });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Chat API Error:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: errorMessage,
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
