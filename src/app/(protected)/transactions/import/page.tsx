"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/frontend/lib/api-client";
import { useToast } from "@/frontend/components/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Check, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { parseBankCSV } from "@/lib/importer";

export default function ImportPage() {
    const router = useRouter();
    const { success, error } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setLoading(true);

        try {
            const text = await selectedFile.text();
            const data = await parseBankCSV(text);
            setPreview(data);
        } catch (err) {
            console.error("Error parsing file:", err);
            error("Gagal membaca file", "Pastikan format CSV benar");
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (preview.length === 0) return;

        setImporting(true);
        try {
            const res = await apiFetch("/api/transactions/bulk", {
                method: "POST",
                body: JSON.stringify({ transactions: preview }),
            });

            const result = await res.json();
            if (result.success) {
                success("Berhasil!", `${result.stats.imported} transaksi telah diimpor.`);
                router.push("/dashboard");
            } else {
                error("Gagal impor", result.error || "Terjadi kesalahan");
            }
        } catch (err) {
            console.error("Import error:", err);
            error("Gagal!", "Gangguan koneksi sistem");
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="p-6 pb-32">
            <header className="mb-8 mt-12">
                <h1 className="text-2xl font-black text-foreground mb-2">Import Data</h1>
                <p className="text-sm text-muted-foreground">Unggah CSV mutasi bank Bos untuk catat sekaligus.</p>
            </header>

            <div className="space-y-6">
                {!file ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative group h-64 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all"
                    >
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-sky-500 mb-4 group-hover:scale-110 transition-transform">
                            <Upload size={32} />
                        </div>
                        <p className="font-bold text-foreground">Pilih File CSV</p>
                        <p className="text-xs text-muted-foreground mt-1">Format: Tanggal, Deskripsi, Nominal</p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="card-clean p-0 overflow-hidden"
                    >
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                            <div className="flex items-center gap-3">
                                <FileText className="text-sky-500" />
                                <div>
                                    <p className="text-sm font-bold">{file.name}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">{preview.length} Transaksi terdeteksi</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setFile(null); setPreview([]); }}
                                className="text-xs text-rose-500 font-bold hover:underline"
                            >
                                Ganti
                            </button>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {loading ? (
                                <div className="p-12 flex flex-col items-center justify-center">
                                    <Loader2 className="animate-spin text-sky-500 mb-2" size={32} />
                                    <p className="text-sm text-muted-foreground">Menganalisa data...</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                                        <tr>
                                            <th className="p-4 text-[10px] font-black uppercase text-muted-foreground tracking-wider">Tanggal</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-muted-foreground tracking-wider">Keterangan</th>
                                            <th className="p-4 text-[10px] font-black uppercase text-muted-foreground tracking-wider text-right">Nominal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {preview.map((item, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="p-4 text-xs font-medium tabular-nums text-slate-500">
                                                    {new Date(item.date).toLocaleDateString('id-ID')}
                                                </td>
                                                <td className="p-4 text-xs font-bold truncate max-w-[150px]">
                                                    {item.description}
                                                </td>
                                                <td className={`p-4 text-xs font-black text-right tabular-nums ${item.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {item.type === 'income' ? '+' : '-'}{item.amount.toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 flex gap-3">
                            <button
                                onClick={handleImport}
                                disabled={importing || preview.length === 0}
                                className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                            >
                                {importing ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        <span>Proses Impor...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        <span>Konfirmasi & Simpan</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}

                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 flex-shrink-0">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-500 mb-1">Tips Impor</p>
                        <p className="text-[10px] text-amber-700/80 dark:text-amber-500/60 leading-relaxed">
                            Pastikan file CSV memiliki kolom Tanggal, Keterangan, dan Nominal. Asisten AI akan otomatis menentukan kategori yang paling cocok untuk setiap transaksi.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
