"use client";

import { Trophy, Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/frontend/lib/utils";

const ALL_BADGES = [
    { type: "first_tx", name: "Pencatat Pemula", description: "Mencatat transaksi pertama kali! 📝", icon: "📝" },
    { type: "streak_3", name: "Semangat 3 Hari", description: "Catat transaksi 3 hari berturut-turut! 🔥", icon: "🔥" },
    { type: "streak_7", name: "Petarung Mingguan", description: "7 hari tanpa putus! Hebat Bos! 🛡️", icon: "🛡️" },
    { type: "streak_30", name: "Legenda Finansial", description: "Sebulan penuh konsistensi! Sultan bangga. 👑", icon: "👑" },
    { type: "first_goal", name: "Pemimpi Cerdas", description: "Membuat target tabungan pertama. 🎯", icon: "🎯" },
    { type: "goal_reached", name: "Sang Pemenang", description: "Berhasil mencapai target tabungan! 🏆", icon: "🏆" },
    { type: "first_invest", name: "Investor Muda", description: "Melakukan investasi pertama kali. 📈", icon: "📈" },
];

interface CollectionModalProps {
    achievements: any[];
    onClose: () => void;
}

export function CollectionModal({ achievements, onClose }: CollectionModalProps) {
    return (
        <div className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-[2rem] p-6 border border-amber-100 dark:border-amber-900/50">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-2xl text-amber-600 dark:text-amber-400 shadow-sm">
                        <Trophy size={28} />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-lg leading-tight">Koleksi Badge</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                            Kumpulkan badge dengan disiplin mencatat transaksi dan menabung!
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {ALL_BADGES.map((badge) => {
                    const isUnlocked = achievements.some(a => a.type === badge.type);
                    return (
                        <div
                            key={badge.type}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                                isUnlocked
                                    ? "bg-white dark:bg-slate-900/50 border-amber-200 dark:border-amber-900/30 shadow-sm"
                                    : "bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800 opacity-60 grayscale"
                            )}
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-slate-100 dark:bg-slate-800",
                                isUnlocked && "bg-amber-100 dark:bg-amber-900/40"
                            )}>
                                {badge.icon}
                            </div>
                            <div className="flex-1">
                                <h5 className="font-bold text-sm text-slate-900 dark:text-white">{badge.name}</h5>
                                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">{badge.description}</p>
                            </div>
                            {isUnlocked ? (
                                <div className="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 p-1.5 rounded-full">
                                    <CheckCircle2 size={16} />
                                </div>
                            ) : (
                                <div className="text-slate-400 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full">
                                    <Lock size={16} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="bg-blue-50 dark:bg-sky-900/20 p-4 rounded-2xl border border-sky-100 dark:border-sky-900/30">
                <h6 className="text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400 mb-2">Tips Sultan 👑</h6>
                <p className="text-[11px] text-sky-700 dark:text-sky-300 font-medium leading-relaxed">
                    Tetap disiplin mencatat setiap pengeluaran dan pemasukan harian untuk mempertahankan streak dan membuka badge langka lainnya!
                </p>
            </div>

            <button
                onClick={onClose}
                className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white font-black rounded-2xl hover:brightness-110 transition-all active:scale-95"
            >
                TUTUP KOLEKSI
            </button>
        </div>
    );
}
