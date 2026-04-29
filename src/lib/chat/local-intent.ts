export type ChatIntent =
    | "budget_goal"
    | "budget_plan"
    | "record_transaction"
    | "ambiguous_transaction"
    | "undo_transaction"
    | "ai";

export type LocalCategoryHint = "Makanan" | "Transportasi" | "Tagihan" | "Pemasukan" | "Lainnya";

export type LocalTransactionParse = {
    intent: "record_transaction";
    amount: number;
    description: string;
    type: "income" | "expense";
    preferredCategory: LocalCategoryHint;
    confidence: "high" | "medium";
};

export type AmbiguousTransactionParse = {
    intent: "ambiguous_transaction";
    reply: string;
};

export type BudgetGoalParse = {
    intent: "budget_goal";
    amount: number;
    reply: string;
};

export type BudgetPlanParse = {
    intent: "budget_plan";
    targetAmount: number;
    monthlySaving: number;
    months: number;
    monthlyRequired: number;
    surplusOrShortfall: number;
    isAchievable: boolean;
    reply: string;
};

export type UndoTransactionParse = {
    intent: "undo_transaction";
};

export type LocalIntentResult = LocalTransactionParse | AmbiguousTransactionParse | BudgetGoalParse | BudgetPlanParse | UndoTransactionParse | { intent: "ai" };

type AmountMatch = {
    raw: string;
    numberText: string;
    unit: string;
    hasRp: boolean;
    amount: number;
    hasExplicitMoney: boolean;
};

const MONEY_PATTERN = /(?:^|\s)(rp\s*)?(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta)?\b/i;
const MODEL_NUMBER_PATTERN = /\b(?:m\d+|s\d+|iphone\s+\d+|rt\s*\d+|rw\s*\d+|no\s*\d+)\b/i;

const FOOD_KEYWORDS = ["warteg", "makan", "minum", "kopi", "jajan", "sarapan", "lunch", "dinner"];
const BILL_KEYWORDS = ["kos", "listrik", "internet", "wifi", "pulsa", "air", "pdam"];
const TRANSPORT_KEYWORDS = ["krl", "mrt", "lrt", "bus", "angkot", "gojek", "grab", "tol", "parkir", "bensin", "ojek"];
const INCOME_KEYWORDS = ["gaji", "masuk", "terima", "dapat", "bonus", "fee", "income"];
const TRANSACTION_KEYWORDS = [
    "beli", "bayar", "jajan", "makan", "minum", "transfer", "top", "topup",
    "gaji", "masuk", "terima", "dapat", "ongkir", "grab", "gojek", "warteg",
    "kopi", "kos", "listrik", "internet", "krl", "mrt", "lrt", "bus", "angkot",
    "tol", "parkir", "bensin", "ojek", "pulsa", "wifi", "sarapan",
];

export function parseLocalChatIntent(message: string): LocalIntentResult {
    const textMessage = String(message || "").trim();
    const normalizedMessage = normalize(textMessage);

    if (!normalizedMessage) return { intent: "ai" };

    if (isUndoTransactionIntent(normalizedMessage)) {
        return { intent: "undo_transaction" };
    }

    const amountMatch = parseAmount(normalizedMessage);
    const budgetPlan = parseBudgetPlan(normalizedMessage);

    if (budgetPlan) {
        return budgetPlan;
    }

    if (isBudgetOrGoalIntent(normalizedMessage)) {
        return buildBudgetGoalReply(amountMatch);
    }

    const words = getNormalizedWords(normalizedMessage);
    const looksLikeTransaction = hasKeyword(words, TRANSACTION_KEYWORDS);

    if (!amountMatch) {
        if (looksLikeTransaction && MODEL_NUMBER_PATTERN.test(normalizedMessage)) {
            return {
                intent: "ambiguous_transaction",
                reply: "Ini mau dicatat sebagai pengeluaran sekarang atau dibuat target/budget? Kalau transaksi, kirim nominalnya juga ya, misal: `beli mac 20jt`.",
            };
        }
        return { intent: "ai" };
    }

    if (!looksLikeTransaction) return { intent: "ai" };

    if (!amountMatch.hasExplicitMoney && (amountMatch.amount < 1000 || MODEL_NUMBER_PATTERN.test(normalizedMessage))) {
        return {
            intent: "ambiguous_transaction",
            reply: "Saya nangkep ini seperti transaksi, tapi nominalnya belum jelas. Pakai format uang ya, misal: `krl 3rb` atau `makan pagi 20000`.",
        };
    }

    const isIncomeTransaction = hasKeyword(words, INCOME_KEYWORDS);
    const type = isIncomeTransaction ? "income" : "expense";
    const preferredCategory = pickCategory(words, type);
    const description = textMessage.replace(amountMatch.raw, " ").replace(/\s+/g, " ").trim() || textMessage;

    return {
        intent: "record_transaction",
        amount: amountMatch.amount,
        description,
        type,
        preferredCategory,
        confidence: amountMatch.hasExplicitMoney ? "high" : "medium",
    };
}

