"use client";

import { useState, useRef, useEffect } from "react";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/frontend/lib/utils";
import { User, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, MailCheck } from "lucide-react";
import { apiFetch } from "@/frontend/lib/api-client";
import { validatePassword, PASSWORD_MIN_LENGTH, HAS_UPPERCASE, HAS_DIGIT, HAS_SPECIAL } from "@/lib/password-validation";
import { isDisposableEmail } from "@/lib/disposable-emails";

interface FormErrors {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    acceptTerms?: string;
    general?: string;
}

interface FormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
}

function PasswordStrength({ password }: { password: string }) {
    const getStrength = (pwd: string): number => {
        let strength = 0;
        if (pwd.length >= PASSWORD_MIN_LENGTH) strength += 1;
        if (pwd.length >= 12) strength += 1;
        if (HAS_UPPERCASE.test(pwd)) strength += 1;
        if (HAS_DIGIT.test(pwd)) strength += 1;
        if (HAS_SPECIAL.test(pwd)) strength += 1;
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

function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </svg>
    );
}

function RegisterButton({ isPending }: { isPending: boolean }) {
    const loading = isPending;

    return (
        <button
            type="submit"
            disabled={loading}
            className={cn(
                "w-full btn-primary py-3 mt-2 flex items-center justify-center gap-2",
                loading && "opacity-70 cursor-not-allowed"
            )}
        >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Membuat akun...</span>
                </>
            ) : (
                <span>Buat Akun</span>
            )}
        </button>
    );
}

function GoogleLoginButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await signIn("google", { redirectTo: "/dashboard" });
        } catch (error) {
            console.error("Google login error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className={cn(
                "w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 font-medium py-3 px-4 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm",
                isLoading && "opacity-70 cursor-not-allowed"
            )}
        >
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <GoogleIcon className="w-5 h-5" />
            )}
            <span>{isLoading ? "Menghubungkan..." : "Daftar dengan Google"}</span>
        </button>
    );
}

