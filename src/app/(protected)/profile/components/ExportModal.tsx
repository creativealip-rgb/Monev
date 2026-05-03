"use client";

import { useState, useRef, type PointerEvent, type TouchEvent } from "react";
import { Download, Upload, Cloud, FileJson, FileSpreadsheet, FileText, CheckCircle2, AlertCircle, Loader2, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { useToast } from "@/frontend/components/UI";

interface ExportModalProps {
    onClose: () => void;
}

export function ExportModal({ onClose }: ExportModalProps) {
    const toast = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastTouchTabRef = useRef(0);
    const [activeTab, setActiveTab] = useState<"export" | "import" | "cloud">("export");
    const [isLoading, setIsLoading] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [lastBackup, setLastBackup] = useState<string | null>(null);
    
    // Date range for export
    const [dateRange, setDateRange] = useState<{from: string; to: string}>({
        from: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    const handleExport = (format: string) => {
        const url = `/api/export?format=${format}&from=${dateRange.from}&to=${dateRange.to}`;
        window.open(url, "_blank");
        toast.success("Export", `Export ${format.toUpperCase()} sedang diproses...`);
    };

    const handleImport = async () => {
        if (!importFile) {
            toast.error("Error", "Pilih file terlebih dahulu");
            return;
        }

        toast.info("Import belum aktif", "Untuk sekarang fitur yang sudah siap adalah export data.");
        return;

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", importFile as File);

            const res = await apiFetch("/api/export", {
                method: "POST",
                body: formData
            });

            const result = await res.json();
            if (result.success) {
                toast.success("Berhasil", `Data berhasil diimpor! ${result.count || 0} transaksi ditambahkan.`);
                setImportFile(null);
                onClose();
            } else {
                toast.error("Gagal", result.error || "Gagal mengimpor data");
            }
        } catch {
            toast.error("Gagal", "Terjadi kesalahan saat mengimpor");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloudBackup = async () => {
        toast.info("Cloud backup belum aktif", "Fitur ini masih disiapkan. Pakai export JSON untuk backup manual dulu.");
        return;

        setIsLoading(true);
        try {
            const res = await apiFetch("/api/export", {
                method: "PUT",
                body: JSON.stringify({ action: "backup" }),
                headers: { "Content-Type": "application/json" }
            });

            const result = await res.json();
            if (result.success) {
                setLastBackup(new Date().toLocaleString("id-ID"));
                toast.success("Berhasil", "Backup ke cloud berhasil!");
            } else {
                toast.error("Gagal", result.error || "Gagal backup");
            }
        } catch {
            toast.error("Gagal", "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestoreFromCloud = async () => {
        toast.info("Cloud restore belum aktif", "Restore cloud belum tersedia di versi ini.");
        return;

        if (!confirm("Restore akan menimpa data lokal Anda. Lanjutkan?")) return;

        setIsLoading(true);
        try {
            const res = await apiFetch("/api/export", {
                method: "PUT",
                body: JSON.stringify({ action: "restore" }),
                headers: { "Content-Type": "application/json" }
            });

            const result = await res.json();
            if (result.success) {
                toast.success("Berhasil", "Data berhasil direstore dari cloud!");
                onClose();
            } else {
                toast.error("Gagal", result.error || "Gagal restore");
            }
        } catch {
            toast.error("Gagal", "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTabPointerCapture = (event: PointerEvent<HTMLDivElement> | TouchEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement;
        const tab = target.closest<HTMLElement>("[data-export-tab]")?.dataset.exportTab as typeof activeTab | undefined;
        if (!tab) return;

        const now = Date.now();
        if (now - lastTouchTabRef.current < 250) return;
        lastTouchTabRef.current = now;
        setActiveTab(tab);
    };

    const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab; label: string; icon: any }) => (
        <button
            type="button"
            data-export-tab={id}
            aria-pressed={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={cn(
                "flex-1 min-h-12 touch-manipulation select-none py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
                activeTab === id 
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
        >
            <Icon size={16} />
            {label}
        </button>
    );

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div
                className="flex gap-2"
                onPointerUpCapture={handleTabPointerCapture}
                onTouchEndCapture={handleTabPointerCapture}
            >
                <TabButton id="export" label="Export" icon={Download} />
                <TabButton id="import" label="Import" icon={Upload} />
                <TabButton id="cloud" label="Cloud" icon={Cloud} />
            </div>

            <AnimatePresence mode="wait">
                {/* Export Tab */}
                {activeTab === "export" && (
                    <motion.div
                        key="export"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Date Range Selector */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar size={16} className="text-slate-500" />
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Periode Export</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Dari Tanggal</label>
                                    <input
                                        type="date"
                                        value={dateRange.from}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Sampai Tanggal</label>
                                    <input
                                        type="date"
                                        value={dateRange.to}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                        min={dateRange.from}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={() => setDateRange({
                                        from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
                                        to: new Date().toISOString().split('T')[0]
                                    })}
                                    className="flex-1 py-1.5 text-[10px] font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors"
                                >
                                    Bulan Ini
                                </button>
                                <button
                                    onClick={() => setDateRange({
                                        from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
                                        to: new Date().toISOString().split('T')[0]
                                    })}
                                    className="flex-1 py-1.5 text-[10px] font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors"
                                >
                                    30 Hari
                                </button>
                                <button
                                    onClick={() => setDateRange({
                                        from: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
                                        to: new Date().toISOString().split('T')[0]
                                    })}
                                    className="flex-1 py-1.5 text-[10px] font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors"
                                >
                                    3 Bulan
                                </button>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500">Pilih format export:</p>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => handleExport("json")}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:shadow-md transition-all flex flex-col items-center gap-2 group"
                            >
                                <FileJson size={24} className="text-sky-500" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">JSON</span>
                                <span className="text-[10px] text-slate-400">Full backup</span>
                            </button>
                            <button
                                onClick={() => handleExport("csv")}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center gap-2 group"
                            >
                                <FileSpreadsheet size={24} className="text-emerald-500" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">CSV</span>
                                <span className="text-[10px] text-slate-400">Excel readable</span>
                            </button>
                            <button
                                onClick={() => handleExport("pdf")}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-500 hover:shadow-md transition-all flex flex-col items-center gap-2 group"
                            >
                                <FileText size={24} className="text-rose-500" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">PDF</span>
                                <span className="text-[10px] text-slate-400">Laporan lengkap</span>
                            </button>
                            <button
                                onClick={() => handleExport("bca_csv")}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center gap-2 group"
                            >
                                <span className="text-xl">🏦</span>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">BCA</span>
                                <span className="text-[10px] text-slate-400">Template</span>
                            </button>
                            <button
                                onClick={() => handleExport("mandiri_csv")}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:shadow-md transition-all flex flex-col items-center gap-2 group"
                            >
                                <span className="text-xl">💳</span>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mandiri</span>
                                <span className="text-[10px] text-slate-400">Template</span>
                            </button>
                            <button
                                onClick={() => handleExport("bni_csv")}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-orange-500 hover:shadow-md transition-all flex flex-col items-center gap-2 group"
                            >
                                <span className="text-xl">🏦</span>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">BNI</span>
                                <span className="text-[10px] text-slate-400">Template</span>
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Import Tab */}
                {activeTab === "import" && (
                    <motion.div
                        key="import"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                                importFile 
                                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" 
                                    : "border-slate-300 dark:border-slate-700 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/10"
                            )}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json,.csv"
                                className="hidden"
                                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                            />
                            {importFile ? (
                                <>
                                    <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{importFile.name}</p>
                                    <p className="text-xs text-slate-500">{(importFile.size / 1024).toFixed(1)} KB</p>
                                </>
                            ) : (
                                <>
                                    <Upload size={32} className="text-slate-400 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Klik untuk pilih file</p>
                                    <p className="text-xs text-slate-400">JSON atau CSV</p>
                                </>
                            )}
                        </div>

                        {importFile && (
                            <button
                                onClick={handleImport}
                                disabled={isLoading}
                                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Mengimpor...
                                    </>
                                ) : (
                                    "Import Data"
                                )}
                            </button>
                        )}

                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800 flex gap-2">
                            <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                Import belum aktif di versi ini. Untuk backup aman sekarang, pakai Export JSON dulu.
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Cloud Tab */}
                {activeTab === "cloud" && (
                    <motion.div
                        key="cloud"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4 border border-sky-200 dark:border-sky-800">
                            <div className="flex items-center gap-3 mb-3">
                                <Cloud size={24} className="text-sky-500" />
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white">Backup Cloud</h4>
                                    {lastBackup && (
                                        <p className="text-xs text-slate-500">Backup terakhir: {lastBackup}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <button
                                    onClick={handleCloudBackup}
                                    disabled={isLoading}
                                    className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Cloud size={16} />
                                    )}
                                    Backup ke Cloud
                                </button>
                                
                                <button
                                    onClick={handleRestoreFromCloud}
                                    disabled={isLoading}
                                    className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download size={16} />
                                    Restore dari Cloud
                                </button>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500 text-center">
                            Cloud backup belum aktif. Gunakan Export JSON untuk backup manual sementara.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
