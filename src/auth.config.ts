import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isPublic =
                nextUrl.pathname === '/' ||
                nextUrl.pathname === '/login' ||
                nextUrl.pathname === '/register' ||
                nextUrl.pathname === '/manifest.json' ||
                nextUrl.pathname === '/icon.svg' ||
                nextUrl.pathname === '/sw.js' ||
                nextUrl.pathname.startsWith('/workbox-') ||
                nextUrl.pathname.endsWith('.png') ||
                nextUrl.pathname.endsWith('.jpg') ||
                nextUrl.pathname.endsWith('.svg') ||
                nextUrl.pathname.endsWith('.ico');

            if (isPublic) {
                if (isLoggedIn && (nextUrl.pathname === '/' || nextUrl.pathname === '/login' || nextUrl.pathname === '/register')) {
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
                return true;
            }

            // All other routes are protected
            if (!isLoggedIn) {
                return false;
            }

            return true;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
