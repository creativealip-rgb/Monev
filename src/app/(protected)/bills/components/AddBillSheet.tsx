"use client";

import { useState, useEffect } from "react";
import { X, Receipt, Zap, Wifi, Tv, Music, Heart, Bike, Clock, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { useToast } from "@/frontend/components/UI";
import { Portal } from "@/frontend/components/Portal";
import { Bill } from "@/types";

const iconOptions = [
    { name: "Receipt", icon: Receipt, label: "Tagihan" },
    { name: "Zap", icon: Zap, label: "Listrik" },
    { name: "Wifi", icon: Wifi, label: "Internet" },
    { name: "Tv", icon: Tv, label: "TV/Streaming" },
    { name: "Music", icon: Music, label: "Musik" },
    { name: "Heart", icon: Heart, label: "Kesehatan" },
    { name: "Bike", icon: Bike, label: "Transport" },
    { name: "Clock", icon: Clock, label: "Langganan" },
    { name: "AlertTriangle", icon: AlertTriangle, label: "Lainnya" },
];

const colorOptions = [
    { value: "#6366f1", label: "Indigo" },
    { value: "#3b82f6", label: "Biru" },
    { value: "#ef4444", label: "Merah" },
    { value: "#f59e0b", label: "Kuning" },
    { value: "#22c55e", label: "Hijau" },
    { value: "#ec4899", label: "Pink" },
    { value: "#8b5cf6", label: "Ungu" },
    { value: "#06b6d4", label: "Cyan" },
];

interface AddBillSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingBill?: Bill | null;
}

