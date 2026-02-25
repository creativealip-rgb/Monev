/**
 * ContextEngine
 * Logic to predict user intent and categories based on temporal and historical context.
 */

export interface ContextData {
    time: Date;
    recentCategories?: string[]; // Most used categories by this user
}

export interface PredictionResult {
    suggestedCategory: string;
    confidence: number;
    reason: string;
}

export function predictCategory(context: ContextData): PredictionResult {
    const hour = context.time.getHours();
    const day = context.time.getDay(); // 0 = Sunday, 6 = Saturday

    // 1. Time-based rules (Heuristics)

    // Lunch time (11 AM - 2 PM)
    if (hour >= 11 && hour <= 14) {
        return {
            suggestedCategory: "Makan & Minuman",
            confidence: 0.8,
            reason: "Jam makan siang"
        };
    }

    // Commute time (7 AM - 9 AM or 5 PM - 7 PM)
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
        return {
            suggestedCategory: "Transportasi",
            confidence: 0.7,
            reason: "Jam berangkat/pulang kerja"
        };
    }

    // Dinner / Evening hangouts (7 PM - 10 PM)
    if (hour >= 19 && hour <= 22) {
        return {
            suggestedCategory: "Hiburan",
            confidence: 0.6,
            reason: "Waktu malam hari"
        };
    }

    // Late night (11 PM - 4 AM)
    if (hour >= 23 || hour <= 4) {
        return {
            suggestedCategory: "Lainnya",
            confidence: 0.5,
            reason: "Waktu istirahat"
        };
    }

    // 2. Weekend specific (Heuristics)
    if (day === 0 || day === 6) {
        if (hour >= 10 && hour <= 18) {
            return {
                suggestedCategory: "Belanja",
                confidence: 0.5,
                reason: "Waktu belanja akhir pekan"
            };
        }
    }

    // 3. Fallback to historical (if available)
    if (context.recentCategories && context.recentCategories.length > 0) {
        return {
            suggestedCategory: context.recentCategories[0],
            confidence: 0.4,
            reason: "Kategori yang paling sering Anda gunakan"
        };
    }

    return {
        suggestedCategory: "Lainnya",
        confidence: 0.1,
        reason: "Default"
    };
}
