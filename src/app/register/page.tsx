"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { register } from "@/app/actions/auth";
import Link from "next/link";

const initialState = {
    error: "",
};

function RegisterButton() {
    const { pending } = useFormStatus();
    return (
        <button
            className="w-full bg-blue-600 text-white rounded-lg py-2 mt-4 hover:bg-blue-700 disabled:opacity-50"
            disabled={pending}
        >
            {pending ? "Creating account..." : "Register"}
        </button>
    );
}

export default function RegisterPage() {
    const [state, dispatch, isPending] = useActionState(register, initialState);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Create an Account</h1>
                <form action={dispatch}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="John Doe"
                        />
                    </div>
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

                    {state?.error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {state.error}
                        </div>
                    )}

                    <RegisterButton />

                    <p className="mt-4 text-center text-sm text-gray-600">
                        Already have an account?{" "}
                        <Link href="/login" className="text-blue-600 hover:underline">
                            Login here
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
