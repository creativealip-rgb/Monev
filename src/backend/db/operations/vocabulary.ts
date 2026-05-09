import { eq, and } from "drizzle-orm";
import { userVocabulary, categories } from "../schema";
import type { getDb } from "../index";

type Database = ReturnType<typeof getDb>;

export async function getUserVocabulary(db: Database, userId: number) {
    return db
        .select({
            id: userVocabulary.id,
            word: userVocabulary.word,
            type: userVocabulary.type,
            categoryId: userVocabulary.categoryId,
            categoryName: categories.name,
            createdAt: userVocabulary.createdAt,
        })
        .from(userVocabulary)
        .leftJoin(categories, eq(userVocabulary.categoryId, categories.id))
        .where(eq(userVocabulary.userId, userId));
}

export async function addVocabulary(db: Database, userId: number, word: string, type: "income" | "expense", categoryId?: number) {
    return db.insert(userVocabulary).values({
        userId,
        word: word.toLowerCase().trim(),
        type,
        categoryId: categoryId || null,
        createdAt: new Date(),
    });
}

export async function deleteVocabulary(db: Database, id: number, userId: number) {
    return db.delete(userVocabulary).where(
        and(eq(userVocabulary.id, id), eq(userVocabulary.userId, userId))
    );
}
