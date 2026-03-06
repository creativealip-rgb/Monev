import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { formatCurrency } from "./utils";

describe("formatCurrency", () => {
    const originalLocalStorage = global.localStorage;

    beforeEach(() => {
        Object.defineProperty(global, "localStorage", {
            value: {
                getItem: () => null,
                setItem: () => {},
            },
            writable: true,
        });
    });

    afterEach(() => {
        global.localStorage = originalLocalStorage;
    });

    it("formats IDR correctly", () => {
        const result = formatCurrency(50000);
        expect(result).toContain("Rp");
        expect(result).toMatch(/Rp\s?50\.000/);
    });

    it("formats zero correctly", () => {
        expect(formatCurrency(0)).toContain("Rp");
        expect(formatCurrency(0)).toContain("0");
    });

    it("formats negative amounts", () => {
        const result = formatCurrency(-25000);
        expect(result).toContain("-");
    });

    it("formats large amounts with proper separators", () => {
        expect(formatCurrency(1000000)).toContain("1.000.000");
    });

    it("formats decimal amounts", () => {
        const result = formatCurrency(15000.5);
        expect(result).toContain("Rp");
    });
});

describe("cn utility", () => {
    it("merges class names", async () => {
        const { cn } = await import("./utils");
        expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles conditional classes", async () => {
        const { cn } = await import("./utils");
        expect(cn("foo", true && "bar", false && "baz")).toBe("foo bar");
    });

    it("deduplicates classes", async () => {
        const { cn } = await import("./utils");
        // Note: cn uses clsx + tailwind-merge, which doesn't deduplicate identical strings
        // It's designed for merging Tailwind classes, not general deduplication
        expect(cn("foo", "foo")).toBe("foo foo");
    });
});
