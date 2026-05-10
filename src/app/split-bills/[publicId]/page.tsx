"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, Copy, ReceiptText, ShieldCheck, Users } from "lucide-react";
import { formatCurrency } from "@/frontend/lib/utils";

type SplitBillParticipant = {
    id: number;
    name: string;
    phone?: string | null;
    amountOwed: number;
    paidAt?: string | Date | null;
    paymentToken?: string;
};

type SplitBillItem = {
    id: number;
    name: string;
    price: number;
    quantity: number;
};

type SplitBillDetail = {
    publicId: string;
    title: string;
    totalAmount: number;
    status: string;
    paymentInstructions?: string | null;
    items: SplitBillItem[];
    participants: SplitBillParticipant[];
};

export default function PublicSplitBillPage() {
    const params = useParams<{ publicId: string }>();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";
    const [bill, setBill] = useState<SplitBillDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paid, setPaid] = useState(false);

    const participant = useMemo(() => {
        if (!bill || !token) return null;
        return bill.participants.find(item => item.paymentToken === token) || null;
    }, [bill, token]);

    useEffect(() => {
        let ignore = false;
        async function loadBill() {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/public/split-bills/${params.publicId}`);
                const json = await response.json();
                if (!response.ok || !json.success) throw new Error(json.error || "Split bill tidak ditemukan");
                if (!ignore) setBill(json.data);
            } catch (err) {
                if (!ignore) setError(err instanceof Error ? err.message : "Gagal memuat split bill");
            } finally {
                if (!ignore) setLoading(false);
            }
        }
        void loadBill();
        return () => { ignore = true; };
    }, [params.publicId]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(window.location.href);
    };

    const handleMarkPaid = async () => {
        if (!token) return;
        setPaying(true);
        setError(null);
        try {
            const response = await fetch(`/api/public/split-bills/${params.publicId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentToken: token }),
            });
            const json = await response.json();
            if (!response.ok || !json.success) throw new Error(json.error || "Gagal konfirmasi pembayaran");
            setBill(json.data);
            setPaid(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal konfirmasi pembayaran");
        } finally {
            setPaying(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-4 py-8 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-white">
            <div className="mx-auto max-w-lg space-y-5">
                <section className="rounded-[2rem] border border-sky-100 bg-white/85 p-6 shadow-xl shadow-sky-900/10 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/30">
                            <ReceiptText size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-500">Monev Split Bill</p>
                            <h1 className="text-2xl font-black">{loading ? "Memuat..." : bill?.title || "Split Bill"}</h1>
                        </div>
                    </div>

                    {error && <div className="mb-4 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}

                    {bill && (
                        <div className="space-y-4">
                            <div className="rounded-3xl bg-gradient-to-br from-sky-500 to-cyan-500 p-5 text-white shadow-lg shadow-sky-500/20">
                                <p className="text-xs font-bold uppercase tracking-widest text-white/75">Total Tagihan</p>
                                <p className="mt-1 text-4xl font-black tabular-nums">{formatCurrency(bill.totalAmount)}</p>
                                <p className="mt-2 text-sm font-semibold text-white/80">Status: {bill.status}</p>
                            </div>

                            {participant && (
                                <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                                    <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Bagian Kamu</p>
                                    <div className="mt-2 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-lg font-black">{participant.name}</p>
                                            <p className="text-2xl font-black text-emerald-600 tabular-nums">{formatCurrency(participant.amountOwed)}</p>
                                        </div>
                                        {participant.paidAt || paid ? <CheckCircle2 className="text-emerald-500" size={34} /> : null}
                                    </div>
                                </div>
                            )}

                            <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-800/70">
                                <div className="mb-3 flex items-center gap-2 text-sm font-black"><Users size={16} /> Peserta</div>
                                <div className="space-y-2">
                                    {bill.participants.map(item => (
                                        <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white p-3 dark:bg-slate-900">
                                            <span className="font-bold">{item.name}</span>
                                            <span className="font-black tabular-nums">{formatCurrency(item.amountOwed)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {bill.paymentInstructions && (
                                <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                                    {bill.paymentInstructions}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={handleCopy} className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white dark:bg-white dark:text-slate-900">
                                    <Copy size={16} /> Salin Link
                                </button>
                                <button onClick={handleMarkPaid} disabled={!token || paying || !!participant?.paidAt || paid} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50">
                                    <ShieldCheck size={16} /> {paying ? "Mengirim..." : "Saya Sudah Bayar"}
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
