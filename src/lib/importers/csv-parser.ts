/**
 * CSV Parser Utility for Transaction Imports
 */

export interface CSVRow {
    [key: string]: string;
}

export interface CSVParseResult {
    data: CSVRow[];
    headers: string[];
}

/**
 * Parses a CSV string into an array of objects.
 * Simple implementation that handles quoted values and basic CSV structure.
 */
export const parseCSV = (csv: string): CSVParseResult => {
    const lines = csv.split(/\r?\n/);
    if (lines.length === 0) return { data: [], headers: [] };

    const headers = splitCSVLine(lines[0]);
    const data: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = splitCSVLine(lines[i]);
        const row: CSVRow = {};

        headers.forEach((header, index) => {
            row[header] = values[index] || "";
        });

        data.push(row);
    }

    return { data, headers };
};

/**
 * Splits a CSV line by comma, respecting quoted values.
 */
const splitCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }
    result.push(current.trim());

    // Clean up quotes from result
    return result.map(val => val.replace(/^"|"$/g, ""));
};

/**
 * Maps CSV columns to standard Transaction fields.
 */
export const mapFields = (
    data: CSVRow[],
    mapping: Record<string, string>
) => {
    return data.map(row => {
        const mapped: any = {};
        Object.entries(mapping).forEach(([targetField, csvHeader]) => {
            if (csvHeader) {
                mapped[targetField] = row[csvHeader];
            }
        });
        return mapped;
    });
};
