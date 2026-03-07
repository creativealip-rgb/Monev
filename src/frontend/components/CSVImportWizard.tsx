"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Check, X, ArrowRight, AlertCircle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { parseCSV, CSVRow, mapFields } from "@/lib/importers/csv-parser";
import { apiFetch } from "@/frontend/lib/api-client";
import { useToast } from "./UI";

interface CSVImportWizardProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function CSVImportWizard({ onClose, onSuccess }: CSVImportWizardProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [rawData, setRawData] = useState<CSVRow[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({
        date: "",
        description: "",
        amount: "",
        category: "",
        type: ""
    });
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const toast = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const processFile = async (selectedFile: File) => {
        if (!selectedFile.name.endsWith(".csv")) {
            toast.error("Format Salah", "Harap pilih file CSV.");
            return;
        }

        const content = await selectedFile.text();
        const { data, headers: csvHeaders } = parseCSV(content);

        if (data.length === 0) {
            toast.error("File Kosong", "File CSV tidak berisi data.");
            return;
        }

        setFile(selectedFile);
        setHeaders(csvHeaders);
        setRawData(data);

        // Auto-mapping attempt
        const autoMap: Record<string, string> = { ...mapping };
        csvHeaders.forEach(h => {
            const low = h.toLowerCase();
            if (low.includes("date") || low.includes("tanggal")) autoMap.date = h;
            if (low.includes("desc") || low.includes("ket") || low.includes("note")) autoMap.description = h;
            if (low.includes("amount") || low.includes("jumlah") || low.includes("total") || low.includes("nominal")) autoMap.amount = h;
            if (low.includes("cat") || low.includes("kategori")) autoMap.category = h;
            if (low.includes("type") || low.includes("tipe") || low.includes("jenis")) autoMap.type = h;
        });
        setMapping(autoMap);
        setStep(2);
    };

    const handleMappingChange = (field: string, header: string) => {
        setMapping(prev => ({ ...prev, [field]: header }));
    };

    const handleToPreview = () => {
        // Validate mapping
        if (!mapping.amount || !mapping.description) {
            toast.error("Gagal", "Minimal kolom Amount dan Description harus dipetakan.");
            return;
        }

        const mapped = mapFields(rawData, mapping);
        setPreviewData(mapped);
        setStep(3);
    };

    const handleImport = async () => {
        setIsImporting(true);
        try {
            // Send transactions in bulk
            const response = await apiFetch("/api/transactions/bulk", {
                method: "POST",
                body: JSON.stringify({ transactions: previewData })
            });

            const result = await response.json();
            if (result.success) {
                toast.success("Berhasil", `${previewData.length} transaksi berhasil diimpor!`);
                onSuccess();
                onClose();
            } else {
                toast.error("Gagal", result.error || "Gagal mengimpor data.");
            }
        } catch (error) {
            toast.error("Gagal", "Terjadi kesalahan sistem.");
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden rounded-t-[2rem]">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Import Transaksi</h2>
                    <p className="text-xs text-slate-500 font-medium">Langkah {step} dari 3</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                <AnimatePresence mode="wait">
                    {/* STEP 1: UPLOAD */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex-1 flex flex-col"
                        >
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center p-10 cursor-pointer hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/10 transition-all group"
                            >
                                <div className="w-20 h-20 rounded-3xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                    <Upload size={32} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Pilih File CSV</h3>
                                <p className="text-center text-slate-500 text-sm max-w-[200px]">
                                    Upload file ekspor dari MoneyLover, Mint, atau bank Anda.
                                </p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".csv"
                                    className="hidden"
                                />
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mt-6">
                                <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                                    <AlertCircle size={14} /> Tip
                                </h4>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    Pastikan baris pertama file CSV berisi judul kolom. Kami akan membantu Bos memetakan kolomnya nanti.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: MAPPING */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-4 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-100 dark:border-sky-800">
                                <FileText className="text-sky-500" size={24} />
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{file?.name}</p>
                                    <p className="text-[10px] text-sky-600 font-bold uppercase">{rawData.length} Transaksi</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Petakan Kolom CSV</p>

                                {Object.keys(mapping).map(field => (
                                    <div key={field}>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                            {field === "date" ? "Tanggal" :
                                                field === "description" ? "Keterangan/Note" :
                                                    field === "amount" ? "Nominal (Amount)" :
                                                        field === "category" ? "Kategori" : "Tipe (Income/Expense)"}
                                            {field !== "category" && field !== "type" && <span className="text-rose-500 ml-1">*</span>}
                                        </label>
                                        <select
                                            value={mapping[field]}
                                            onChange={(e) => handleMappingChange(field, e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm font-bold transition-all"
                                        >
                                            <option value="">-- Pilih Kolom --</option>
                                            {headers.map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleToPreview}
                                className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2"
                            >
                                Review Transaksi
                                <ArrowRight size={18} />
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 3: PREVIEW */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex-1 flex flex-col"
                        >
                            <div className="flex-1 space-y-3 mb-6">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pratinjau Impor</p>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {previewData.slice(0, 50).map((row, i) => (
                                        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between">
                                            <div className="flex-1 min-w-0 pr-2">
                                                <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{row.description}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">{row.date} • {row.category || "Tanpa Kategori"}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-black ${String(row.amount).startsWith("-") ? "text-rose-500" : "text-emerald-500"}`}>
                                                    {row.amount}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {previewData.length > 50 && (
                                        <p className="text-center text-[10px] text-slate-400 italic py-2">
                                            + {previewData.length - 50} transaksi lainnya...
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl flex items-start gap-3">
                                    <AlertCircle className="text-amber-500 shrink-0" size={18} />
                                    <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                                        Data akan diimpor secara otomatis. Pastikan angka nominal dan tanggal sudah sesuai format aplikasi.
                                    </p>
                                </div>
                                <button
                                    onClick={handleImport}
                                    disabled={isImporting}
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                                >
                                    {isImporting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Check size={20} strokeWidth={3} />
                                    )}
                                    KONFIRMASI IMPOR
                                </button>
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={isImporting}
                                    className="w-full py-3 text-slate-400 font-bold text-xs uppercase hover:text-slate-600 transition-colors"
                                >
                                    Kembali ke Pemetaan
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
