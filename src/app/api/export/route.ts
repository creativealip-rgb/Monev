import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, getRawDb } from "@/backend/db";
import { transactions } from "@/backend/db/schema";
import { eq, desc } from "drizzle-orm";
import { mkdir, readFile, readdir, writeFile } from "fs/promises";
import path from "path";

const BACKUP_TABLES = [
    "categories",
    "accounts",
    "budgets",
    "goals",
    "transactions",
    "debts",
    "bills",
    "investments",
    "recurring_transactions",
    "user_settings",
] as const;

const DELETE_ORDER = [
    "transactions",
    "budgets",
    "goals",
    "debts",
    "bills",
    "investments",
    "recurring_transactions",
    "accounts",
    "categories",
] as const;

function safeIdentifier(identifier: string) {
    if (!/^[a-zA-Z0-9_]+$/.test(identifier)) throw new Error("Invalid table name");
    return identifier;
}

function getBackupDir() {
    return process.env.CLOUD_BACKUP_DIR || path.join(process.cwd(), "data", "cloud-backups");
}

function getBackupPath(userId: number) {
    return path.join(getBackupDir(), `user-${userId}.json`);
}

function tableExists(table: string) {
    const raw = getRawDb();
    const row = raw.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(table);
    return !!row;
}

function getTableColumns(table: string) {
    const raw = getRawDb();
    return raw.prepare(`PRAGMA table_info(${safeIdentifier(table)})`).all() as Array<{ name: string }>;
}

function tableHasUserId(table: string) {
    return getTableColumns(table).some((column) => column.name === "user_id");
}

function getUserRows(table: string, userId: number) {
    if (!tableExists(table) || !tableHasUserId(table)) return [];
    const raw = getRawDb();
    return raw.prepare(`SELECT * FROM ${safeIdentifier(table)} WHERE user_id = ?`).all(userId);
}

function createBackupPayload(userId: number, email?: string | null) {
    const data: Record<string, unknown[]> = {};
    for (const table of BACKUP_TABLES) {
        data[table] = getUserRows(table, userId);
    }

    return {
        version: 1,
        source: "monev-cloud-backup",
        exportDate: new Date().toISOString(),
        user: { id: userId, email },
        data,
    };
}

function normalizeBackupPayload(payload: any) {
    if (!payload || typeof payload !== "object") return null;
    if (payload.data && typeof payload.data === "object") return payload.data as Record<string, unknown[]>;
    return payload as Record<string, unknown[]>;
}

function insertRows(table: string, rows: any[], userId: number, preserveIds: boolean) {
    if (!tableExists(table) || !tableHasUserId(table) || !Array.isArray(rows) || rows.length === 0) return 0;

    const raw = getRawDb();
    const columns = new Set(getTableColumns(table).map((column) => column.name));
    let count = 0;

    for (const row of rows) {
        if (!row || typeof row !== "object") continue;
        const entries = Object.entries(row)
            .filter(([key]) => columns.has(key) && (preserveIds || key !== "id"))
            .map(([key, value]) => [key, key === "user_id" ? userId : value]);

        if (!entries.some(([key]) => key === "user_id")) entries.push(["user_id", userId]);
        if (entries.length === 0) continue;

        const columnNames = entries.map(([key]) => safeIdentifier(String(key)));
        const placeholders = columnNames.map(() => "?").join(", ");
        const values = entries.map(([, value]) => value);

        try {
            raw.prepare(`INSERT OR IGNORE INTO ${safeIdentifier(table)} (${columnNames.join(", ")}) VALUES (${placeholders})`).run(...values);
            count += 1;
        } catch (error) {
            if (!preserveIds && "id" in row) throw error;
            const retryEntries = entries.filter(([key]) => key !== "id");
            const retryColumns = retryEntries.map(([key]) => safeIdentifier(String(key)));
            const retryPlaceholders = retryColumns.map(() => "?").join(", ");
            const retryValues = retryEntries.map(([, value]) => value);
            raw.prepare(`INSERT OR IGNORE INTO ${safeIdentifier(table)} (${retryColumns.join(", ")}) VALUES (${retryPlaceholders})`).run(...retryValues);
            count += 1;
        }
    }

    return count;
}

function restoreBackupData(data: Record<string, unknown[]>, userId: number, mode: "append" | "replace") {
    const raw = getRawDb();
    const restore = raw.transaction(() => {
        if (mode === "replace") {
            for (const table of DELETE_ORDER) {
                if (tableExists(table) && tableHasUserId(table)) {
                    raw.prepare(`DELETE FROM ${safeIdentifier(table)} WHERE user_id = ?`).run(userId);
                }
            }
        }

        let count = 0;
        for (const table of BACKUP_TABLES) {
            count += insertRows(table, Array.isArray(data[table]) ? data[table] as any[] : [], userId, mode === "replace");
        }
        return count;
    });

    return restore();
}

