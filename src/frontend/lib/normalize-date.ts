export function normalizeDateValue(value: unknown): Date {
    if (value instanceof Date) {
        return new Date(value.getTime());
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        let normalized = value;

        if (Math.abs(normalized) < 1e11) {
            normalized *= 1000;
        } else if (Math.abs(normalized) > 1e14 && Math.abs(normalized) < 1e17) {
            normalized /= 1000;
        } else if (Math.abs(normalized) >= 1e17) {
            normalized /= 1e6;
        }

        return new Date(Math.round(normalized));
    }

    if (typeof value === "string") {
        const numericValue = Number(value);
        if (Number.isFinite(numericValue) && value.trim() !== "") {
            return normalizeDateValue(numericValue);
        }

        return new Date(value);
    }

    return new Date(NaN);
}
