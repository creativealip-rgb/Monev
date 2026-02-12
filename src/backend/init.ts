import { seedDatabase } from "./db/seed";

let initialized = false;

export async function initializeApp() {
    if (initialized) return;

    console.log("🚀 Initializing Monev Finance App...");

    try {
        // Seed database with initial data if empty
        console.log("📦 Checking database...");
        await seedDatabase();

        initialized = true;
        console.log("✅ Monev Finance App initialized successfully!");
    } catch (error) {
        console.error("❌ Error initializing app:", error);
    }
}
