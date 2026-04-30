"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, Loader2, AlertCircle, MailCheck } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";

function SubmitButton({ isLoading }: { isLoading: boolean }) {
    return (
        <button
            type="submit"
            disabled={isLoading}
            className={cn(
                "w-full btn-primary py-3 flex items-center justify-center gap-2",
                isLoading && "opacity-70 cursor-not-allowed"
            )}
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Meneruskan permintaan...</span>
                </>
            ) : (
                <span>Kirim Link Reset</span>
            )}
        </button>
    );
}

export default function ForgotPasswordPage() {
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [emailSent, setEmailSent] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg("");
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;

        if (!email) {
            setErrorMsg("Email wajib diisi");
            setIsLoading(false);
            return;
        }

        try {
            const response = await apiFetch("/api/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email })
            });
            const result = await response.json();

            if (result.success) {
                setEmailSent(email);
                setIsSuccess(true);
            } else {
                setErrorMsg(result.error || "Gagal memproses permintaan");
            }
        } catch (error) {
            setErrorMsg("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-sky-100/40 to-cyan-50/30 p-4">
                <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white shadow-2xl shadow-sky-900/10 text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MailCheck className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-3">Cek Email Anda</h2>
                    <p className="text-slate-600 mb-6 leading-relaxed">
                        Jika email <span className="font-semibold text-slate-800">{emailSent}</span> terdaftar,
                        kami telah mengirimkan link untuk mereset password Anda.
                    </p>
                    <Link
                        href="/login"
                        className="btn-primary w-full py-3 inline-flex justify-center"
                    >
                        Kembali ke Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-sky-100/40 to-cyan-50/30 p-4">
            <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white shadow-2xl shadow-sky-900/10 text-center">
                {/* Header */}
                <div className="mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/30">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gradient mb-2">
                        Lupa Password?
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Masukkan email terdaftar Anda dan kami akan mengirimkan link reset.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 text-left">
                    <div className="space-y-2">
                        <label
                            htmlFor="email"
                            className="block text-sm font-semibold text-slate-700"
                        >
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                className={cn(
                                    "input-modern pl-11",
                                    errorMsg && "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                                )}
                            />
                        </div>
                        {errorMsg && (
                            <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3" />
                                {errorMsg}
                            </p>
                        )}
                    </div>

                    <div className="space-y-4">
                        <SubmitButton isLoading={isLoading} />

                        {/* Back to Login */}
                        <Link
                            href="/login"
                            className={cn(
                                "btn-secondary w-full py-3 flex items-center justify-center gap-2",
                                "hover:bg-slate-50 transition-colors"
                            )}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali ke Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
