"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useFormStatus } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { resetPassword } from "@/app/actions/auth";

function PasswordStrength({ password }: { password: string }) {
    const getStrength = (pwd: string): number => {
        let strength = 0;
        if (pwd.length >= 6) strength += 1;
        if (pwd.length >= 10) strength += 1;
        if (/[A-Z]/.test(pwd)) strength += 1;
        if (/[0-9]/.test(pwd)) strength += 1;
        if (/[^A-Za-z0-9]/.test(pwd)) strength += 1;
        return strength;
    };

    const strength = getStrength(password);
    const strengthLabels = ["Sangat Lemah", "Lemah", "Sedang", "Bagus", "Kuat", "Sangat Kuat"];
    const strengthColors = [
        "bg-red-500",
        "bg-red-400",
        "bg-yellow-500",
        "bg-yellow-400",
        "bg-emerald-400",
        "bg-emerald-500"
    ];

    if (!password) return null;

    return (
        <div className="mt-2 space-y-1">
            <div className="flex gap-1 h-1">
                {[1, 2, 3, 4, 5].map((level) => (
                    <div
                        key={level}
                        className={cn(
                            "flex-1 rounded-full transition-all duration-300",
                            strength >= level ? strengthColors[strength] : "bg-slate-200"
                        )}
                    />
                ))}
            </div>
            <p className={cn("text-xs font-medium transition-colors", strength >= 3 ? "text-emerald-600" : "text-slate-500")}>
                {strengthLabels[strength]}
            </p>
        </div>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className={cn(
                "w-full btn-primary py-3 mt-2 flex items-center justify-center gap-2",
                pending && "opacity-70 cursor-not-allowed"
            )}
        >
            {pending ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Menyimpan Password...</span>
                </>
            ) : (
                <span>Simpan Password Baru</span>
            )}
        </button>
    );
}

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [errorMsg, setErrorMsg] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg("");

        if (!token) {
            setErrorMsg("Token tidak valid atau tidak ditemukan. Cek kembali link email Anda.");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg("Password dan konfirmasi password tidak cocok.");
            return;
        }

        const formData = new FormData();
        formData.append("token", token);
        formData.append("password", password);
        formData.append("confirmPassword", confirmPassword);

        const result = await resetPassword({}, formData);

        if (result?.success) {
            setIsSuccess(true);
            setTimeout(() => {
                router.push("/login?reset=success");
            }, 3000);
        } else if (result?.error) {
            setErrorMsg(result.error);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Password Berhasil Diubah!</h2>
                <p className="text-slate-600 mb-6 leading-relaxed">
                    Silakan gunakan password baru Anda untuk login. Anda akan dialihkan ke halaman login dalam beberapa detik.
                </p>
                <Link
                    href="/login"
                    className="btn-primary w-full py-3 inline-flex justify-center"
                >
                    Login Sekarang
                </Link>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Link Tidak Valid</h2>
                <p className="text-slate-600 mb-6 leading-relaxed">
                    Token reset password tidak ditemukan di URL. Silakan kembali ke email Anda dan pastikan menyalin seluruh tautan dengan benar.
                </p>
                <Link
                    href="/forgot-password"
                    className="btn-primary w-full py-3 inline-flex justify-center"
                >
                    Minta Link Baru
                </Link>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/30">
                    <Lock className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gradient mb-2">
                    Buat Password Baru
                </h1>
                <p className="text-slate-500 text-sm">
                    Masukkan password baru untuk mengamankan akun Anda
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Password Field */}
                <div className="space-y-2">
                    <label
                        htmlFor="password"
                        className="block text-sm font-semibold text-slate-700"
                    >
                        Password Baru
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="input-modern pl-11 pr-11"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:text-sky-600"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    <PasswordStrength password={password} />
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                    <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-semibold text-slate-700"
                    >
                        Konfirmasi Password Baru
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className={cn(
                                "input-modern pl-11 pr-11",
                                confirmPassword && confirmPassword !== password && "border-red-400 focus:border-red-500 focus:ring-red-500/20",
                                confirmPassword && confirmPassword === password && "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                            )}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:text-sky-600"
                        >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                        {confirmPassword && confirmPassword === password && (
                            <CheckCircle2 className="absolute right-11 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                        )}
                    </div>
                </div>

                {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-red-700 text-sm">{errorMsg}</p>
                    </div>
                )}

                <SubmitButton />

                <Link
                    href="/login"
                    className={cn(
                        "btn-secondary w-full py-3 flex items-center justify-center gap-2",
                        "hover:bg-slate-50 transition-colors mt-4"
                    )}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Login
                </Link>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-sky-100/40 to-cyan-50/30 p-4">
            <div className="w-full max-w-md p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white shadow-2xl shadow-sky-900/10">
                <Suspense fallback={<div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-500" /><p className="mt-4 text-slate-500">Memuat...</p></div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
