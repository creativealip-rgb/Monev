"use client";

import { Download } from "lucide-react";
import { useSecurity } from "@/components/SecurityProvider";

interface ExportModalProps {
    onClose: () => void;
}

export function ExportModal({ onClose }: ExportModalProps) {
    const { reauthenticate } = useSecurity();

    const handleExport = async (format: string) => {
        const isVerified = await reauthenticate();
        if (isVerified) {
            window.open(`/api/export?format=${format}`, "_blank");
            onClose();
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-sky-50 dark:bg-sky-900/20 p-5 rounded-3xl border border-sky-100 dark:border-sky-800">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl w-fit shadow-sm text-sky-500 mb-4">
                    <Download size={24} />
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-lg mb-1">Export Data</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Download semua data transaksi dan keuanganmu dengan satu klik.</p>

                <div className="grid grid-cols-2 gap-3 mt-5">
                    <button
                        onClick={() => handleExport("json")}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-all flex flex-col items-center justify-center gap-2 group shadow-sm hover:shadow"
                    >
                        <span className="text-xl group-hover:scale-110 transition-transform">📄</span>
                        <span>Format JSON</span>
                    </button>
                    <button
                        onClick={() => handleExport("csv")}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex flex-col items-center justify-center gap-2 group shadow-sm hover:shadow"
                    >
                        <span className="text-xl group-hover:scale-110 transition-transform">📊</span>
                        <span>Monev CSV</span>
                    </button>
                    <button
                        onClick={() => handleExport("bca_csv")}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex flex-col items-center justify-center gap-2 group shadow-sm hover:shadow"
                    >
                        <span className="text-xl group-hover:scale-110 transition-transform">🏦</span>
                        <span>BCA Template</span>
                    </button>
                    <button
                        onClick={() => handleExport("mandiri_csv")}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all flex flex-col items-center justify-center gap-2 group shadow-sm hover:shadow"
                    >
                        <span className="text-xl group-hover:scale-110 transition-transform">💳</span>
                        <span>Mandiri Template</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
