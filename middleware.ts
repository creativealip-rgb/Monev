import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Check if user has session token
  const sessionToken = req.cookies.get("next-auth.session-token") || req.cookies.get("__Secure-next-auth.session-token");
  const isLoggedIn = !!sessionToken;

  // Protected routes that require authentication
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/fitur") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/api/transactions") ||
    pathname.startsWith("/api/analytics") ||
    pathname.startsWith("/api/goals") ||
    pathname.startsWith("/api/accounts") ||
    pathname.startsWith("/api/categories") ||
    pathname.startsWith("/api/user");

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  const isAuthPage = pathname === "/login" || pathname === "/register";
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
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
     */
    "/((?!_next/static|_next/image|favicon|icon|manifest|robots|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