function buildCsv(rows: any[], format: string) {
    const escapeCsv = (str: string | null | undefined) => {
        if (!str) return '""';
        const cleaned = String(str).replace(/"/g, '""');
        return `"${cleaned}"`;
    };

    let headers: string[] = [];
    const csvRows: string[] = [];

    if (format === "bca_csv") {
        headers = ["Tanggal", "Keterangan", "Cabang", "Jumlah", "Tipe", "Saldo"];
        csvRows.push(headers.join(","));
        for (const t of rows) {
            csvRows.push([
                t.date ? new Date(t.date).toLocaleDateString("id-ID") : "",
                escapeCsv(`${t.description} ${t.merchantName || ""}`),
                "0000",
                t.amount,
                t.type === "income" ? "CR" : "DB",
                "0",
            ].join(","));
        }
    } else if (format === "mandiri_csv") {
        headers = ["Tanggal", "Keterangan", "No Reff", "Debet", "Kredit", "Saldo"];
        csvRows.push(headers.join(","));
        for (const t of rows) {
            csvRows.push([
                t.date ? new Date(t.date).toLocaleDateString("id-ID") : "",
                escapeCsv(t.description),
                escapeCsv(String(t.id)),
                t.type === "expense" ? t.amount : "0",
                t.type === "income" ? t.amount : "0",
                "0",
            ].join(","));
        }
    } else {
        headers = ["ID", "Tanggal", "Tipe", "Nominal", "Deskripsi", "Merchant", "Metode Pembayaran", "Biaya Admin"];
        csvRows.push(headers.join(","));
        for (const t of rows) {
            csvRows.push([
                t.id,
                escapeCsv(t.date ? new Date(t.date).toISOString().split("T")[0] : ""),
                escapeCsv(t.type),
                t.amount,
                escapeCsv(t.description),
                escapeCsv(t.merchantName),
                escapeCsv(t.paymentMethod),
                t.fee || 0,
            ].join(","));
        }
    }

    return csvRows.join("\n");
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const format = req.nextUrl.searchParams.get("format") || "json";
    const db = getDb();

    try {
        const userTransactions = await db.select()
            .from(transactions)
            .where(eq(transactions.userId, userId))
            .orderBy(desc(transactions.date))
            .all();

        if (["csv", "bca_csv", "mandiri_csv", "bni_csv"].includes(format)) {
            const csvContent = buildCsv(userTransactions, format);
            const filename = format === "bca_csv" ? "BCA_Statement" : format === "mandiri_csv" ? "Mandiri_Statement" : format === "bni_csv" ? "BNI_Statement" : "monev_transactions";

            return new NextResponse(csvContent, {
                status: 200,
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="${filename}_${new Date().toISOString().split("T")[0]}.csv"`,
                },
            });
        }

        const data = createBackupPayload(userId, session.user.email);
        return new NextResponse(JSON.stringify(data, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="monev_data_export_${new Date().toISOString().split("T")[0]}.json"`,
            },
        });
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ success: false, error: "Gagal memproses export data" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    try {
        let payload: any;
        const contentType = req.headers.get("content-type") || "";
        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            const file = formData.get("file");
            if (!(file instanceof File)) {
                return NextResponse.json({ success: false, error: "File import tidak ditemukan" }, { status: 400 });
            }
            payload = JSON.parse(await file.text());
        } else {
            payload = await req.json();
        }

        const data = normalizeBackupPayload(payload);
        if (!data) {
            return NextResponse.json({ success: false, error: "Data backup tidak valid" }, { status: 400 });
        }

        const count = restoreBackupData(data, userId, "append");
        return NextResponse.json({ success: true, count, message: "Data berhasil diimpor" });
    } catch (error) {
        console.error("Import error:", error);
        return NextResponse.json({ success: false, error: "Gagal mengimpor data" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    try {
        const body = await req.json();
        const action = body?.action;

        await mkdir(getBackupDir(), { recursive: true });

        if (action === "backup") {
            const payload = createBackupPayload(userId, session.user.email);
            await writeFile(getBackupPath(userId), JSON.stringify(payload, null, 2), "utf8");
            return NextResponse.json({ success: true, backupAt: payload.exportDate, message: "Backup cloud berhasil" });
        }

        if (action === "restore") {
            const payload = JSON.parse(await readFile(getBackupPath(userId), "utf8"));
            const data = normalizeBackupPayload(payload);
            if (!data) return NextResponse.json({ success: false, error: "Backup cloud tidak valid" }, { status: 400 });

            const count = restoreBackupData(data, userId, "replace");
            return NextResponse.json({ success: true, count, restoredAt: new Date().toISOString(), message: "Restore cloud berhasil" });
        }

        if (action === "status") {
            const files: string[] = await readdir(getBackupDir()).catch(() => [] as string[]);
            const hasBackup = files.includes(`user-${userId}.json`);
            return NextResponse.json({ success: true, hasBackup });
        }

        return NextResponse.json({ success: false, error: "Action tidak dikenal" }, { status: 400 });
    } catch (error: any) {
        if (error?.code === "ENOENT") {
            return NextResponse.json({ success: false, error: "Belum ada backup cloud untuk akun ini" }, { status: 404 });
        }
        console.error("Cloud backup error:", error);
        return NextResponse.json({ success: false, error: "Gagal memproses cloud backup" }, { status: 500 });
    }
}
