/**
 * Central API client for Monev
 * Handles automatic base URL injection for backend separation
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function apiFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
    let url = input.toString();

    // Only prepend if it's a relative API path and we have a base URL
    if (url.startsWith("/api") && API_BASE_URL) {
        url = `${API_BASE_URL}${url}`;
    }

    return fetch(url, init);
}
