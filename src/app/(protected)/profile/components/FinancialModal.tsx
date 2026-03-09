"use client";

import { Check } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { useSecurity } from "@/components/SecurityProvider";

interface FinancialModalProps {
    formData: any;
    setFormData: (data: any) => void;
    goals: any[];
    onClose: () => void;
    onSave: () => void;
}

export function FinancialModal({ formData, setFormData, goals, onClose, onSave }: FinancialModalProps) {
    const { isStealthMode, toggleStealth } = useSecurity();

    const handleSave = () => {
        onSave();
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gaji Per Jam (Hourly Rate)</label>
                <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500">Rp</span>
                    <input
                        type="number"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, hourlyRate: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        placeholder="Contoh: 50000"
                    />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Digunakan untuk menghitung "Waktu Kerja vs Pengeluaran".</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Utama (Primary Goal)</label>
                <select
                    value={formData.primaryGoalId}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, primaryGoalId: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                >
                    <option value="">-- Pilih Goal Utama --</option>
                    {goals.map(goal => (
                        <option key={goal.id} value={goal.id}>{goal.name}</option>
                    ))}
                </select>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">Sembunyikan Saldo</span>
                <button
                    onClick={toggleStealth}
                    className={cn(
                        "relative w-12 h-6 rounded-full transition-colors duration-200",
                        isStealthMode ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                    )}
                >
                    <div
                        className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
                            isStealthMode ? "translate-x-6" : "translate-x-0.5"
                        )}
                    />
                </button>
            </div>
            <button
                onClick={handleSave}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
            >
                <Check size={18} />
                Simpan Pengaturan
            </button>
        </div>
    );
}
