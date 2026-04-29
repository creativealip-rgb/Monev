import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    auth: vi.fn(),
    rateLimit: vi.fn(),
    askFinanceAgent: vi.fn(),
    getPsychologicalImpact: vi.fn(),
    logger: {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
    ops: {
        getMonthlyStats: vi.fn(),
        getGoals: vi.fn(),
        getBudgets: vi.fn(),
        getTransactions: vi.fn(),
        getTransactionById: vi.fn(),
        getCategories: vi.fn(),
        createCategory: vi.fn(),
        createTransaction: vi.fn(),
        updateTransaction: vi.fn(),
        deleteTransaction: vi.fn(),
        searchTransactions: vi.fn(),
        createBudget: vi.fn(),
        updateBudget: vi.fn(),
        deleteBudget: vi.fn(),
        createGoal: vi.fn(),
        updateGoal: vi.fn(),
        updateGoalProgress: vi.fn(),
        removeGoal: vi.fn(),
        getGoalById: vi.fn(),
        getInvestments: vi.fn(),
        getInvestmentById: vi.fn(),
        createInvestment: vi.fn(),
        updateInvestment: vi.fn(),
        deleteInvestment: vi.fn(),
        getBills: vi.fn(),
        getBillById: vi.fn(),
        createBill: vi.fn(),
        updateBill: vi.fn(),
        deleteBill: vi.fn(),
        toggleBillPaid: vi.fn(),
        getDailyAICount: vi.fn(),
        logAIChat: vi.fn(),
        getUserSettings: vi.fn(),
    },
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));
vi.mock("@/lib/logger", () => ({ logger: mocks.logger }));
vi.mock("@/lib/ai", () => ({
    askFinanceAgent: mocks.askFinanceAgent,
    getPsychologicalImpact: mocks.getPsychologicalImpact,
}));
vi.mock("@/lib/tier-gate", () => ({
    canUseAI: () => true,
}));
vi.mock("@/backend/db/operations", () => mocks.ops);

function mockRequest(body: Record<string, unknown>) {
    return {
        json: async () => body,
        headers: new Headers(),
    } as any;
}

async function importPost() {
    vi.resetModules();
    const mod = await import("./route");
    return mod.POST;
}

