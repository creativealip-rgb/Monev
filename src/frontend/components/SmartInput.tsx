"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, Camera, Mic, Upload, Loader2, Check, AlertCircle,
    Sparkles, ArrowRight
} from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";

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
    const [step, setStep] = useState<"input" | "processing" | "review">("input");
    const [preview, setPreview] = useState<string | null>(null);
    const [result, setResult] = useState<{
        merchantName: string;
        amount: number;
        description: string;
        category: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setPreview(reader.result as string);
                processImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const processImage = async (base64: string) => {
        setStep("processing");
        setError(null);

        try {
            const response = await fetch("/api/transactions/ocr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageBase64: base64.split(",")[1] }),
            });

            const data = await response.json();

            if (data.success) {
                setResult({
                    merchantName: data.data.merchantName || "",
                    amount: data.data.amount || 0,
                    description: data.data.description || "",
                    category: data.data.category || "Lainnya",
                });
                setStep("review");
            } else {
                setError(data.error || "Failed to process image");
            }
        } catch (err) {
            setError("Failed to process image. Please try again.");
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                await processVoice(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            setError("Failed to access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            setStep("processing");
        }
    };

    const processVoice = async (audioBlob: Blob) => {
        setError(null);

        try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "voice.webm");

            const response = await fetch("/api/transactions/voice", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setResult({
                    merchantName: data.data.parsed.merchantName || "",
                    amount: data.data.parsed.amount || 0,
                    description: data.data.parsed.description || "",
                    category: data.data.parsed.category || "Lainnya",
                });
                setStep("review");
            } else {
                setError(data.error || "Failed to process voice");
            }
        } catch (err) {
            setError("Failed to process voice. Please try again.");
        }
    };

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
            const catsResponse = await fetch("/api/categories");
            const catsResult = await catsResponse.json();
            const categories = catsResult.data || [];
            const category = categories.find((c: any) => c.name === result.category);
            
            if (!category) {
                setError("Kategori tidak ditemukan");
                setSaving(false);
                return;
            }

            // Save transaction directly
            const response = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: result.amount,
                    description: result.description || result.merchantName || "Transaksi",
                    categoryId: category.id,
                    type: "expense",
                    paymentMethod: "cash",
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
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
                                        <Loader2 className="text-blue-500 animate-spin" size={28} />
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
                                            <p className="text-2xl font-bold text-slate-900">
                                                {result.amount > 0 ? formatCurrency(result.amount) : "Rp 0"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">Deskripsi</p>
                                            <p className="font-medium text-slate-800">
                                                {result.description || result.merchantName || "-"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">Kategori</p>
                                            <div className="flex items-center gap-2">
                                                <div 
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: categoryColors[result.category] }}
                                                />
                                                <span className="font-medium text-slate-800">{result.category}</span>
                                            </div>
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
                                            className="flex-1 py-3 rounded-xl bg-blue-600 font-medium text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-blue-400"
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
