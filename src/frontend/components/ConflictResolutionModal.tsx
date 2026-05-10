"use client";

import { AlertTriangle, X } from "lucide-react";

type ConflictResolutionModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export function ConflictResolutionModal({ isOpen, onClose }: ConflictResolutionModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[220] flex items-end justify-center bg-slate-950/50 px-4 pb-6 backdrop-blur-sm sm:items-center sm:pb-0">
            <div className="w-full max-w-md rounded-[2rem] border border-white/20 bg-white p-5 shadow-2xl dark:bg-slate-950">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-slate-900 dark:text-white">Resolusi konflik sync</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Siap untuk konflik data offline berikutnya.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        aria-label="Tutup konflik sinkronisasi"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    Belum ada konflik terbuka. Saat konflik muncul, modal ini akan menampilkan pilihan gunakan versi lokal,
                    gunakan versi server, atau gabungkan data.
                </div>
            </div>
        </div>
    );
}