describe("POST /api/chat", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.auth.mockResolvedValue({ user: { id: "1", tier: "sultan" } });
        mocks.rateLimit.mockReturnValue(null);
        mocks.ops.getCategories.mockResolvedValue([
            { id: 1, name: "Makanan", type: "expense" },
            { id: 2, name: "Transportasi", type: "expense" },
            { id: 3, name: "Pemasukan", type: "income" },
            { id: 4, name: "Lainnya", type: "expense" },
        ]);
        mocks.ops.createTransaction.mockResolvedValue({ id: 99 });
        mocks.ops.createGoal.mockResolvedValue({ id: 12, name: "Mac Air M4", targetAmount: 18000000, currentAmount: 0, deadline: new Date("2026-12-31") });
        mocks.ops.updateGoalProgress.mockResolvedValue({ id: 12, name: "Mac Air M4", targetAmount: 18000000, currentAmount: 500000, deadline: new Date("2026-12-31") });
        mocks.ops.getMonthlyStats.mockResolvedValue({ income: 0, expense: 0, balance: 0 });
        mocks.ops.getGoals.mockResolvedValue([]);
        mocks.ops.getBudgets.mockResolvedValue([]);
        mocks.ops.getTransactions.mockResolvedValue([]);
        mocks.ops.getInvestments.mockResolvedValue([]);
        mocks.ops.getBills.mockResolvedValue([]);
        mocks.ops.getDailyAICount.mockResolvedValue(0);
        mocks.ops.logAIChat.mockResolvedValue(undefined);
        mocks.askFinanceAgent.mockResolvedValue({ content: "Jawaban AI" });
    });

    it("records simple local transaction without calling AI", async () => {
        const POST = await importPost();
        const response = await POST(mockRequest({ message: "makan pagi 20rb", history: [] }));
        const json = await response.json();

        expect(mocks.askFinanceAgent).not.toHaveBeenCalled();
        expect(mocks.ops.createTransaction).toHaveBeenCalledWith(1, expect.objectContaining({
            amount: 20000,
            description: "makan pagi",
            categoryId: 1,
            type: "expense",
        }));
        expect(json.reply).toContain("Sudah saya catat");
        expect(json.transaction).toMatchObject({
            id: 99,
            amount: 20000,
            description: "makan pagi",
            category: "Makanan",
            type: "expense",
        });
    });

    it("handles budget goal locally without recording a transaction", async () => {
        const POST = await importPost();
        const response = await POST(mockRequest({ message: "bantu gw buat budget untuk beli mac air m4", history: [] }));
        const json = await response.json();

        expect(mocks.askFinanceAgent).not.toHaveBeenCalled();
        expect(mocks.ops.createTransaction).not.toHaveBeenCalled();
        expect(json.reply).toContain("bukan transaksi");
    });

    it("calculates budget plan locally without calling AI", async () => {
        const POST = await importPost();
        const response = await POST(mockRequest({ message: "harga 18jt, 6 bulan, sanggup 3jt per bulan", history: [] }));
        const json = await response.json();

        expect(mocks.askFinanceAgent).not.toHaveBeenCalled();
        expect(mocks.ops.createTransaction).not.toHaveBeenCalled();
        expect(json.reply).toContain("realistis");
        expect(json.reply).toContain("Rp 3.000.000/bulan");
    });

    it("calculates budget plan from follow-up context", async () => {
        const POST = await importPost();
        const response = await POST(mockRequest({
            message: "harga 18jt, 6 bulan, sanggup 3jt per bulan",
            history: [
                { role: "user", content: "bantu gw buat budget untuk beli mac air m4" },
                { role: "assistant", content: "Harga targetnya berapa? Mau kebeli kapan? Sanggup sisihin berapa per bulan?" },
            ],
        }));
        const json = await response.json();

        expect(mocks.askFinanceAgent).not.toHaveBeenCalled();
        expect(mocks.ops.createTransaction).not.toHaveBeenCalled();
        expect(json.reply).toContain("realistis");
        expect(json.reply).toContain("Mau saya bantu jadikan ini goal tabungan?");
    });

    it("creates a goal after budget plan confirmation", async () => {
        const POST = await importPost();
        const response = await POST(mockRequest({
            message: "iya jadiin goal",
            history: [
                { role: "user", content: "bantu gw buat budget untuk beli mac air m4" },
                { role: "assistant", content: "Bisa, rencana ini realistis.\n\n🎯 Target: Rp 18.000.000\n⏳ Deadline: 6 bulan\n💸 Perlu nabung: Rp 3.000.000/bulan\n\nMau saya bantu jadikan ini goal tabungan?" },
            ],
        }));
        const json = await response.json();

        expect(mocks.askFinanceAgent).not.toHaveBeenCalled();
        expect(mocks.ops.createGoal).toHaveBeenCalledWith(1, expect.objectContaining({
            name: "Mac Air M4",
            targetAmount: 18000000,
            icon: "Target",
        }));
        expect(json.goal).toMatchObject({ id: 12, name: "Mac Air M4", targetAmount: 18000000 });
        expect(json.reply).toContain("goal tabungan sudah saya buat");
    });

    it("updates goal progress from chat without calling AI", async () => {
        mocks.ops.getGoals.mockResolvedValueOnce([
            { id: 12, name: "Mac Air M4", targetAmount: 18000000, currentAmount: 0, deadline: new Date("2026-12-31") },
        ]);
        const POST = await importPost();
        const response = await POST(mockRequest({ message: "tambah tabungan mac 500rb", history: [] }));
        const json = await response.json();

        expect(mocks.askFinanceAgent).not.toHaveBeenCalled();
        expect(mocks.ops.updateGoalProgress).toHaveBeenCalledWith(1, 12, 500000);
        expect(json.goal).toMatchObject({ id: 12, name: "Mac Air M4", currentAmount: 500000 });
        expect(json.reply).toContain("progress goal Mac Air M4 sudah saya update");
        expect(json.reply).toContain("Rp 500.000");
    });

    it("undo deletes latest transaction without calling AI", async () => {
        mocks.ops.getTransactions.mockResolvedValueOnce([
            { id: 77, amount: 3000, description: "krl", categoryId: 2, date: new Date(), type: "expense" },
        ]);
        const POST = await importPost();
        const response = await POST(mockRequest({ message: "undo", history: [] }));
        const json = await response.json();

        expect(mocks.askFinanceAgent).not.toHaveBeenCalled();
        expect(mocks.ops.deleteTransaction).toHaveBeenCalledWith(1, 77);
        expect(json.reply).toContain("sudah saya undo");
    });

    it("undo button deletes the requested transaction id", async () => {
        mocks.ops.getTransactionById.mockResolvedValueOnce({
            id: 99,
            amount: 20000,
            description: "makan pagi",
            categoryId: 1,
            date: new Date(),
            type: "expense",
        });
        const POST = await importPost();
        const response = await POST(mockRequest({ undoTransactionId: 99 }));
        const json = await response.json();

        expect(mocks.askFinanceAgent).not.toHaveBeenCalled();
        expect(mocks.ops.getTransactions).not.toHaveBeenCalled();
        expect(mocks.ops.deleteTransaction).toHaveBeenCalledWith(1, 99);
        expect(json.undoneTransactionId).toBe(99);
        expect(json.reply).toContain("sudah saya undo");
    });

    it("returns friendly fallback when AI throws", async () => {
        mocks.askFinanceAgent.mockRejectedValue(new Error("provider down"));
        const POST = await importPost();
        const response = await POST(mockRequest({ message: "halo", history: [] }));
        const json = await response.json();

        expect(mocks.askFinanceAgent).toHaveBeenCalled();
        expect(json.reply).toContain("AI lagi lambat");
    });
});