export default function RegisterPage() {
    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        acceptTerms: false,
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [shake, setShake] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus name field on mount
    useEffect(() => {
        nameInputRef.current?.focus();
    }, []);

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateField = (name: keyof FormData, value: string | boolean): string | undefined => {
        if (name === "name") {
            if (!value) return "Nama lengkap wajib diisi";
            if (typeof value === "string" && value.length < 2) return "Nama minimal 2 karakter";
        }
        if (name === "email") {
            if (!value) return "Email wajib diisi";
            if (typeof value === "string" && !validateEmail(value)) return "Format email tidak valid";
            if (typeof value === "string" && isDisposableEmail(value)) return "Email disposable/sementara tidak diperbolehkan";
        }
        if (name === "password") {
            if (!value) return "Password wajib diisi";
            if (typeof value === "string") {
                const pwdCheck = validatePassword(value);
                if (!pwdCheck.valid) return pwdCheck.error;
            }
        }
        if (name === "confirmPassword") {
            if (!value) return "Konfirmasi password wajib diisi";
            if (value !== formData.password) return "Password tidak cocok";
        }
        if (name === "acceptTerms") {
            if (!value) return "Anda harus menyetujui syarat & ketentuan";
        }
        return undefined;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear field-specific error when user types
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }

        // Validate confirm password when password changes
        if (name === "password" && formData.confirmPassword) {
            if (value !== formData.confirmPassword) {
                setErrors((prev) => ({ ...prev, confirmPassword: "Password tidak cocok" }));
            } else {
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const error = validateField(name as keyof FormData, value);
        if (error) {
            setErrors((prev) => ({ ...prev, [name]: error }));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);
        setErrors({});

        // Validate all fields
        const newErrors: FormErrors = {};
        const nameError = validateField("name", formData.name);
        const emailError = validateField("email", formData.email);
        const passwordError = validateField("password", formData.password);
        const confirmPasswordError = validateField("confirmPassword", formData.confirmPassword);

        const termsError = validateField("acceptTerms", formData.acceptTerms);

        if (nameError) newErrors.name = nameError;
        if (emailError) newErrors.email = emailError;
        if (passwordError) newErrors.password = passwordError;
        if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;
        if (termsError) newErrors.acceptTerms = termsError;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setIsPending(false);
            return;
        }

        try {
            const response = await apiFetch("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword
                })
            });

            const result = await response.json();

            if (result.success) {
                setIsSuccess(true);
                return;
            }

            if (result.error) {
                setErrors({ general: result.error });
                setShake(true);
                setTimeout(() => setShake(false), 500);
            }
        } catch {
            setErrors({ general: "Terjadi kesalahan. Silakan coba lagi." });
            setShake(true);
            setTimeout(() => setShake(false), 500);
        } finally {
            setIsPending(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50/30 to-cyan-50/20 p-4">
                <div className="glass-card w-full max-w-md p-8 rounded-3xl text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MailCheck className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-3">Akun Berhasil Dibuat</h2>
                    <p className="text-slate-600 mb-6 leading-relaxed">
                        Akun <span className="font-semibold text-slate-800">{formData.email}</span> sudah siap dipakai.
                        Kalau email verifikasi masuk, Anda tetap bisa membukanya untuk keamanan tambahan.
                    </p>
                    <Link
                        href="/login"
                        className="btn-primary w-full py-3 inline-flex justify-center"
                    >
                        Masuk Sekarang
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-sky-100/40 to-cyan-50/30 px-4 py-6 sm:p-4">
            <div
                className={cn(
                    "w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white shadow-2xl shadow-sky-900/10",
                    shake && "animate-shake"
                )}
            >
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-sky-500/30">
                        <User className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gradient mb-2">
                        Buat Akun Baru
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Daftar untuk mulai mengatur keuanganmu
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    {/* Name Field */}
                    <div className="space-y-2">
                        <label
                            htmlFor="name"
                            className="block text-sm font-semibold text-slate-700"
                        >
                            Nama Lengkap
                        </label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                ref={nameInputRef}
                                id="name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                placeholder="Budi Santoso"
                                autoComplete="name"
                                aria-invalid={errors.name ? "true" : "false"}
                                aria-describedby={errors.name ? "name-error" : undefined}
                                className={cn(
                                    "input-modern pl-11",
                                    errors.name && "border-red-400 focus:border-red-500 focus:ring-red-500/20",
                                    !errors.name && formData.name.length >= 2 && "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                                )}
                            />
                            {!errors.name && formData.name.length >= 2 && (
                                <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                            )}
                        </div>
                        {errors.name && (
                            <p id="name-error" className="text-red-500 text-xs flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Email Field */}
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
                                value={formData.email}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                placeholder="you@example.com"
                                autoComplete="email"
                                aria-invalid={errors.email ? "true" : "false"}
                                aria-describedby={errors.email ? "email-error" : undefined}
                                className={cn(
                                    "input-modern pl-11",
                                    errors.email && "border-red-400 focus:border-red-500 focus:ring-red-500/20",
                                    !errors.email && formData.email && validateEmail(formData.email) && "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                                )}
                            />
                            {!errors.email && formData.email && validateEmail(formData.email) && (
                                <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                            )}
                        </div>
                        {errors.email && (
                            <p id="email-error" className="text-red-500 text-xs flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                        <label
                            htmlFor="password"
                            className="block text-sm font-semibold text-slate-700"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                aria-invalid={errors.password ? "true" : "false"}
                                aria-describedby={errors.password ? "password-error" : undefined}
                                className={cn(
                                    "input-modern pl-11 pr-14",
                                    errors.password && "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                                )}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:text-sky-600"
                                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        <PasswordStrength password={formData.password} />
                        {errors.password && (
                            <p id="password-error" className="text-red-500 text-xs flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-semibold text-slate-700"
                        >
                            Konfirmasi Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                aria-invalid={errors.confirmPassword ? "true" : "false"}
                                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                                className={cn(
                                    "input-modern pl-11 pr-14",
                                    errors.confirmPassword && "border-red-400 focus:border-red-500 focus:ring-red-500/20",
                                    !errors.confirmPassword && formData.confirmPassword && formData.confirmPassword === formData.password && "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                                )}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:text-sky-600"
                                aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                            {!errors.confirmPassword && formData.confirmPassword && formData.confirmPassword === formData.password && (
                                <CheckCircle2 className="absolute right-16 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                            )}
                        </div>
                        {errors.confirmPassword && (
                            <p id="confirmPassword-error" className="text-red-500 text-xs flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.confirmPassword}
                            </p>
                        )}
                    </div>

                    {/* Terms & Conditions */}
                    <div className="space-y-1">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50">
                                <input
                                    type="checkbox"
                                    checked={formData.acceptTerms}
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            acceptTerms: e.target.checked,
                                        }));
                                        if (errors.acceptTerms) {
                                            setErrors((prev) => ({
                                                ...prev,
                                                acceptTerms: undefined,
                                            }));
                                        }
                                    }}
                                    className="h-5 w-5 rounded border-slate-300 text-sky-500 focus:ring-sky-500/20"
                                />
                            </span>
                            <span className="text-xs text-slate-600 leading-relaxed">
                                Saya menyetujui{" "}
                                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-sky-600 font-semibold hover:underline cursor-pointer">
                                    Syarat & Ketentuan
                                </a>{" "}
                                dan{" "}
                                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-sky-600 font-semibold hover:underline cursor-pointer">
                                    Kebijakan Privasi
                                </a>{" "}
                                Monev
                            </span>
                        </label>
                        {errors.acceptTerms && (
                            <p className="text-red-500 text-xs flex items-center gap-1 ml-7">
                                <AlertCircle className="w-3 h-3" />
                                {errors.acceptTerms}
                            </p>
                        )}
                    </div>

                    {/* General Error */}
                    {errors.general && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-red-700 text-sm">{errors.general}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <RegisterButton isPending={isPending} />

                    {/* Divider */}
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white/60 text-slate-500">atau</span>
                        </div>
                    </div>

                    {/* Google Login Button */}
                    <GoogleLoginButton />

                    {/* Login Link */}
                    <p className="text-center text-sm text-slate-600 pt-2">
                        Sudah punya akun?{" "}
                        <Link
                            href="/login"
                            className="text-sky-600 hover:text-sky-700 font-semibold hover:underline transition-colors"
                        >
                            Login di sini
                        </Link>
                    </p>
                </form>
            </div>

            {/* Add shake animation styles */}
            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
}
