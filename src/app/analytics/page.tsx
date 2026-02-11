import { ActionFab } from "@/components/ActionFab";
import { BottomNav } from "@/components/BottomNav";
import { ChevronLeft, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";
import { StatsCard } from "@/components/StatsCard";

export default function AnalyticsPage() {
    return (
        <div className="relative min-h-full bg-slate-50">
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="flex items-center gap-3 px-6 py-4">
                    <Link href="/" className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors">
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </Link>
                    <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Statistik</h1>
                </div>
            </header>

            <div className="px-6 pt-6 space-y-7 pb-40">
                <div className="grid grid-cols-1 gap-4">
                    <StatsCard label="Tabungan Bulan Ini" amount={8250000} type="income" trend={15} />
                </div>

                <div className="space-y-4">
                    <h2 className="text-slate-800 text-lg font-extrabold tracking-tight px-1">Alokasi Dana</h2>
                    <div className="grid grid-cols-1 gap-3">
                        <div className="p-4 bg-white rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center">
                                    <TrendingUp size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Kebutuhan</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target: 50%</p>
                                </div>
                            </div>
                            <p className="font-extrabold text-slate-800">42%</p>
                        </div>
                        <div className="p-4 bg-white rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-500 flex items-center justify-center">
                                    <Wallet size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Tabungan</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target: 20%</p>
                                </div>
                            </div>
                            <p className="font-extrabold text-slate-800">25%</p>
                        </div>
                    </div>
                </div>
            </div>

            <ActionFab />
            <BottomNav />
        </div>
    );
}
