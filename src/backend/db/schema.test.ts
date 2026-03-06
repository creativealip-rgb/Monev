import { describe, it, expect } from "vitest";
import {
    users,
    transactions,
    categories,
    goals,
    bills,
    investments,
    budgets,
} from "@/backend/db/schema";

describe("Database Schema", () => {
    describe("users table", () => {
        it("has required fields", () => {
            expect(users.id).toBeDefined();
            expect(users.email).toBeDefined();
            expect(users.name).toBeDefined();
            expect(users.createdAt).toBeDefined();
        });

        it("has tier enum field", () => {
            expect(users.tier).toBeDefined();
        });

        it("has boolean fields for admin and active status", () => {
            expect(users.isAdmin).toBeDefined();
            expect(users.isActive).toBeDefined();
        });
    });

    describe("transactions table", () => {
        it("has required fields", () => {
            expect(transactions.id).toBeDefined();
            expect(transactions.userId).toBeDefined();
            expect(transactions.amount).toBeDefined();
            expect(transactions.description).toBeDefined();
            expect(transactions.type).toBeDefined();
            expect(transactions.date).toBeDefined();
        });

        it("has optional fields", () => {
            expect(transactions.categoryId).toBeDefined();
            expect(transactions.merchantName).toBeDefined();
            expect(transactions.paymentMethod).toBeDefined();
        });

        it("has verification fields", () => {
            expect(transactions.isVerified).toBeDefined();
            expect(transactions.isRecurring).toBeDefined();
        });
    });

    describe("categories table", () => {
        it("has required fields", () => {
            expect(categories.id).toBeDefined();
            expect(categories.name).toBeDefined();
            expect(categories.type).toBeDefined();
            expect(categories.color).toBeDefined();
            expect(categories.icon).toBeDefined();
        });

        it("has user relationship", () => {
            expect(categories.userId).toBeDefined();
        });
    });

    describe("goals table", () => {
        it("has required fields", () => {
            expect(goals.id).toBeDefined();
            expect(goals.userId).toBeDefined();
            expect(goals.name).toBeDefined();
            expect(goals.targetAmount).toBeDefined();
            expect(goals.currentAmount).toBeDefined();
        });

        it("has optional deadline", () => {
            expect(goals.deadline).toBeDefined();
        });

        it("has visual fields", () => {
            expect(goals.icon).toBeDefined();
            expect(goals.color).toBeDefined();
        });
    });

    describe("bills table", () => {
        it("has required fields", () => {
            expect(bills.id).toBeDefined();
            expect(bills.userId).toBeDefined();
            expect(bills.name).toBeDefined();
            expect(bills.amount).toBeDefined();
            expect(bills.dueDate).toBeDefined();
            expect(bills.frequency).toBeDefined();
        });

        it("has status fields", () => {
            expect(bills.isPaid).toBeDefined();
            expect(bills.isActive).toBeDefined();
        });
    });

    describe("investments table", () => {
        it("has required fields", () => {
            expect(investments.id).toBeDefined();
            expect(investments.userId).toBeDefined();
            expect(investments.name).toBeDefined();
            expect(investments.type).toBeDefined();
            expect(investments.quantity).toBeDefined();
            expect(investments.avgBuyPrice).toBeDefined();
            expect(investments.currentPrice).toBeDefined();
        });

        it("has profit tracking fields", () => {
            expect(investments.totalDividends).toBeDefined();
            expect(investments.realizedProfit).toBeDefined();
        });
    });

    describe("budgets table", () => {
        it("has required fields", () => {
            expect(budgets.id).toBeDefined();
            expect(budgets.userId).toBeDefined();
            expect(budgets.categoryId).toBeDefined();
            expect(budgets.amount).toBeDefined();
            expect(budgets.month).toBeDefined();
            expect(budgets.year).toBeDefined();
        });
    });
});
