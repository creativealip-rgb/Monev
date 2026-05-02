import { getDb } from "../index";
import { categories, transactions, budgets, merchantMappings } from "../schema";
import type { Category } from "../schema";
import { eq, and, sql, or } from "drizzle-orm";

/**
 * Get all categories for a user.
 * Returns global categories (userId IS NULL) + user-specific categories.
 * 
 * @param userId - User ID to fetch categories for. If undefined, returns only global categories.
 * @returns Array of categories accessible to the user
 */
const DEFAULT_CATEGORIES: Array<{
    name: string;
    icon: string;
    color: string;
    type: "expense" | "income";
}> = [
    { name: "Makan & Minuman", icon: "Utensils", color: "#ef4444", type: "expense" },
    { name: "Transportasi", icon: "Car", color: "#f97316", type: "expense" },
    { name: "Tagihan", icon: "Receipt", color: "#6366f1", type: "expense" },
    { name: "Belanja", icon: "ShoppingBag", color: "#ec4899", type: "expense" },
    { name: "Hiburan", icon: "Gamepad2", color: "#8b5cf6", type: "expense" },
    { name: "Kesehatan", icon: "HeartPulse", color: "#22c55e", type: "expense" },
    { name: "Pendidikan", icon: "GraduationCap", color: "#06b6d4", type: "expense" },
    { name: "Tabungan", icon: "PiggyBank", color: "#14b8a6", type: "expense" },
    { name: "Lainnya", icon: "Wallet", color: "#94a3b8", type: "expense" },
    { name: "Gaji", icon: "Banknote", color: "#22c55e", type: "income" },
    { name: "Freelance", icon: "Briefcase", color: "#0ea5e9", type: "income" },
    { name: "Pemasukan Lainnya", icon: "CircleDollarSign", color: "#10b981", type: "income" },
];

function ensureDefaultCategories(userId: number): void {
    const db = getDb();
    const existing = db.select({ name: categories.name, type: categories.type })
        .from(categories)
        .where(or(
            sql`${categories.userId} IS NULL`,
            eq(categories.userId, userId)
        ))
        .all();

    const existingKeys = new Set(existing.map((category) => `${category.type}:${category.name}`));
    const missingDefaults = DEFAULT_CATEGORIES.filter(
        (category) => !existingKeys.has(`${category.type}:${category.name}`)
    );

    if (missingDefaults.length === 0) return;

    db.insert(categories)
        .values(missingDefaults.map((category) => ({ ...category, userId })))
        .run();
}

export async function getCategories(userId?: number): Promise<Category[]> {
    const db = getDb();
    if (!userId) {
        // Return only global categories if no user is specified
        return db.select().from(categories).where(sql`${categories.userId} IS NULL`).all();
    }

    ensureDefaultCategories(userId);

    // Return global categories + user specific categories
    return db.select()
        .from(categories)
        .where(or(
            sql`${categories.userId} IS NULL`,
            eq(categories.userId, userId)
        ))
        .all();
}

/**
 * Get a single category by ID.
 * 
 * @param id - Category ID
 * @returns Category if found, undefined otherwise
 */
export async function getCategoryById(id: number): Promise<Category | undefined> {
    const db = getDb();
    return db.select().from(categories).where(eq(categories.id, id)).get();
}

/**
 * Create a new user-specific category.
 * 
 * @param data - Category creation data
 * @returns Created category
 */
export async function createCategory(data: {
    userId: number;
    name: string;
    icon: string;
    color: string;
    type: "expense" | "income";
}): Promise<Category> {
    const db = getDb();
    return db.insert(categories).values(data).returning().get();
}

/**
 * Delete a category and handle cascading updates.
 * - Sets transactions.categoryId to NULL for affected transactions
 * - Deletes budgets using this category
 * - Prevents deletion of global categories
 * 
 * @param userId - User ID requesting deletion
 * @param id - Category ID to delete
 * 
 * @throws Error if category not found or user lacks permission
 */
export async function deleteCategory(userId: number, id: number): Promise<void> {
    const db = getDb();

    // Safety check: Don't delete global categories (where userId is null)
    const category = await getCategoryById(id);
    if (!category || category.userId !== userId) {
        throw new Error("Category not found or you don't have permission to delete it.");
    }

    // Handle cascading deletions/updates for user data.
    // Set transactions category to null
    await db.update(transactions)
        .set({ categoryId: null })
        .where(and(eq(transactions.categoryId, id), eq(transactions.userId, userId)));

    // Delete budgets using this category
    await db.delete(budgets)
        .where(and(eq(budgets.categoryId, id), eq(budgets.userId, userId)));

    // Delete merchant mappings using this category
    await db.delete(merchantMappings)
        .where(and(eq(merchantMappings.categoryId, id), eq(merchantMappings.userId, userId)));

    // Finally delete the category itself
    await db.delete(categories)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)));
}
