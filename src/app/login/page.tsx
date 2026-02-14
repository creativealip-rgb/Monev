"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { authenticate } from "@/app/actions/auth";
import Link from "next/link";

function LoginButton() {
    const { pending } = useFormStatus();
    return (
        <button
            className="w-full bg-blue-600 text-white rounded-lg py-2 mt-4 hover:bg-blue-700 disabled:opacity-50"
            disabled={pending}
        >
            {pending ? "Logging in..." : "Login"}
        </button>
    );
}

export default function LoginPage() {
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Login to Monev</h1>
                <form action={dispatch}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            required
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            minLength={6}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="••••••••"
                        />
                    </div>

                    {errorMessage && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {errorMessage}
                        </div>
                    )}

                    <LoginButton />

                    <p className="mt-4 text-center text-sm text-gray-600">
                        Don't have an account?{" "}
                        <Link href="/register" className="text-blue-600 hover:underline">
                            Register here
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
