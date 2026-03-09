import { NextResponse } from "next/server";

export function middleware(request: Request) {
    const { pathname } = new URL(request.url);
    const cookies = request.headers.get("cookie") || "";
    const sessionCookie = cookies
        .split(";")
        .find((c) => c.trim().startsWith("authjs.session-token="))
        ?.split("=")[1];

    const isLoggedIn = !!sessionCookie;

    console.log(`[middleware] Path: ${pathname}, isLoggedIn: ${!!sessionCookie}`);

    // Public paths yang tidak perlu auth
    const isPublicPath =
        pathname === "/" ||
        pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/forgot-password" ||
        pathname.startsWith("/api/auth/") ||
        pathname === "/manifest.json" ||
        pathname === "/icon.svg" ||
        pathname === "/sw.js" ||
        pathname.startsWith("/workbox-") ||
        pathname.startsWith("/_next/") ||
        pathname.endsWith(".png") ||
        pathname.endsWith(".jpg") ||
        pathname.endsWith(".svg") ||
        pathname.endsWith(".ico") ||
        pathname.endsWith(".css") ||
        pathname.endsWith(".js");

    // Handle CORS untuk API routes
    if (pathname.startsWith("/api")) {
        const response = isPublicPath
            ? NextResponse.next()
            : isLoggedIn
                ? NextResponse.next()
                : NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Set CORS headers
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS"
        );
        response.headers.set(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization, x-requested-with"
        );

        if (request.method === "OPTIONS") {
            return new NextResponse(null, {
                status: 204,
                headers: response.headers,
            });
        }

        return response;
    }

    // Redirect logged in users dari login/register ke dashboard
    if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Redirect unauthenticated users ke login
    if (!isLoggedIn && !isPublicPath) {
        console.log(`[middleware] Redirecting unauthenticated user from ${pathname} to /login`);
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)",
    ],
};
