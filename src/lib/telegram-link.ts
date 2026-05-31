import { createHmac } from "crypto";

const LINK_PREFIX = "l";

function getLinkSecret() {
    return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "monev-dev-secret";
}

export function signTelegramLinkUserId(userId: string) {
    return createHmac("sha256", getLinkSecret()).update(userId).digest("hex").slice(0, 16);
}

export function createTelegramStartPayload(userId: string) {
    return `${LINK_PREFIX}_${userId}_${signTelegramLinkUserId(userId)}`;
}

export function parseTelegramStartPayload(payload: string) {
    const [prefix, userId, signature] = payload.split("_");

    if (prefix !== LINK_PREFIX || !userId || !signature) {
        return null;
    }

    if (signature !== signTelegramLinkUserId(userId)) {
        return null;
    }

    const parsedUserId = Number(userId);
    return Number.isInteger(parsedUserId) && parsedUserId > 0 ? parsedUserId : null;
}
