import { ChevronRight, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface StatsCardProps {
    label: string;
    amount: number;
    type: "income" | "expense" | "balance";
    className?: string;
}

const TYPE_CONFIG = {
    balance: { icon: Wallet, color: "bg-blue-600 text-white", labelColor: "text-slate-500" },
    income: { icon: ArrowUpRight, color: "bg-emerald-100 text-emerald-600", labelColor: "text-slate-500" },
    expense: { icon: ArrowDownRight, color: "bg-rose-100 text-rose-600", labelColor: "text-slate-500" },
};

export function StatsCard({ label, amount, type, className }: StatsCardProps) {
    const config = TYPE_CONFIG[type];
    const Icon = config.icon;

    return (
        <div className={cn(
            "card-clean p-4 flex flex-col justify-between h-full relative overflow-hidden group cursor-pointer",
            className
        )}>
            <div className="flex items-start justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", config.color)}>
                    <Icon size={20} strokeWidth={2.5} />
                </div>
                {type === 'balance' && (
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <ChevronRight size={16} />
                    </div>
                )}
            </div>

            <div>
                <p className={cn("text-xs font-medium mb-1", config.labelColor)}>{label}</p>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    {formatCurrency(amount)}
                </h3>
            </div>
        </div>
    );
}
