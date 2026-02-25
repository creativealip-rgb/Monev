"use client";

import { useState, useRef, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { authenticate, signInWithGoogle } from "@/app/actions/auth";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/frontend/lib/utils";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { apiFetch } from "@/frontend/lib/api-client";

interface FormErrors {
    email?: string;
    password?: string;
    general?: string;
}

interface FormData {
    email: string;
    password: string;
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

function LoginButton({ isPending }: { isPending: boolean }) {
    const { pending } = useFormStatus();
    const loading = pending || isPending;

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
                    <span>Logging in...</span>
                </>
            ) : (
                <span>Login</span>
            )}
        </button>
    );
}

function GoogleLoginButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle();
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
            <span>{isLoading ? "Menghubungkan..." : "Lanjutkan dengan Google"}</span>
        </button>
    );
}

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<FormData>({ email: "", password: "" });
    const [errors, setErrors] = useState<FormErrors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [isGuestLoading, setIsGuestLoading] = useState(false);
    const [shake, setShake] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const emailInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus email field on mount
    useEffect(() => {
        emailInputRef.current?.focus();
    }, []);

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateField = (name: keyof FormData, value: string): string | undefined => {
        if (name === "email") {
            if (!value) return "Email is required";
            if (!validateEmail(value)) return "Please enter a valid email address";
        }
        if (name === "password") {
            if (!value) return "Password is required";
        }
        return undefined;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear field-specific error when user types (only after submit)
        if (submitted && errors[name as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleGuestLogin = async () => {
        setIsGuestLoading(true);
        try {
            // Call the guest login API
            const response = await apiFetch("/api/auth/guest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ initialBalance: 0 }),
            });

            const result = await response.json();

            if (result.success && result.credentials) {
                // Sign in with the created credentials
                const submitFormData = new FormData();
                submitFormData.append("email", result.credentials.email);
                submitFormData.append("password", result.credentials.password);

                const authResult = await authenticate(undefined, submitFormData);

                if (!authResult) {
                    // Success - redirect to dashboard
                    router.push("/dashboard");
                } else {
                    console.error("Guest auth failed:", authResult);
                }
            }
        } catch (error) {
            console.error("Guest login error:", error);
        } finally {
            setIsGuestLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitted(true);
        setIsPending(true);

        // Validate all fields
        const newErrors: FormErrors = {};
        const emailError = validateField("email", formData.email);
        const passwordError = validateField("password", formData.password);

        if (emailError) newErrors.email = emailError;
        if (passwordError) newErrors.password = passwordError;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setIsPending(false);
            return;
        }

        setErrors({});

        try {
            // Create FormData for the server action
            const submitFormData = new FormData();
            submitFormData.append("email", formData.email);
            submitFormData.append("password", formData.password);

            const error = await authenticate(undefined, submitFormData);
            if (error) {
                setErrors({ general: error });
                setShake(true);
                setTimeout(() => setShake(false), 500);
            }
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-sky-100/40 to-cyan-50/30 p-4">
            <div
                className={cn(
                    "w-full max-w-md p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white shadow-2xl shadow-sky-900/10",
                    shake && "animate-shake"
                )}
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <Image
                        src="/images/login-illustration.png"
                        alt="Welcome to Monev"
                        width={120}
                        height={120}
                        className="mx-auto mb-4 rounded-2xl"
                        priority
                    />
                    <h1 className="text-2xl font-bold text-gradient mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Sign in to continue to Monev
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email Field */}
                    <div className="space-y-2">
                        <label
                            htmlFor="email"
                            className="block text-sm font-semibold text-slate-700"
                        >
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                ref={emailInputRef}
                                id="email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="you@example.com"
                                autoComplete="email"
                                aria-invalid={errors.email ? "true" : "false"}
                                aria-describedby={errors.email ? "email-error" : undefined}
                                className={cn(
                                    "input-modern pl-11",
                                    submitted && errors.email && "border-red-400 focus:border-red-500 focus:ring-red-500/20",
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
                                placeholder="••••••••"
                                autoComplete="current-password"
                                aria-invalid={errors.password ? "true" : "false"}
                                aria-describedby={errors.password ? "password-error" : undefined}
                                className={cn(
                                    "input-modern pl-11 pr-11",
                                    submitted && errors.password && "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                                )}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:text-sky-600"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p id="password-error" className="text-red-500 text-xs flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                name="remember"
                                className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500/20 cursor-pointer"
                            />
                            <span className="text-slate-600 group-hover:text-slate-800 transition-colors">
                                Remember me
                            </span>
                        </label>
                        <Link
                            href="/forgot-password"
                            className="text-sky-600 hover:text-sky-700 font-medium hover:underline transition-colors"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    {/* General Error */}
                    {errors.general && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-red-700 text-sm">{errors.general}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <LoginButton isPending={isPending} />

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

                    {/* Guest Login */}
                    <div className="pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={handleGuestLogin}
                            disabled={isGuestLoading}
                            className={cn(
                                "w-full text-center text-sm font-medium transition-colors py-2",
                                isGuestLoading ? "text-slate-300" : "text-slate-400 hover:text-sky-600"
                            )}
                        >
                            {isGuestLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Masuk sebagai tamu...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-1">
                                    Coba Tanpa Akun
                                    <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </button>
                        <p className="text-xs text-slate-300 text-center mt-1">
                            Data tersimpan di perangkat
                        </p>
                    </div>

                    {/* Register Link */}
                    <p className="text-center text-sm text-slate-600 pt-2">
                        Don't have an account?{" "}
                        <Link
                            href="/register"
                            className="text-sky-600 hover:text-sky-700 font-semibold hover:underline transition-colors"
                        >
                            Register here
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
