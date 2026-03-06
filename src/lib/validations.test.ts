import { describe, it, expect } from "vitest";
import { pinSchema, profileSchema, transactionSchema } from "./validations";

describe("PIN Validation", () => {
    it("accepts valid 6-digit PIN", () => {
        const result = pinSchema.safeParse("123456");
        expect(result.success).toBe(true);
    });

    it("rejects non-numeric PIN", () => {
        const result = pinSchema.safeParse("12345a");
        expect(result.success).toBe(false);
    });

    it("rejects PIN with wrong length", () => {
        const result1 = pinSchema.safeParse("12345");
        const result2 = pinSchema.safeParse("1234567");
        expect(result1.success).toBe(false);
        expect(result2.success).toBe(false);
    });
});

describe("Profile Validation", () => {
    it("accepts valid username", () => {
        const result = profileSchema.safeParse({ username: "john_doe123" });
        expect(result.success).toBe(true);
    });

    it("rejects username with special characters", () => {
        const result = profileSchema.safeParse({ username: "john@doe" });
        expect(result.success).toBe(false);
    });

    it("rejects username that's too short", () => {
        const result = profileSchema.safeParse({ username: "ab" });
        expect(result.success).toBe(false);
    });
});

describe("Transaction Validation", () => {
    it("accepts valid transaction", () => {
        const result = transactionSchema.safeParse({
            amount: 50000,
            description: "Lunch",
            categoryId: 1,
            type: "expense",
        });
        expect(result.success).toBe(true);
    });

    it("rejects negative amount", () => {
        const result = transactionSchema.safeParse({
            amount: -50000,
            description: "Lunch",
            categoryId: 1,
            type: "expense",
        });
        expect(result.success).toBe(false);
    });
});
