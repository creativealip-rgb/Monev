import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Hash a PIN using bcrypt
 * @param pin - The plain text PIN to hash
 * @returns The hashed PIN
 */
export async function hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, SALT_ROUNDS);
}

/**
 * Verify a PIN against a hashed PIN
 * @param pin - The plain text PIN to verify
 * @param hashedPin - The hashed PIN from database
 * @returns True if PIN matches, false otherwise
 */
export async function verifyPin(pin: string, hashedPin: string | null): Promise<boolean> {
    if (!hashedPin) return false;
    return bcrypt.compare(pin, hashedPin);
}

/**
 * Check if a string is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
 * @param value - The value to check
 * @returns True if the value appears to be a bcrypt hash
 */
export function isHashed(value: string): boolean {
    return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
}
