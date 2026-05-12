import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PAGE_PREFIXES = [
    "/accounts",
    "/analytics",
    "/bills",
    "/budgets",
    "/chat",
    "/dashboard",
    "/debts",
    "/fitur",
    "/goals",
    "/investments",
    "/onboarding",
    "/profile",
    "/settings",
    "/transactions",
];

const PROTECTED_API_PREFIXES = [
    "/api/accounts",
    "/api/achievements",
    "/api/analytics",
    "/api/bills",
    "/api/budgets",
    "/api/categories",
    "/api/chat",
    "/api/dashboard",
    "/api/debts",
    "/api/export",
    "/api/goals",
    "/api/investments",
    "/api/notifications",
    "/api/onboarding",
    "/api/profile",
    "/api/push",
    "/api/recurring",
    "/api/split-bills",
    "/api/stats",
    "/api/streaks",
    "/api/sync",
    "/api/transactions",
    "/api/user",
];

const SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
};

function hasSessionCookie(req: NextRequest) {
    return Boolean(
        req.cookies.get("next-auth.session-token")
            || req.cookies.get("__Secure-next-auth.session-token")
            || req.cookies.get("authjs.session-token")
            || req.cookies.get("__Secure-authjs.session-token"),
    );
}

function matchesPrefix(pathname: string, prefixes: string[]) {
    return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function withSecurityHeaders(response: NextResponse) {
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    return response;
}

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const isLoggedIn = hasSessionCookie(req);
    const isCronApi = pathname === "/api/cron" || pathname.startsWith("/api/cron/");
    const isProtectedApi = !isCronApi && matchesPrefix(pathname, PROTECTED_API_PREFIXES);
    const isProtectedPage = matchesPrefix(pathname, PROTECTED_PAGE_PREFIXES);

    if (!isLoggedIn && isProtectedApi) {
        return withSecurityHeaders(
            NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
        );
    }

    if (!isLoggedIn && isProtectedPage) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    const isAuthPage = pathname === "/login" || pathname === "/register";
    if (isAuthPage && isLoggedIn) {
        return withSecurityHeaders(NextResponse.redirect(new URL("/dashboard", req.url)));
    }

    return withSecurityHeaders(NextResponse.next());
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico, icon.svg, etc (static assets)
         * - public files (manifest.json, robots.txt, etc)
         * - /api/auth/* (NextAuth routes)
         * - /api/cron/* (server-to-server scheduled jobs)
         */
        "/((?!_next/static|_next/image|favicon|icon|manifest|robots|api/auth|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
};
