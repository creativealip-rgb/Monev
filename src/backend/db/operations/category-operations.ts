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
export async function getCategories(userId?: number): Promise<Category[]> {
    const db = getDb();
    if (!userId) {
        // Return only global categories if no user is specified
        return db.select().from(categories).where(sql`${categories.userId} IS NULL`).all();
    }

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
