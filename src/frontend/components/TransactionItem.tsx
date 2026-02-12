import { format } from "date-fns";
import { Coffee, ShoppingBag, Zap, CreditCard, ArrowRight, TrendingUp } from "lucide-react";
import { Transaction } from "@/types";
import { formatCurrency, cn } from "@/frontend/lib/utils";

const CATEGORY_STYLES: Record<string, { icon: typeof Coffee, color: string, gradient: string }> = {
    Food: { 
        icon: Coffee, 
        color: "bg-orange-100 text-orange-600",
        gradient: "from-orange-500 to-amber-500"
    },
    Shopping: { 
        icon: ShoppingBag, 
        color: "bg-blue-100 text-blue-600",
        gradient: "from-blue-500 to-indigo-500"
    },
    Utilities: { 
        icon: Zap, 
        color: "bg-yellow-100 text-yellow-600",
        gradient: "from-yellow-500 to-orange-500"
    },
    Transport: { 
        icon: ArrowRight, 
        color: "bg-purple-100 text-purple-600",
        gradient: "from-purple-500 to-pink-500"
    },
    Income: { 
        icon: TrendingUp, 
        color: "bg-emerald-100 text-emerald-600",
        gradient: "from-emerald-500 to-teal-500"
    },
    Default: { 
        icon: CreditCard, 
        color: "bg-slate-100 text-slate-600",
        gradient: "from-slate-500 to-slate-400"
    },
};

interface TransactionItemProps {
    transaction: Transaction;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
    const style = CATEGORY_STYLES[transaction.category] || CATEGORY_STYLES.Default;
    const isExpense = transaction.type === "expense";
    const isIncome = transaction.type === "income";
    const Icon = style.icon;

    return (
        <div className={cn(
            "relative flex items-center p-4 bg-white rounded-2xl border border-slate-100",
            "hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5",
            "transition-all duration-300"
        )}>
            {/* Icon Container with Gradient */}
            <div className={cn(
                "relative w-12 h-12 rounded-xl flex items-center justify-center mr-4 overflow-hidden flex-shrink-0",
                style.color
            )}>
                <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-br",
                    style.gradient
                )} />
                <Icon size={22} strokeWidth={2} className="relative z-10" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 mr-4">
                <h4 className="font-semibold text-slate-900 text-sm truncate leading-tight">
                    {transaction.description}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-medium text-slate-500">
                        {transaction.category}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[11px] font-medium text-slate-400">
                        {format(new Date(transaction.created_at), "dd MMM, HH:mm")}
                    </span>
                </div>
            </div>

            {/* Amount */}
            <div className="text-right flex-shrink-0">
                <p className={cn(
                    "font-bold text-sm tracking-tight whitespace-nowrap",
                    isIncome ? "text-emerald-600" : isExpense ? "text-slate-900" : "text-slate-600"
                )}>
                    {isIncome ? "+" : isExpense ? "−" : ""} {formatCurrency(transaction.amount)}
                </p>
                {transaction.is_verified && (
                    <div className="flex items-center justify-end gap-1 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-medium text-slate-400">Verified</span>
                    </div>
                )}
            </div>
        </div>
    );
}
