export const PASSWORD_MIN_LENGTH = 8;
export const HAS_UPPERCASE = /[A-Z]/;
export const HAS_DIGIT = /[0-9]/;
export const HAS_SPECIAL = /[^A-Za-z0-9]/;

interface ValidationResult {
    valid: boolean;
    error?: string;
}

export function validatePassword(password: string): ValidationResult {
    if (password.length < PASSWORD_MIN_LENGTH) {
        return {
            valid: false,
            error: `Password minimal ${PASSWORD_MIN_LENGTH} karakter`,
        };
    }
    if (!HAS_UPPERCASE.test(password)) {
        return {
            valid: false,
            error: "Password harus mengandung minimal 1 huruf besar",
        };
    }
    if (!HAS_DIGIT.test(password)) {
        return {
            valid: false,
            error: "Password harus mengandung minimal 1 angka",
        };
    }
    if (!HAS_SPECIAL.test(password)) {
        return {
            valid: false,
            error: "Password harus mengandung minimal 1 karakter spesial",
        };
    }
    return { valid: true };
}
