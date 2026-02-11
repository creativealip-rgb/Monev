import { ActionFab } from "@/components/ActionFab";
import { Plus, ShieldAlert, TrendingUp, Wallet } from "lucide-react";

const budgets = [
    { category: "Makanan & Minuman", limit: 3000000, spent: 2150000, color: "bg-orange-500" },
    { category: "Transportasi", limit: 1500000, spent: 800000, color: "bg-blue-500" },
    { category: "Hiburan", limit: 1000000, spent: 950000, color: "bg-purple-500" },
];

const goals = [
    { name: "Macbook Air M3", target: 20000000, saved: 8500000, icon: <Wallet size={20} className="text-emerald-600" /> },
    { name: "Liburan Jepang", target: 35000000, saved: 5000000, icon: <TrendingUp size={20} className="text-blue-600" /> },
];

function formatRp(amount: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export default function BudgetsPage() {
    return (
        <div className="relative min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <header className="px-6 pt-12 pb-6 bg-white border-b border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Budget & Goals</h1>
                    <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors">
                        <Plus size={24} />
                    </button>
                </div>
                <p className="text-sm text-slate-500">Kelola pengeluaran dan impianmu.</p>
            </header>

            <div className="p-6 space-y-8">
                {/* Monthly Budgets */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldAlert size={18} className="text-slate-400" />
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Budget Bulanan</h2>
                    </div>

                    <div className="space-y-4">
                        {budgets.map((b, i) => {
                            const percentage = Math.min((b.spent / b.limit) * 100, 100);
                            const isDanger = percentage > 90;

                            return (
                                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-semibold text-slate-700 text-sm">{b.category}</span>
                                        <span className="font-bold text-slate-900 text-sm">{formatRp(b.spent)}</span>
                                    </div>

                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                                        <div
                                            className={`h-full rounded-full ${isDanger ? 'bg-rose-500' : b.color}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Limit: {formatRp(b.limit)}</span>
                                        <span className={isDanger ? "text-rose-500 font-bold" : ""}>{Math.round(percentage)}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Savings Goals */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={18} className="text-slate-400" />
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Tabungan Impian</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {goals.map((g, i) => (
                            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
                                    {g.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 text-sm">{g.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xs font-semibold text-blue-600">{formatRp(g.saved)}</span>
                                        <span className="text-[10px] text-slate-400">/ {formatRp(g.target)}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(g.saved / g.target) * 100}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <ActionFab />

        </div>
    );
}
