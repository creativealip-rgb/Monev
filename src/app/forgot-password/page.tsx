"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Lock } from "lucide-react";
import { cn } from "@/frontend/lib/utils";

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50/30 to-cyan-50/20 p-4">
            <div className="glass-card w-full max-w-md p-8 rounded-3xl text-center">
                {/* Header */}
                <div className="mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/30">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gradient mb-2">
                        Forgot Password?
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Password reset feature coming soon
                    </p>
                </div>

                {/* Placeholder Content */}
                <div className="space-y-6">
                    <div className="p-6 bg-sky-50/50 rounded-2xl border border-sky-100">
                        <Mail className="w-12 h-12 text-sky-500 mx-auto mb-3" />
                        <p className="text-slate-600 text-sm leading-relaxed">
                            We&apos;re working on implementing a secure password reset system. 
                            Please contact support if you need immediate assistance.
                        </p>
                    </div>

                    {/* Back to Login */}
                    <Link
                        href="/login"
                        className={cn(
                            "btn-secondary w-full py-3 flex items-center justify-center gap-2",
                            "hover:bg-slate-50 transition-colors"
                        )}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
