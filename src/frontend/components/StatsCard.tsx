import { ChevronRight, ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, cn } from "@/frontend/lib/utils";

interface StatsCardProps {
    label: string;
    amount: number;
    type: "income" | "expense" | "balance";
    trend?: number;
    className?: string;
}

const TYPE_CONFIG = {
    balance: { 
        icon: Wallet, 
        bgColor: "bg-gradient-to-br from-blue-600 to-blue-700",
        iconColor: "text-white",
        labelColor: "text-blue-100",
        amountColor: "text-white"
    },
    income: { 
        icon: ArrowUpRight, 
        bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100/50",
        iconColor: "text-emerald-600",
        labelColor: "text-emerald-600/70",
        amountColor: "text-emerald-700"
    },
    expense: { 
        icon: ArrowDownRight, 
        bgColor: "bg-gradient-to-br from-rose-50 to-rose-100/50",
        iconColor: "text-rose-600",
        labelColor: "text-rose-600/70",
        amountColor: "text-rose-700"
    },
};

export function StatsCard({ label, amount, type, trend, className }: StatsCardProps) {
    const config = TYPE_CONFIG[type];
    const Icon = config.icon;
    const isPositiveTrend = trend && trend > 0;
    const isNegativeTrend = trend && trend < 0;

    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl p-5 transition-all duration-300",
            "hover:shadow-lg hover:scale-[1.02] cursor-pointer group",
            config.bgColor,
            className
        )}>
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-white/10 transition-all" />
            
            {/* Header */}
            <div className="relative flex items-start justify-between mb-4">
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    type === "balance" ? "bg-white/20" : "bg-white shadow-sm"
                )}>
                    <Icon size={20} className={config.iconColor} strokeWidth={2.5} />
                </div>
                
                {type === "balance" && (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 group-hover:bg-white/20 group-hover:text-white transition-all">
                        <ChevronRight size={16} />
                    </div>
                )}
                
                {trend !== undefined && type !== "balance" && (
                    <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold",
                        isPositiveTrend ? "bg-emerald-100 text-emerald-700" : 
                        isNegativeTrend ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
                    )}>
                        {isPositiveTrend ? <TrendingUp size={10} /> : 
                         isNegativeTrend ? <TrendingDown size={10} /> : null}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="relative">
                <p className={cn("text-xs font-semibold mb-1", config.labelColor)}>
                    {label}
                </p>
                <h3 className={cn("text-xl font-bold tracking-tight", config.amountColor)}>
                    {formatCurrency(amount)}
                </h3>
            </div>
        </div>
    );
}