export function isBudgetOrGoalIntent(normalizedMessage: string): boolean {
    return /\b(buat|bikin|atur|rancang|setting|set)\s+(budget|anggaran)|\b(budget|anggaran)\s+(buat|untuk|beli)|\b(goal|target|nabung|tabungan|rencana beli)\b/i.test(normalizedMessage);
}

export function isUndoTransactionIntent(normalizedMessage: string): boolean {
    return /^(undo|urungkan|balikin|batalkan|batalin|hapus yang tadi|hapus transaksi tadi|hapus catatan tadi|salah catat)$/i.test(normalizedMessage.trim());
}

function parseBudgetPlan(normalizedMessage: string): BudgetPlanParse | null {
    if (!/(harga|target|biaya|budget|anggaran|sisih|sanggup|nabung|per bulan|bulan)/i.test(normalizedMessage)) {
        return null;
    }

    const amounts = parseAmounts(normalizedMessage).filter((amount) => amount.hasExplicitMoney || amount.amount >= 1000);
    const months = parseDurationMonths(normalizedMessage);
    const monthlySaving = findMonthlySaving(normalizedMessage, amounts);
    const targetAmount = findTargetAmount(normalizedMessage, amounts, monthlySaving);

    if (!targetAmount || !monthlySaving || !months) return null;

    const monthlyRequired = Math.ceil(targetAmount / months);
    const surplusOrShortfall = monthlySaving - monthlyRequired;
    const isAchievable = surplusOrShortfall >= 0;
    const totalSaved = monthlySaving * months;
    const projectedMonths = Math.ceil(targetAmount / monthlySaving);

    return {
        intent: "budget_plan",
        targetAmount,
        monthlySaving,
        months,
        monthlyRequired,
        surplusOrShortfall,
        isAchievable,
        reply: isAchievable
            ? `Bisa, rencana ini realistis.\n\n🎯 Target: Rp ${targetAmount.toLocaleString("id-ID")}\n⏳ Deadline: ${months} bulan\n💸 Perlu nabung: Rp ${monthlyRequired.toLocaleString("id-ID")}/bulan\n✅ Sanggup kamu: Rp ${monthlySaving.toLocaleString("id-ID")}/bulan\n\nKalau konsisten, kamu akan kumpul sekitar Rp ${totalSaved.toLocaleString("id-ID")}. Ada buffer Rp ${surplusOrShortfall.toLocaleString("id-ID")}/bulan.\n\nMau saya bantu jadikan ini goal tabungan?`
            : `Belum realistis dengan angka sekarang.\n\n🎯 Target: Rp ${targetAmount.toLocaleString("id-ID")}\n⏳ Deadline: ${months} bulan\n💸 Perlu nabung: Rp ${monthlyRequired.toLocaleString("id-ID")}/bulan\n😬 Sanggup kamu: Rp ${monthlySaving.toLocaleString("id-ID")}/bulan\n\nKurangnya sekitar Rp ${Math.abs(surplusOrShortfall).toLocaleString("id-ID")}/bulan. Dengan kemampuan sekarang, estimasi kebelinya sekitar ${projectedMonths} bulan.\n\nOpsi: mundurin deadline, turunin target harga, atau naikin tabungan bulanan.`,
    };
}

function buildBudgetGoalReply(amountMatch: AmountMatch | null): BudgetGoalParse {
    if (amountMatch && amountMatch.amount > 0 && amountMatch.hasExplicitMoney) {
        return {
            intent: "budget_goal",
            amount: amountMatch.amount,
            reply: `Siap, ini cocoknya dibuat sebagai budget/goal, bukan transaksi. Targetnya saya baca sekitar Rp ${amountMatch.amount.toLocaleString("id-ID")}.

Biar saya bikinin rencana yang pas, kirim 2 info ini ya:
1. Mau kebeli kapan?
2. Sanggup sisihin berapa per bulan?`,
        };
    }

    return {
        intent: "budget_goal",
        amount: 0,
        reply: `Siap, ini request budget/goal, bukan transaksi. Biar saya bantu hitung rencananya, kirim dulu:

1. Harga targetnya berapa?
2. Mau kebeli kapan?
3. Sanggup sisihin berapa per bulan?`,
    };
}

