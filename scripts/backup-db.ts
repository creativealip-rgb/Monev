#!/usr/bin/env tsx
/**
 * Database Backup Script
 * 
 * Creates timestamped backups of the SQLite database
 * Usage: npx tsx scripts/backup-db.ts
 * 
 * For automated backups, add to cron or Windows Task Scheduler:
 * - Linux/Mac: 0 2 * * * cd /path/to/project && npx tsx scripts/backup-db.ts
 * - Windows: Use Task Scheduler to run this script daily
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DB_PATH = path.join(PROJECT_ROOT, "sqlite.db");
const BACKUP_DIR = path.join(PROJECT_ROOT, "backups");
const MAX_BACKUPS = 30; // Keep last 30 backups

interface BackupResult {
    success: boolean;
    backupPath?: string;
    error?: string;
    size?: number;
}

function ensureBackupDir(): void {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        console.log(`✅ Created backup directory: ${BACKUP_DIR}`);
    }
}

function getBackupFilename(): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-").split("T")[0];
    const time = now.toTimeString().split(" ")[0].replace(/:/g, "-");
    return `sqlite-${timestamp}_${time}.db`;
}

function cleanOldBackups(): void {
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.startsWith("sqlite-") && file.endsWith(".db"))
        .map(file => ({
            name: file,
            path: path.join(BACKUP_DIR, file),
            time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time); // Sort by newest first

    if (files.length > MAX_BACKUPS) {
        const toDelete = files.slice(MAX_BACKUPS);
        console.log(`🗑️  Cleaning up ${toDelete.length} old backup(s)...`);
        
        for (const file of toDelete) {
            try {
                fs.unlinkSync(file.path);
                console.log(`   Deleted: ${file.name}`);
            } catch (error) {
                console.error(`   Failed to delete ${file.name}:`, error);
            }
        }
    }
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

function backupDatabase(): BackupResult {
    try {
        // Check if database exists
        if (!fs.existsSync(DB_PATH)) {
            return {
                success: false,
                error: `Database not found at: ${DB_PATH}`,
            };
        }

        // Ensure backup directory exists
        ensureBackupDir();

        // Create backup
        const backupFilename = getBackupFilename();
        const backupPath = path.join(BACKUP_DIR, backupFilename);

        console.log(`📦 Creating backup: ${backupFilename}`);
        fs.copyFileSync(DB_PATH, backupPath);

        const stats = fs.statSync(backupPath);
        console.log(`✅ Backup created successfully!`);
        console.log(`   Size: ${formatBytes(stats.size)}`);
        console.log(`   Path: ${backupPath}`);

        // Clean old backups
        cleanOldBackups();

        return {
            success: true,
            backupPath,
            size: stats.size,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            error: errorMessage,
        };
    }
}

function listBackups(): void {
    if (!fs.existsSync(BACKUP_DIR)) {
        console.log("📂 No backups directory found.");
        return;
    }

    const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.startsWith("sqlite-") && file.endsWith(".db"))
        .map(file => {
            const filePath = path.join(BACKUP_DIR, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                size: stats.size,
                date: stats.mtime,
            };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());

    if (files.length === 0) {
        console.log("📂 No backups found.");
        return;
    }

    console.log(`\n📂 Found ${files.length} backup(s):\n`);
    files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name}`);
        console.log(`   Size: ${formatBytes(file.size)}`);
        console.log(`   Date: ${file.date.toLocaleString()}`);
        console.log();
    });
}

// Main execution
function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    console.log("🔧 Monev Database Backup Tool\n");

    if (command === "list" || command === "ls") {
        listBackups();
    } else {
        const result = backupDatabase();
        
        if (!result.success) {
            console.error(`❌ Backup failed: ${result.error}`);
            process.exit(1);
        }

        console.log("\n💡 Tip: Run 'npx tsx scripts/backup-db.ts list' to see all backups");
    }
}

main();
