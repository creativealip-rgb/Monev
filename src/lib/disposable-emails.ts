/**
 * Daftar domain email disposable/sementara yang diblokir saat registrasi.
 */
const DISPOSABLE_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
    "mailinator.com",
    "guerrillamail.com",
    "tempmail.com",
    "throwaway.email",
    "yopmail.com",
    "temp-mail.org",
    "fakeinbox.com",
    "sharklasers.com",
    "guerrillamailblock.com",
    "grr.la",
    "dispostable.com",
    "maildrop.cc",
    "10minutemail.com",
    "trashmail.com",
    "mohmal.com",
    "mailnesia.com",
    "tempail.com",
    "guerrillamail.info",
    "guerrillamail.net",
    "guerrillamail.de",
    "mailcatch.com",
    "tempr.email",
    "discard.email",
    "mailsac.com",
    "harakirimail.com",
    "getnada.com",
    "tmpmail.net",
    "tmpmail.org",
    "burnermail.io",
    "throwmail.com",
]);

/**
 * Cek apakah email menggunakan domain disposable/sementara.
 * @param email - Alamat email yang akan dicek
 * @returns true jika email menggunakan domain disposable
 */
export function isDisposableEmail(email: string): boolean {
    if (!email || !email.includes("@")) return false;
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return false;
    return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}
