import { ActionFab } from "@/components/ActionFab";
import { StatsCard } from "@/components/StatsCard";
import { FeatureItem } from "@/components/FeatureItem";
import { TransactionItem } from "@/components/TransactionItem";
import { Transaction } from "@/types";
import { Sparkles, Camera, Mic, ShieldAlert, Moon, Star, Bell, Search, User } from "lucide-react";

const mainFeatures = [
    { label: "AI Planner", icon: <Sparkles className="text-blue-500" size={28} /> },
    { label: "Scan Struk", icon: <Camera className="text-emerald-500" size={28} /> },
    { label: "Voice Note", icon: <Mic className="text-blue-400" size={28} /> },
    { label: "Goal Defender", icon: <ShieldAlert className="text-rose-500" size={28} /> },
    { label: "Rekap Malam", icon: <Moon className="text-indigo-600" size={28} /> },
    { label: "Expert Tier", icon: <Star className="text-yellow-500" size={28} /> },
];

const stats = {
    balance: 15450000,
    income: 12500000,
    expense: 4250000,
};

const recentTransactions: Transaction[] = [
    { id: '1', amount: 25000, description: 'Es Kopi Susu', category: 'Food', type: 'expense', created_at: new Date().toISOString(), is_verified: true },
    { id: '2', amount: 150000, description: 'Netflix Premium', category: 'Utilities', type: 'expense', created_at: new Date().toISOString(), is_verified: true },
    { id: '3', amount: 45000, description: 'Grab Ride', category: 'Transport', type: 'expense', created_at: new Date(Date.now() - 172800000).toISOString(), is_verified: true },
];

export default function Home() {
    return (
        <div className="relative min-h-screen pb-24">
            {/* Header Section - Clean & Minimal */}
            <header className="px-6 pt-12 pb-2">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                            <User size={20} className="text-slate-400" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Selamat Sore,</p>
                            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Alip</h1>
                        </div>
                    </div>
                    <button className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all">
                        <Bell size={20} />
                    </button>
                </div>

                {/* Net Worth Card - Focus */}
                <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl shadow-slate-900/10">
                    <div className="relative z-10">
                        <p className="text-slate-400 text-xs font-medium mb-1">Total Balance</p>
                        <h2 className="text-3xl font-bold tracking-tight mb-6">Rp 15.450.000</h2>

                        <div className="flex gap-4">
                            <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                <p className="text-emerald-400 text-[10px] font-bold uppercase mb-1">Income</p>
                                <p className="font-semibold text-sm">+ Rp 12.5jt</p>
                            </div>
                            <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                <p className="text-rose-400 text-[10px] font-bold uppercase mb-1">Expense</p>
                                <p className="font-semibold text-sm">- Rp 4.2jt</p>
                            </div>
                        </div>
                    </div>

                    {/* Decorative */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl -ml-6 -mb-6" />
                </div>
            </header>

            {/* Featured Features Section */}
            <section className="px-6 py-8">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-bold text-slate-900">Fitur Andalan</h2>
                </div>
                <div className="grid grid-cols-3 gap-y-6 gap-x-4">
                    {mainFeatures.map((feature, i) => (
                        <FeatureItem key={i} label={feature.label} icon={feature.icon} />
                    ))}
                </div>
            </section>

            {/* History Section */}
            <section className="px-6 pt-2">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-900">Riwayat Terbaru</h2>
                    <button className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">Lihat Semua</button>
                </div>

                <div className="space-y-3">
                    {recentTransactions.map((t) => (
                        <TransactionItem key={t.id} transaction={t} />
                    ))}
                </div>
            </section>

            <ActionFab />

        </div>
    );
}
