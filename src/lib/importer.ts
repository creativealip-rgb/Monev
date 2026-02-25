import { Transaction } from "@/backend/db/schema";
import { getCategories } from "@/backend/db/operations";

export interface ImportResult {
    success: boolean;
    data?: any[];
    error?: string;
    stats?: {
        total: number;
        imported: number;
        failed: number;
    };
}

export async function parseBankCSV(csvText: string): Promise<any[]> {
    // Simple CSV parser for demonstration
    // Expected format: Date, Description, Amount, Type
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const dataRows = lines.slice(1);

    return dataRows.map(row => {
        const values = row.split(',').map(v => v.trim());
        const entry: any = {};
        headers.forEach((header, index) => {
            entry[header] = values[index];
        });

        // Normalize fields
        const dateRaw = entry.date || entry.tanggal;
        const descRaw = entry.description || entry.keterangan || entry.memo;
        const amountRaw = entry.amount || entry.nominal || entry.jumlah;
        const typeRaw = entry.type || (parseFloat(amountRaw) < 0 ? 'expense' : 'income');

        return {
            date: dateRaw ? new Date(dateRaw) : new Date(),
            description: descRaw || "Imported Transaction",
            amount: Math.abs(parseFloat(amountRaw || "0")),
            type: typeRaw.toLowerCase().includes('in') || parseFloat(amountRaw) > 0 ? 'income' : 'expense',
        };
    }).filter(item => !isNaN(item.amount));
}

// Logic for batch AI categorization could go here
