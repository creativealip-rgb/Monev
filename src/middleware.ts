import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth((req: NextRequest & { auth: any }) => {
    const { pathname } = req.nextUrl;

    // Handle CORS for API routes
    if (pathname.startsWith('/api')) {
        const response = NextResponse.next();

        // Add CORS headers
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with');

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            return new NextResponse(null, { status: 204, headers: response.headers });
        }

        return response;
    }

    return NextResponse.next();
});

export const config = {
    // Include /api in the matcher to handle CORS
    matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)'],
};
