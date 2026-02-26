/**
 * Central API client for Monev
 * Handles automatic base URL injection for backend separation
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function apiFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
    let url = input.toString();

    // Only prepend if it's a relative API path and we have a base URL AND we are in APK mode
    const isApk = process.env.NEXT_PUBLIC_IS_APK === "true";

    // Debug logging
    if (typeof window !== "undefined") {
        console.log(`[apiFetch] Calling: ${url} (isApk: ${isApk})`);
    }

    if (url.startsWith("/api") && !url.startsWith("http") && API_BASE_URL && isApk) {
        url = `${API_BASE_URL}${url.startsWith("/") ? url : "/" + url}`;
        if (typeof window !== "undefined") console.log(`[apiFetch] Rewritten to production: ${url}`);
    } else if (url.startsWith("/api") && !url.startsWith("http")) {
        // Ensure relative URLs are used as-is in local dev
        if (typeof window !== "undefined") console.log(`[apiFetch] Using local relative path: ${url}`);
    }

    try {
        // Protocol Mismatch Detection (Mixed Content)
        if (typeof window !== "undefined") {
            const isPageHttps = window.location.protocol === "https:";
            const isApiHttp = url.startsWith("http:");

            if (isPageHttps && isApiHttp) {
                console.warn(
                    "⚠️ [apiFetch] PROTOCOL MISMATCH DETECTED:\n" +
                    "Your frontend is on HTTPS but trying to call an HTTP API.\n" +
                    "Browsers will likely block this (Mixed Content).\n" +
                    "Please use an HTTPS API URL or test via http://localhost:3000"
                );
            }
        }

        const fetchUrl = url;
        const response = await fetch(fetchUrl, init);
        return response;
    } catch (error: any) {
        // For development debugging
        if (typeof window !== "undefined") {
            console.error(`[apiFetch] ERROR calling ${url}:`, error);
        }

        console.error(`❌ [apiFetch] FAILED TO FETCH: ${url}`);
        console.error(`Detailed Error: ${error.message}`);

        // Rethrow with more context if it's a type error (often network/CORS/Ad-blocker)
        if (error instanceof TypeError && error.message === "Failed to fetch") {
            const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

            if (isLocal) {
                throw new Error(
                    `Network Error: Gagal menghubungi API di ${url}. ` +
                    `Karena ini di LOCALHOST, ini biasanya disebabkan oleh: \n` +
                    `1. Ad-blocker (uBlock, AdBlock, dll) memblokir kata kunci 'insight' atau 'session'.\n` +
                    `2. Server dev (Next.js) mati atau crash.\n` +
                    `3. Masalah dengan HTTPS/SSL jika Anda menggunakan ngrok.\n\n` +
                    `COBA: Matikan Ad-blocker atau buka di Incognito.`
                );
            } else {
                throw new Error(
                    `Network Error: Gagal menghubungi API di ${url}. ` +
                    `Ini biasanya disebabkan oleh CORS block atau VPS belum mengizinkan koneksi luar. ` +
                    `Pastikan server VPS sudah di-update dengan patch CORS terbaru.`
                );
            }
        }
        throw error;
    }
}
