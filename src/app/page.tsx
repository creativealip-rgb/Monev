import Link from "next/link";
import { ArrowRight, Wallet, TrendingUp, PiggyBank, PieChart, Receipt, Sparkles, Shield, Bot, MessageCircle } from "lucide-react";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
            {/* Hero Section */}
            <div className="max-w-6xl mx-auto px-4 py-16">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        Monev Finance App
                    </div>
                    <h1 className="text-5xl font-bold text-gray-900 mb-6">
                        Kelola Keuanganmu
                        <br />
                        <span className="text-emerald-600">Dengan Mudah</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                        Catat pemasukan dan pengeluaran, atur budget, dan capai goals finansialmu dengan bantuan AI Assistant.
                    </p>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                        >
                            <Wallet className="w-5 h-5" />
                            Buka Dashboard
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/transactions"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                        >
                            <Receipt className="w-5 h-5" />
                            Catat Transaksi
                        </Link>
                    </div>
                </div>

                {/* Telegram Bot Banner */}
                <div className="max-w-2xl mx-auto mb-16">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-7 h-7" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg mb-1">Telegram Bot Tersedia! 🤖</h3>
                                <p className="text-blue-100 text-sm mb-3">
                                    Catat transaksi langsung dari Telegram. Cukup kirim pesan seperti "50000 makan siang"
                                </p>
                                <Link 
                                    href="/settings" 
                                    className="inline-flex items-center gap-1 text-sm font-medium text-white hover:text-blue-100"
                                >
                                    Setup Bot Sekarang
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div id="features" className="grid md:grid-cols-3 gap-8 mb-16">
                    <FeatureCard
                        icon={Receipt}
                        title="Catat Transaksi"
                        description="Catat pemasukan dan pengeluaran dengan cepat via web atau Telegram bot."
                        href="/transactions"
                    />
                    <FeatureCard
                        icon={PieChart}
                        title="Analisis Keuangan"
                        description="Visualisasi pengeluaran by kategori dan analisis cashflow bulanan."
                        href="/analytics"
                    />
                    <FeatureCard
                        icon={Wallet}
                        title="Budget Management"
                        description="Atur budget bulanan per kategori dan pantau penggunaannya."
                        href="/budgets"
                    />
                    <FeatureCard
                        icon={PiggyBank}
                        title="Goals Tabungan"
                        description="Tetapkan dan tracking progress goals finansialmu."
                        href="/budgets"
                    />
                    <FeatureCard
                        icon={MessageCircle}
                        title="Telegram Bot"
                        description="Input transaksi cepat via bot Telegram dengan smart categorization."
                        href="/settings"
                    />
                    <FeatureCard
                        icon={Shield}
                        title="Aman & Private"
                        description="Data keuanganmu tersimpan aman. Pilih SQLite local atau Supabase cloud."
                        href="#"
                    />
                </div>

                {/* Stats Section */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 mb-16">
                    <h2 className="text-2xl font-bold text-center mb-8">Kenapa Monev?</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <StatItem value="100%" label="Gratis" />
                        <StatItem value="AI" label="Powered" />
                        <StatItem value="Telegram" label="Bot Ready" />
                        <StatItem value="24/7" label="Available" />
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-4">Siap mengelola keuangan?</h2>
                    <p className="text-gray-600 mb-8">Mulai catat transaksi pertamamu sekarang</p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                    >
                        <Wallet className="w-5 h-5" />
                        Buka Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({
    icon: Icon,
    title,
    description,
    href,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    href: string;
}) {
    return (
        <Link href={href}>
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg hover:border-emerald-200 transition-all h-full">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-600">{description}</p>
            </div>
        </Link>
    );
}

function StatItem({ value, label }: { value: string; label: string }) {
    return (
        <div className="p-4">
            <p className="text-3xl font-bold text-emerald-600">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
        </div>
    );
}
