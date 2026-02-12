import { seedDatabase } from "./seed";

async function main() {
    try {
        await seedDatabase();
        console.log("✅ Database initialization complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error initializing database:", error);
        process.exit(1);
    }
}

main();
