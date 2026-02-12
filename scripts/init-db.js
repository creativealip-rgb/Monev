const { initBotSaaSDatabase, seedBotSaaSData } = require("./src/backend/db/init-botsaas");

console.log("🚀 Initializing BotSaaS Platform...");

try {
    // Initialize database
    console.log("📦 Setting up database...");
    initBotSaaSDatabase();
    seedBotSaaSData();
    
    console.log("✅ Database initialized successfully!");
    process.exit(0);
} catch (error) {
    console.error("❌ Error initializing:", error);
    process.exit(1);
}
