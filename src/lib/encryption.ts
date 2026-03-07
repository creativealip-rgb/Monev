/**
 * Client-Side Encryption Utility
 * Provides AES-GCM encryption/decryption using the Web Crypto API.
 */

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;

/**
 * Derives an encryption key from a user-provided seed (like a PIN or password).
 * This is crucial for local data protection.
 */
export const deriveKeyFromSeed = async (seed: string, salt: string): Promise<CryptoKey> => {
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(seed),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encoder.encode(salt),
            iterations: 100000,
            hash: "SHA-256",
        },
        baseKey,
        { name: ALGORITHM, length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
};

/**
 * Encrypts a string using a CryptoKey.
 * Returns a base64 encoded string containing the IV and the ciphertext.
 */
export const encryptString = async (text: string, key: CryptoKey): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    const encryptedData = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        key,
        data
    );

    // Concatenate IV and Encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
};

/**
 * Decrypts a base64 encoded string.
 */
export const decryptString = async (base64Data: string, key: CryptoKey): Promise<string> => {
    const combined = new Uint8Array(
        atob(base64Data)
            .split("")
            .map((char) => char.charCodeAt(0))
    );

    const iv = combined.slice(0, IV_LENGTH);
    const encryptedData = combined.slice(IV_LENGTH);

    try {
        const decryptedData = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv },
            key,
            encryptedData
        );

        return new TextDecoder().decode(decryptedData);
    } catch (e) {
        console.error("Decryption failed", e);
        throw new Error("Invalid key or corrupted data");
    }
};

// Aliases for legacy component support
export const encryptData = encryptString;
export const decryptData = decryptString;