function parseAmount(normalizedMessage: string): AmountMatch | null {
    return parseAmounts(normalizedMessage)[0] || null;
}

function parseAmounts(normalizedMessage: string): AmountMatch[] {
    return Array.from(normalizedMessage.matchAll(new RegExp(MONEY_PATTERN.source, "gi")))
        .map((match) => buildAmountMatch(match))
        .filter((amount): amount is AmountMatch => amount !== null);
}

function buildAmountMatch(match: RegExpMatchArray): AmountMatch | null {
    const numberText = match[2];
    const unit = match[3] || "";
    const rawNumber = Number(numberText.replace(",", "."));
    if (!Number.isFinite(rawNumber)) return null;

    const multiplier = /^(rb|ribu|k)$/i.test(unit) ? 1000 : /^(jt|juta)$/i.test(unit) ? 1000000 : 1;
    const amount = Math.round(rawNumber * multiplier);

    return {
        raw: match[0],
        numberText,
        unit,
        hasRp: Boolean(match[1]),
        amount,
        hasExplicitMoney: Boolean(match[1] || unit),
    };
}

function parseDurationMonths(normalizedMessage: string): number | null {
    const explicitMonths = normalizedMessage.match(/(\d+(?:[.,]\d+)?)\s*(bulan|bln|mo)\b/i);
    if (explicitMonths) return Math.max(1, Math.round(Number(explicitMonths[1].replace(",", "."))));

    const years = normalizedMessage.match(/(\d+(?:[.,]\d+)?)\s*(tahun|thn|year)\b/i);
    if (years) return Math.max(1, Math.round(Number(years[1].replace(",", ".")) * 12));

    return null;
}

function findMonthlySaving(normalizedMessage: string, amounts: AmountMatch[]): number | null {
    const monthlyMatch = normalizedMessage.match(/(?:sanggup|mampu|sisih(?:in)?|nabung|tabung)\D{0,24}(rp\s*)?(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta)?\s*(?:per\s*)?(bulan|bln)?/i);
    if (monthlyMatch) {
        const amount = buildAmountMatch(monthlyMatch as RegExpMatchArray);
        if (amount?.amount) return amount.amount;
    }

    if (/per\s*bulan|bulanan|tiap\s*bulan|\/bulan/i.test(normalizedMessage) && amounts.length >= 2) {
        return amounts[amounts.length - 1].amount;
    }

    return null;
}

function findTargetAmount(normalizedMessage: string, amounts: AmountMatch[], monthlySaving: number | null): number | null {
    const targetMatch = normalizedMessage.match(/(?:harga|target|biaya|budget|anggaran)\D{0,24}(rp\s*)?(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta)?/i);
    if (targetMatch) {
        const amount = buildAmountMatch(targetMatch as RegExpMatchArray);
        if (amount?.amount && (amount.hasExplicitMoney || amount.amount >= 1000)) return amount.amount;
    }

    const candidates = monthlySaving ? amounts.filter((amount) => amount.amount !== monthlySaving) : amounts;
    if (candidates.length === 0) return null;
    return Math.max(...candidates.map((amount) => amount.amount));
}

function pickCategory(words: string[], type: "income" | "expense"): LocalCategoryHint {
    if (type === "income") return "Pemasukan";
    if (hasKeyword(words, FOOD_KEYWORDS)) return "Makanan";
    if (hasKeyword(words, TRANSPORT_KEYWORDS)) return "Transportasi";
    if (hasKeyword(words, BILL_KEYWORDS)) return "Tagihan";
    return "Lainnya";
}

function normalize(message: string): string {
    return message.toLowerCase();
}

function getNormalizedWords(message: string): string[] {
    return message.split(/[^a-z0-9]+/).filter(Boolean);
}

function hasKeyword(words: string[], keywords: string[]): boolean {
    return words.some((word) => keywords.some((keyword) =>
        word === keyword || word.startsWith(keyword) || keyword.startsWith(word)
    ));
}
