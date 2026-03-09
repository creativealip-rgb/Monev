// TierComparisonGraphics.tsx
import { Check, X, Crown, Zap, Sparkles } from "lucide-react";
import { cn } from "@/frontend/lib/utils";

interface TierFeature {
    feature: string;
    starter: boolean | string;
    pro: boolean | string; 
    sultan: boolean | string;
}

export function TierComparisonGraphics() {
    const features: TierFeature[] = [
        { feature: "Transaksi Bulanan", starter: "100", pro: "Unlimited", sultan: "Unlimited" },
        { feature: "Akun Bank", starter: "2", pro: "10", sultan: "Unlimited" },
        { feature: "Kategori Anggaran", starter: "3", pro: "20", sultan: "Unlimited" },
        { feature: "Target Tabungan", starter: "1", pro: "10", sultan: "Unlimited" },
        { feature: "Lacak Investasi", starter: false, pro: "Manual", sultan: "Sync Real-time" },
        { feature: "AI Chats Web", starter: "5/hari", pro: "100/hari", sultan: "Unlimited" },
        { feature: "OCR Scans", starter: "5/bulan", pro: "100/bulan", sultan: "Unlimited" },
        { feature: "Format Export", starter: "CSV", pro: "CSV + Excel", sultan: "CSV + Excel + PDF" },
        { feature: "Analitik Lanjutan", starter: false, pro: true, sultan: "AI Prediction" },
        { feature: "Bot Telegram", starter: false, pro: "Command-based", sultan: "AI Conversational" },
        { feature: "Laporan Pajak", starter: false, pro: false, sultan: true },
        { feature: "Auto Cloud Backup", starter: false, pro: false, sultan: true },
        { feature: "Support Prioritas", starter: false, pro: "Email", sultan: "WhatsApp" },
        { feature: "Hapus Iklan", starter: false, pro: true, sultan: true },
    ];

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[800px]">
                <thead>
                    <tr className="text-left">
                        <th className="pb-6 text-lg font-bold text-slate-900 dark:text-white">Fitur</th>
                        <th className="pb-6 text-center">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                                    <Zap size={20} className="text-slate-600 dark:text-slate-400" />
                                </div>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Starter</span>
                                <span className="text-xs text-slate-500">Rp 0/bln</span>
                            </div>
                        </th>
                        <th className="pb-6 text-center">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mb-2">
                                    <Sparkles size={20} className="text-sky-600 dark:text-sky-400" />
                                </div>
                                <span className="text-sm font-bold text-sky-700 dark:text-sky-300">Pro</span>
                                <span className="text-xs text-sky-500">Rp 29K/bln</span>
                            </div>
                        </th>
                        <th className="pb-6 text-center">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-2">
                                    <Crown size={20} className="text-amber-600 dark:text-amber-400" />
                                </div>
                                <span className="text-sm font-bold text-amber-700 dark:text-amber-300">Sultan</span>
                                <span className="text-xs text-amber-500">Rp 49K/bln</span>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {features.map((item, index) => (
                        <tr 
                            key={item.feature} 
                            className={cn("border-b border-slate-100 dark:border-slate-800", 
                                index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-950")}
                        >
                            <td className="py-4 px-2 font-medium text-slate-700 dark:text-slate-300">{item.feature}</td>
                            <td className="py-4 px-2 text-center">
                                {renderCell(item.starter)}
                            </td>
                            <td className="py-4 px-2 text-center">
                                {renderCell(item.pro)}
                            </td>
                            <td className="py-4 px-2 text-center">
                                {renderCell(item.sultan)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function renderCell(value: boolean | string) {
    if (typeof value === 'boolean') {
        return value ? 
            <Check className="w-5 h-5 text-emerald-500 mx-auto" /> : 
            <X className="w-5 h-5 text-slate-300 dark:text-slate-600 mx-auto" />;
    }
    
    return <span className="font-medium text-slate-700 dark:text-slate-300">{value}</span>;
}