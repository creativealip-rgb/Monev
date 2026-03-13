/**
 * Biometric Authentication Utility
 * Uses WebAuthn API to provide biometric verification (Face ID, Touch ID, Windows Hello)
 */

import { createLogger } from "./logger";

const logger = createLogger("Biometric");

export const isBiometricSupported = async (): Promise<boolean> => {
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
        return false;
    }
    try {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (e) {
        logger.error("Biometric capability check failed", e);
        return false;
    }
};

/**
 * Registers a new biometric credential for the user.
 * In a real-world scenario, the challenge and public key would be handled by the server.
 * Here we implement a simplified version for App Locking purposes.
 */
export const registerBiometric = async (userId: string, userName: string): Promise<boolean> => {
    if (!await isBiometricSupported()) return false;

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userIdBuffer = new TextEncoder().encode(userId);

    const options: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
            name: "Monev App",
            id: window.location.hostname === "localhost" ? "localhost" : window.location.hostname,
        },
        user: {
            id: userIdBuffer,
            name: userName,
            displayName: userName,
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }], // ES256
        authenticatorSelection: {
            userVerification: "required",
            authenticatorAttachment: "platform",
        },
        timeout: 60000,
    };

    try {
        const credential = await navigator.credentials.create({ publicKey: options });
        return !!credential;
    } catch (e) {
        logger.error("Biometric registration failed", e);
        return false;
    }
};

/**
 * Authenticates the user using biometric credentials.
 */
export const authenticateBiometric = async (): Promise<boolean> => {
    if (!await isBiometricSupported()) return false;

    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const options: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: window.location.hostname === "localhost" ? "localhost" : window.location.hostname,
        userVerification: "required",
        timeout: 60000,
    };

    try {
        const assertion = await navigator.credentials.get({ publicKey: options });
        return !!assertion;
    } catch (e) {
        logger.error("Biometric authentication failed", e);
        return false;
    }
};
