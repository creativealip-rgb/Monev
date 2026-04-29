import { describe, expect, it } from "vitest";
import { parseLocalChatIntent } from "./local-intent";

describe("parseLocalChatIntent", () => {
    it("records food expense with rb unit", () => {
        const result = parseLocalChatIntent("makan pagi 20rb");

        expect(result).toMatchObject({
            intent: "record_transaction",
            amount: 20000,
            description: "makan pagi",
            type: "expense",
            preferredCategory: "Makanan",
        });
    });

    it("records transport expense", () => {
        const result = parseLocalChatIntent("krl 3rb");

        expect(result).toMatchObject({
            intent: "record_transaction",
            amount: 3000,
            description: "krl",
            preferredCategory: "Transportasi",
        });
    });

    it("keeps budget request with model number out of transaction parser", () => {
        const result = parseLocalChatIntent("bantu gw buat budget untuk beli mac air m4");

        expect(result.intent).toBe("budget_goal");
        if (result.intent === "budget_goal") {
            expect(result.amount).toBe(0);
            expect(result.reply).toContain("bukan transaksi");
        }
    });

    it("does not treat product model numbers as money", () => {
        const result = parseLocalChatIntent("iphone 15");

        expect(result.intent).toBe("ai");
    });

    it("asks for clearer nominal when a transaction has a tiny bare number", () => {
        const result = parseLocalChatIntent("beli mac air m4");

        expect(result).toMatchObject({
            intent: "ambiguous_transaction",
        });
    });

    it("extracts explicit budget target amount without creating transaction", () => {
        const result = parseLocalChatIntent("buat budget beli laptop 15jt");

        expect(result.intent).toBe("budget_goal");
        if (result.intent === "budget_goal") {
            expect(result.amount).toBe(15000000);
            expect(result.reply).toContain("Rp 15.000.000");
        }
    });

    it("calculates an achievable budget plan", () => {
        const result = parseLocalChatIntent("harga 18jt, 6 bulan, sanggup 3jt per bulan");

        expect(result).toMatchObject({
            intent: "budget_plan",
            targetAmount: 18000000,
            monthlySaving: 3000000,
            months: 6,
            monthlyRequired: 3000000,
            isAchievable: true,
        });
        if (result.intent === "budget_plan") {
            expect(result.reply).toContain("realistis");
        }
    });

    it("calculates budget shortfall", () => {
        const result = parseLocalChatIntent("target 18jt 6 bulan sisihin 2jt/bulan");

        expect(result).toMatchObject({
            intent: "budget_plan",
            targetAmount: 18000000,
            monthlySaving: 2000000,
            months: 6,
            monthlyRequired: 3000000,
            surplusOrShortfall: -1000000,
            isAchievable: false,
        });
    });

    it("detects undo transaction intent", () => {
        expect(parseLocalChatIntent("undo")).toMatchObject({ intent: "undo_transaction" });
        expect(parseLocalChatIntent("hapus transaksi tadi")).toMatchObject({ intent: "undo_transaction" });
    });

    it("records income", () => {
        const result = parseLocalChatIntent("gaji 5jt");

        expect(result).toMatchObject({
            intent: "record_transaction",
            amount: 5000000,
            description: "gaji",
            type: "income",
            preferredCategory: "Pemasukan",
        });
    });

    it("records bill-like expense", () => {
        const result = parseLocalChatIntent("bayar kos 1.5jt");

        expect(result).toMatchObject({
            intent: "record_transaction",
            amount: 1500000,
            description: "bayar kos",
            preferredCategory: "Tagihan",
        });
    });
});
