/**
 * Central API client for Monev
 * Handles automatic base URL injection for backend separation
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function apiFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
    let url = input.toString();

    // Only prepend if it's a relative API path and we have a base URL
    if (url.startsWith("/api") && API_BASE_URL) {
        url = `${API_BASE_URL}${url.startsWith("/") ? url : "/" + url}`;
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

        const response = await fetch(url, init);
        return response;
    } catch (error: any) {
        console.error(`❌ [apiFetch] FAILED TO FETCH: ${url}`);
        console.error(`Detailed Error: ${error.message}`);

        // Rethrow with more context if it's a type error (often network/CORS)
        if (error instanceof TypeError && error.message === "Failed to fetch") {
            throw new Error(
                `Network Error: Gagal menghubungi API di ${url}. ` +
                `Ini biasanya disebabkan oleh CORS block atau VPS belum mengizinkan koneksi luar. ` +
                `Pastikan server VPS sudah di-update dengan patch CORS terbaru.`
            );
        }
        throw error;
    }
}