export function AddBillSheet({
    isOpen,
    onClose,
    onSuccess,
    editingBill,
}: AddBillSheetProps) {
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("1");
    const [frequency, setFrequency] = useState<"monthly" | "weekly" | "yearly">("monthly");
    const [icon, setIcon] = useState("Receipt");
    const [color, setColor] = useState("#6366f1");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (editingBill) {
            setName(editingBill.name);
            setAmount(editingBill.amount.toString());
            setDueDate(editingBill.dueDate.toString());
            setFrequency((editingBill.frequency as "monthly" | "weekly" | "yearly") || "monthly");
            setIcon(editingBill.icon || "Receipt");
            setColor(editingBill.color || "#6366f1");
            setNotes(editingBill.notes || "");
        } else {
            resetForm();
        }
    }, [editingBill, isOpen]);

    const resetForm = () => {
        setName("");
        setAmount("");
        setDueDate("1");
        setFrequency("monthly");
        setIcon("Receipt");
        setColor("#6366f1");
        setNotes("");
    };

    const isInvalid = !name.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0;

    useEffect(() => {
        if (!isOpen) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                handleClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, loading]);

    const sanitizeNumberInput = (value: string) => value.replace(/[^0-9]/g, "");

    const handleSubmit = async () => {
        if (loading) return;

        const amountValue = Number(amount);
        if (!name.trim() || !Number.isFinite(amountValue) || amountValue <= 0) {
            toast.error("Form tidak lengkap", "Nama tagihan dan nominal valid wajib diisi");
            return;
        }

        const dueDateNum = parseInt(dueDate, 10);
        if (isNaN(dueDateNum) || dueDateNum < 1 || dueDateNum > 31) {
            toast.error("Tanggal tidak valid", "Tanggal jatuh tempo harus antara 1-31");
            return;
        }

        setLoading(true);
        try {
            const body = {
                name: name.trim(),
                amount: amountValue,
                dueDate: dueDateNum,
                frequency,
                icon,
                color,
                notes: notes.trim() || undefined,
            };

            let res;
            if (editingBill) {
                res = await apiFetch(`/api/bills/${editingBill.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            } else {
                res = await apiFetch("/api/bills", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            }

            const result = await res.json();
            if (result.success) {
                toast.success(
                    "Berhasil",
                    editingBill ? "Tagihan berhasil diperbarui" : "Tagihan berhasil ditambahkan"
                );
                resetForm();
                onClose();
                onSuccess();
            } else {
                toast.error("Gagal", result.error || "Terjadi kesalahan");
            }
        } catch (error) {
            console.error("Error saving bill:", error);
            toast.error("Gagal", "Terjadi kesalahan saat menyimpan tagihan");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            resetForm();
            onClose();
        }
    };

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[999998]"
                            onClick={handleClose}
                            aria-hidden="true"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-[999999] bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-t-[2.5rem] p-5 sm:p-8 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-12 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-2xl max-w-[500px] mx-auto"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="bill-sheet-title"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 id="bill-sheet-title" className="text-xl font-bold text-foreground">
                                    {editingBill ? "Edit Tagihan" : "Tambah Tagihan"}
                                </h2>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={loading}
                                    aria-label="Tutup form tagihan"
                                    className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Nama Tagihan */}
                                <div>
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">
                                        Nama Tagihan
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                        placeholder="Listrik, Internet, Netflix..."
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>

                                {/* Jumlah */}
                                <div>
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">
                                        Jumlah (Rp)
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                        placeholder="0"
                                        value={amount}
                                        onChange={e => setAmount(sanitizeNumberInput(e.target.value))}
                                        disabled={loading}
                                        min={0}
                                    />
                                </div>

                                {/* Tanggal Jatuh Tempo & Frekuensi */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">
                                            Tanggal Jatuh Tempo
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            min={1}
                                            max={31}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                            placeholder="1-31"
                                            value={dueDate}
                                            onChange={e => setDueDate(sanitizeNumberInput(e.target.value).slice(0, 2))}
                                            disabled={loading}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">
                                            Frekuensi
                                        </label>
                                        <select
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                            value={frequency}
                                            onChange={e => setFrequency(e.target.value as "monthly" | "weekly" | "yearly")}
                                            disabled={loading}
                                        >
                                            <option value="monthly">Bulanan</option>
                                            <option value="weekly">Mingguan</option>
                                            <option value="yearly">Tahunan</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Ikon */}
                                <div>
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">
                                        Ikon
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
                                        {iconOptions.map(opt => {
                                            const IconComponent = opt.icon;
                                            return (
                                                <button
                                                    key={opt.name}
                                                    type="button"
                                                    onClick={() => setIcon(opt.name)}
                                                    aria-pressed={icon === opt.name}
                                                    aria-label={`Pilih ikon ${opt.label}`}
                                                    disabled={loading}
                                                    className={cn(
                                                        "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all",
                                                        icon === opt.name
                                                            ? "border-sky-500 bg-sky-50 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400"
                                                            : "border-slate-100 dark:border-slate-700 text-muted-foreground hover:border-slate-300 dark:hover:border-slate-600"
                                                    )}
                                                >
                                                    <IconComponent size={14} />
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Warna */}
                                <div>
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">
                                        Warna
                                    </label>
                                    <div className="flex gap-3 flex-wrap">
                                        {colorOptions.map(c => (
                                            <button
                                                key={c.value}
                                                type="button"
                                                onClick={() => setColor(c.value)}
                                                aria-pressed={color === c.value}
                                                aria-label={`Pilih warna ${c.label}`}
                                                disabled={loading}
                                                className={cn(
                                                    "w-9 h-9 rounded-full transition-all flex items-center justify-center",
                                                    color === c.value
                                                        ? "ring-2 ring-offset-2 ring-sky-500 scale-110 dark:ring-offset-slate-900"
                                                        : "hover:scale-105"
                                                )}
                                                style={{ backgroundColor: c.value }}
                                                title={c.label}
                                            >
                                                {color === c.value && (
                                                    <div className="w-3 h-3 bg-white rounded-full" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Catatan */}
                                <div>
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">
                                        Catatan <span className="normal-case font-medium text-muted-foreground">(opsional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                        placeholder="Catatan tambahan..."
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading || isInvalid}
                                    className={cn(
                                        "w-full py-4 rounded-xl font-bold text-white text-sm mt-2 transition-all",
                                        "bg-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-500/20",
                                        (loading || isInvalid) && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {loading
                                        ? "Menyimpan..."
                                        : editingBill
                                            ? "Perbarui Tagihan"
                                            : "Tambah Tagihan"
                                    }
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </Portal>
    );
}
