import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { FeatureItem } from "@/frontend/components/FeatureItem"; // Reuse if available, or just inline

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
            {/* Navbar */}
            <nav className="px-6 py-6 flex items-center justify-between max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
                    <span className="text-xl font-bold text-slate-900">Monev</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-slate-600 font-medium hover:text-blue-600 transition-colors">
                        Login
                    </Link>
                    <Link href="/register" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto mt-10 mb-20">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6 border border-blue-100">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    New: AI Financial Advisor 2.0
                </div>

                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight mb-6 leading-tight">
                    Master Your Money with <span className="text-blue-600 relative">
                        AI Precision
                        <svg className="absolute w-full h-3 -bottom-1 left-0 text-blue-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                        </svg>
                    </span>
                </h1>

                <p className="text-lg text-slate-500 mb-10 max-w-2xl leading-relaxed">
                    Monev helps you track expenses, manage budgets, and achieve financial goals with the help of an intelligent AI assistant.
                    Stop guessing, start growing.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2">
                        Start for Free
                        <ArrowRight size={20} />
                    </Link>
                    <Link href="#features" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center">
                        View Demo
                    </Link>
                </div>

                {/* Social Proof / Trust */}
                <div className="mt-16 pt-8 border-t border-slate-100 w-full">
                    <p className="text-sm text-slate-400 font-medium mb-4">TRUSTED BY FREELANCERS & FOUNDERS</p>
                    <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale transition-all hover:grayscale-0">
                        {/* Placeholders for logos */}
                        <div className="font-bold text-xl text-slate-400 flex items-center gap-2"><div className="w-6 h-6 bg-slate-200 rounded-full" /> Acme Corp</div>
                        <div className="font-bold text-xl text-slate-400 flex items-center gap-2"><div className="w-6 h-6 bg-slate-200 rounded-full" /> GlobalBank</div>
                        <div className="font-bold text-xl text-slate-400 flex items-center gap-2"><div className="w-6 h-6 bg-slate-200 rounded-full" /> IndieHacker</div>
                    </div>
                </div>
            </main>

            {/* Features (Simple Grid) */}
            <section id="features" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Zap className="text-amber-500" />}
                            title="Instant Tracking"
                            desc="Record transactions via Telegram bot, voice notes, or photo receipts in seconds."
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="text-emerald-500" />}
                            title="Bank-Grade Security"
                            desc="Your data is encrypted and secure. We prioritize your privacy above all else."
                        />
                        <FeatureCard
                            icon={<CheckCircle2 className="text-blue-500" />}
                            title="Smart Budgeting"
                            desc="Set limits and get proactive alerts before you overspend. Stay on track effortlessly."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-100 bg-slate-50">
                &copy; {new Date().getFullYear()} Monev SaaS. All rights reserved.
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 leading-relaxed">{desc}</p>
        </div>
    );
}
