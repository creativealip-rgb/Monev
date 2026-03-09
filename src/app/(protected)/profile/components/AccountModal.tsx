"use client";

import { useState } from "react";
import { X, Check, User as UserIcon, Download, MessageCircle, Key, Crown, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { useToast } from "@/frontend/components/UI";
import { useI18n } from "@/frontend/lib/i18n-context";
import { UserTier, canUseTelegram } from "@/lib/tier-gate";

interface AccountModalProps {
    user: any;
    formData: any;
    setFormData: (data: any) => void;
    onClose: () => void;
    onSave: () => void;
}

export function AccountModal({ user, formData, setFormData, onClose, onSave }: AccountModalProps) {
    const toast = useToast();
    const { t } = useI18n();

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Depan</label>
                <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                    placeholder="Nama Depan"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Belakang</label>
                <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                    placeholder="Nama Belakang"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
                <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400">@</span>
                    <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, username: e.target.value }))}
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                        placeholder="username"
                    />
                </div>
            </div>
            <div className="flex flex-col items-center gap-4 py-4">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-[2rem] bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
                        {formData.image ? (
                            <img
                                src={typeof formData.image === 'string' ? formData.image : URL.createObjectURL(formData.image)}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <UserIcon size={32} className="text-slate-400" />
                        )}
                    </div>
                    <label className="absolute inset-x-0 bottom-0 bg-slate-900/60 backdrop-blur-sm text-white text-[10px] py-1 text-center font-bold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                        GANTI FOTO
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setFormData((prev: any) => ({ ...prev, image: file }));
                                }
                            }}
                        />
                    </label>
                </div>
                <p className="text-[10px] text-slate-400 italic">Pilih file foto terbaikmu (maks. 2MB)</p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Preferensi Regional</p>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mata Uang</label>
                        <select
                            value={typeof window !== "undefined" ? (localStorage.getItem("monev_currency") || "IDR") : "IDR"}
                            onChange={(e) => {
                                localStorage.setItem("monev_currency", e.target.value);
                                window.dispatchEvent(new Event("storage"));
                                toast.success("✓", `Mata uang diubah ke ${e.target.value}`);
                            }}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="IDR">🇮🇩 IDR</option>
                            <option value="USD">🇺🇸 USD</option>
                            <option value="EUR">🇪🇺 EUR</option>
                            <option value="SGD">🇸🇬 SGD</option>
                            <option value="MYR">🇲🇾 MYR</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Bahasa</label>
                        <select
                            value={typeof window !== "undefined" ? (localStorage.getItem("monev_language") || "id") : "id"}
                            onChange={(e) => {
                                localStorage.setItem("monev_language", e.target.value);
                                window.dispatchEvent(new Event("storage"));
                                toast.success("✓", `Bahasa diubah ke ${e.target.value === "id" ? "Indonesia" : "English"}`);
                            }}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="id">🇮🇩 Indonesia</option>
                            <option value="en">🇬🇧 English</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Backup Data</p>
                        <p className="text-[10px] text-slate-500 font-medium">Ekspor seluruh riwayat transaksi ke CSV</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            const a = document.createElement("a");
                            a.href = "/api/transactions/export/csv";
                            a.download = "monev_full_backup.csv";
                            a.click();
                        }}
                        className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center gap-2"
                    >
                        <Download size={14} />
                        Download CSV
                    </motion.button>
                </div>
            </div>

            <button
                onClick={onSave}
                className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-[1rem] transition-colors flex items-center justify-center gap-2 mt-4"
            >
                <Check size={18} />
                Simpan Perubahan
            </button>
        </div>
    );
}
