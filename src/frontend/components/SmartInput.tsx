"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Camera, Mic, Upload, Loader2, Check, AlertCircle,
    Sparkles
} from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { useAIParser } from "@/frontend/hooks/useAIParser";

interface SmartInputProps {
    mode: "screenshot" | "voice";
    onClose: () => void;
    onSuccess: (data: {
        merchantName: string;
        amount: number;
        description: string;
        category: string;
    }) => void;
}

const categoryColors: Record<string, string> = {
    "Makan & Minuman": "#f97316",
    "Transportasi": "#3b82f6",
    "Hiburan": "#a855f7",
    "Belanja": "#ec4899",
    "Kesehatan": "#22c55e",
    "Pendidikan": "#14b8a6",
    "Tagihan": "#ef4444",
    "Investasi": "#10b981",
    "Gaji": "#3b82f6",
    "Freelance": "#8b5cf6",
    "Lainnya": "#64748b",
};

export function SmartInput({ mode, onClose, onSuccess }: SmartInputProps) {
    const {
        step,
        result,
        setResult,
        error,
        setError,
        isRecording,
        recordingTime,
        handleFileSelect,
        startRecording,
        stopRecording,
    } = useAIParser(onSuccess);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [saving, setSaving] = useState(false);

    const handleConfirm = async () => {
        if (!result || result.amount <= 0) {
            setError("Nominal tidak valid");
            return;
        }

        setSaving(true);
        setError(null);

        try {
            // Get category ID from name
            const catsResponse = await apiFetch("/api/categories");
            const catsResult = await catsResponse.json();
            const categories = catsResult.data || [];
            const category = categories.find((c: any) => c.name === result.category);

            if (!category) {
                setError("Kategori tidak ditemukan");
                setSaving(false);
                return;
            }

            const accountsResponse = await apiFetch("/api/accounts");
            const accountsResult = await accountsResponse.json();
            const accounts = accountsResult.data || [];
            const defaultAccount = accounts.find((account: any) => account.isActive !== false) || accounts[0];

            if (!defaultAccount?.id) {
                setError("Akun saldo belum ada. Tambahkan akun di halaman Saldo dulu.");
                setSaving(false);
                return;
            }

            // Save transaction directly. The transactions API requires accountId.
            const response = await apiFetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: result.amount,
                    description: result.description || result.merchantName || "Transaksi",
                    merchantName: result.merchantName || null,
                    categoryId: category.id,
                    type: "expense",
                    paymentMethod: defaultAccount.type || "cash",
                    accountId: defaultAccount.id,
                    date: new Date().toISOString(),
                }),
            });

            const saveResult = await response.json();

            if (saveResult.success) {
                // Trigger refresh
                window.dispatchEvent(new CustomEvent("transactionAdded"));
                // Notify parent of success
                onSuccess(result);
                // Close the modal immediately
                onClose();
            } else {
                setError(saveResult.error || "Gagal menyimpan transaksi");
            }
        } catch (err) {
            setError("Gagal menyimpan transaksi");
        } finally {
            setSaving(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <AnimatePresence>
            <motion.div
                key="smartinput-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10002]"
            />
            <motion.div
                key="smartinput-sheet"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="fixed bottom-0 left-0 right-0 z-[10004] max-w-[500px] mx-auto"
            >
                <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden min-h-[60vh]" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-4 pb-2">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                mode === "screenshot" ? "bg-emerald-50" : "bg-purple-50"
                            )}>
                                {mode === "screenshot" ? (
                                    <Camera className="text-emerald-600" size={20} />
                                ) : (
                                    <Mic className="text-purple-600" size={20} />
                                )}
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900">
                                    {mode === "screenshot" ? "Scan Screenshot" : "Voice Note"}
                                </h2>
                                <p className="text-xs text-slate-500">
                                    {mode === "screenshot" ? "Upload bukti transfer" : "Rekam perintah suara"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onClose();
                            }}
                            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors z-50 relative"
                            type="button"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="px-6 pb-8">
                        <AnimatePresence mode="wait">
                            {step === "input" && (
                                <motion.div
                                    key="input"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="py-8"
                                >
                                    {mode === "screenshot" ? (
                                        <div className="text-center">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full py-12 border-2 border-dashed border-slate-200 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors group"
                                            >
                                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <Upload className="text-emerald-500" size={28} />
                                                </div>
                                                <p className="font-semibold text-slate-700">Klik untuk upload</p>
                                                <p className="text-xs text-slate-400 mt-1">atau drag & drop gambar</p>
                                            </button>
                                            <p className="text-xs text-slate-400 mt-4">
                                                Support: JPG, PNG, WebP
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <button
                                                onClick={isRecording ? stopRecording : startRecording}
                                                className={cn(
                                                    "w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all",
                                                    isRecording
                                                        ? "bg-rose-500 animate-pulse"
                                                        : "bg-purple-500 hover:scale-105"
                                                )}
                                            >
                                                <Mic className="text-white" size={48} />
                                            </button>
                                            <p className="mt-4 font-semibold text-slate-700">
                                                {isRecording ? "Tekan untuk berhenti" : "Tekan untuk rekam"}
                                            </p>
                                            {isRecording && (
                                                <div className="mt-4 flex items-center justify-center gap-1 h-12">
                                                    {[...Array(12)].map((_, i) => (
                                                        <motion.div
                                                            key={i}
                                                            animate={{
                                                                height: [10, Math.random() * 30 + 10, 10]
                                                            }}
                                                            transition={{
                                                                repeat: Infinity,
                                                                duration: 0.5,
                                                                delay: i * 0.05
                                                            }}
                                                            className="w-1 bg-rose-500 rounded-full"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            {isRecording && (
                                                <p className="text-2xl font-bold text-rose-500 mt-2">
                                                    {formatTime(recordingTime)}
                                                </p>
                                            )}
                                            <p className="text-xs text-slate-400 mt-2">
                                                Contoh: "Tadi beli kopi 25 ribu di Kopi Kenangan"
                                            </p>
                                        </div>
                                    )}

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-4 p-4 bg-rose-50 rounded-xl flex items-start gap-3"
                                        >
                                            <AlertCircle className="text-rose-500 flex-shrink-0" size={18} />
                                            <div>
                                                <p className="text-sm font-medium text-rose-700">Gagal memproses</p>
                                                <p className="text-xs text-rose-600">{error}</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {step === "processing" && (
                                <motion.div
                                    key="processing"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="py-16 text-center"
                                >
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sky-50 flex items-center justify-center">
                                        <Loader2 className="text-sky-500 animate-spin" size={28} />
                                    </div>
                                    <p className="font-semibold text-slate-700">Memproses dengan AI...</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Menganalisis {mode === "screenshot" ? "gambar" : "suara"}
                                    </p>
                                </motion.div>
                            )}

                            {step === "review" && result && (
                                <motion.div
                                    key="review"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="py-4"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <Sparkles className="text-amber-500" size={16} />
                                        <p className="text-sm font-medium text-slate-600">Hasil Deteksi AI</p>
                                    </div>

                                    {/* Result Card */}
                                    <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">Nominal</p>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                                                <input
                                                    type="number"
                                                    value={result.amount || ""}
                                                    onChange={(e) => setResult({ ...result, amount: Number(e.target.value) })}
                                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">Deskripsi</p>
                                            <input
                                                type="text"
                                                value={result.description || result.merchantName || ""}
                                                onChange={(e) => setResult({ ...result, description: e.target.value })}
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                            />
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">Kategori</p>
                                            <select
                                                value={result.category}
                                                onChange={(e) => setResult({ ...result, category: e.target.value })}
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                            >
                                                {Object.keys(categoryColors).map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                                {!Object.keys(categoryColors).includes(result.category) && (
                                                    <option value={result.category}>{result.category}</option>
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 mt-6 relative z-10">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                onClose();
                                            }}
                                            disabled={saving}
                                            type="button"
                                            className="flex-1 py-3 rounded-xl border border-slate-200 font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                handleConfirm();
                                            }}
                                            disabled={saving}
                                            type="button"
                                            className="flex-1 py-3 rounded-xl bg-sky-500 font-medium text-white hover:bg-sky-600 transition-colors flex items-center justify-center gap-2 disabled:bg-sky-300"
                                        >
                                            {saving ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" />
                                                    Menyimpan...
                                                </>
                                            ) : (
                                                <>
                                                    <Check size={18} />
                                                    Simpan
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
