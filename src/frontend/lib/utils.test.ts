import { describe, it, expect } from "vitest";

// Mock localStorage for browser-dependent formatCurrency
const mockLocalStorage = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();

Object.defineProperty(globalThis, "localStorage", { value: mockLocalStorage });
Object.defineProperty(globalThis, "window", { value: globalThis, configurable: true });

// Import AFTER mocking
import { formatCurrency, cn } from "@/frontend/lib/utils";

describe("cn (classname merge)", () => {
    it("merges class names correctly", () => {
        expect(cn("px-2", "py-3")).toBe("px-2 py-3");
    });

    it("handles conditional classes", () => {
        expect(cn("base", false && "hidden", "extra")).toBe("base extra");
    });

    it("handles tailwind conflict resolution", () => {
        const result = cn("px-2", "px-4");
        expect(result).toBe("px-4");
    });
});

describe("formatCurrency", () => {
    it("formats IDR by default", () => {
        mockLocalStorage.clear();
        const result = formatCurrency(50000);
        expect(result).toContain("50");
        // IDR format: Rp 50.000 or similar
        expect(result).toMatch(/Rp|IDR/);
    });

    it("formats USD when set", () => {
        mockLocalStorage.setItem("monev_currency", "USD");
        const result = formatCurrency(100);
        expect(result).toContain("$");
        expect(result).toContain("100");
    });

    it("formats EUR when set", () => {
        mockLocalStorage.setItem("monev_currency", "EUR");
        const result = formatCurrency(250);
        expect(result).toContain("€");
    });

    it("handles zero", () => {
        mockLocalStorage.clear();
        const result = formatCurrency(0);
        expect(result).toContain("0");
    });

    it("handles negative numbers", () => {
        mockLocalStorage.clear();
        const result = formatCurrency(-15000);
        expect(result).toContain("15");
    });

    it("handles large amounts", () => {
        mockLocalStorage.clear();
        const result = formatCurrency(1500000000);
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
    });

    it("falls back to IDR for unknown currency", () => {
        mockLocalStorage.setItem("monev_currency", "INVALID");
        const result = formatCurrency(1000);
        // Should fallback to IDR
        expect(result).toMatch(/Rp|IDR/);
    });
});
