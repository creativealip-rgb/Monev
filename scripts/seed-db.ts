import { seedDatabase } from "../src/backend/db/seed.js";

console.log("🌱 Seeding database...");

seedDatabase()
    .then(() => {
        console.log("✅ Database seeded successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    });