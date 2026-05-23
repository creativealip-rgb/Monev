import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();
const AUDIENCE = "monev-mobile-handoff";
const ISSUER = "monev.app";

function getSecret() {
    const secret = process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error("Missing BETTER_AUTH_SECRET/AUTH_SECRET/NEXTAUTH_SECRET");
    return encoder.encode(secret);
}

export async function createMobileHandoffToken(userId: string) {
    return new SignJWT({ sub: userId })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setExpirationTime("2m")
        .sign(getSecret());
}

export async function verifyMobileHandoffToken(token: string) {
    const { payload } = await jwtVerify(token, getSecret(), {
        issuer: ISSUER,
        audience: AUDIENCE,
    });
    if (!payload.sub) throw new Error("Missing token subject");
    return payload.sub;
}
