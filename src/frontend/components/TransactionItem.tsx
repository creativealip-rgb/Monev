import { format } from "date-fns";
import { Coffee, ShoppingBag, Zap, CreditCard, ArrowRight, TrendingUp, Gamepad2, Heart, BookOpen, Receipt, Car, Utensils, Briefcase } from "lucide-react";
import { Transaction } from "@/types";
import { formatCurrency, cn } from "@/frontend/lib/utils";

const CATEGORY_STYLES: Record<string, { icon: typeof Coffee, color: string, gradient: string }> = {
    // Indonesian category names from database
    "Makan & Minuman": {
        icon: Utensils,
        color: "bg-orange-100 text-orange-600",
        gradient: "from-orange-500 to-amber-500"
    },
    "Transportasi": {
        icon: Car,
        color: "bg-blue-100 text-blue-600",
        gradient: "from-blue-500 to-indigo-500"
    },
    "Hiburan": {
        icon: Gamepad2,
        color: "bg-purple-100 text-purple-600",
        gradient: "from-purple-500 to-pink-500"
    },
    "Belanja": {
        icon: ShoppingBag,
        color: "bg-pink-100 text-pink-600",
        gradient: "from-pink-500 to-rose-500"
    },
    "Kesehatan": {
        icon: Heart,
        color: "bg-green-100 text-green-600",
        gradient: "from-green-500 to-emerald-500"
    },
    "Pendidikan": {
        icon: BookOpen,
        color: "bg-teal-100 text-teal-600",
        gradient: "from-teal-500 to-cyan-500"
    },
    "Tagihan": {
        icon: Receipt,
        color: "bg-red-100 text-red-600",
        gradient: "from-red-500 to-rose-500"
    },
    "Investasi": {
        icon: TrendingUp,
        color: "bg-emerald-100 text-emerald-600",
        gradient: "from-emerald-500 to-teal-500"
    },
    "Gaji": {
        icon: Briefcase,
        color: "bg-emerald-100 text-emerald-600",
        gradient: "from-emerald-500 to-green-500"
    },
    "Freelance": {
        icon: Briefcase,
        color: "bg-violet-100 text-violet-600",
        gradient: "from-violet-500 to-purple-500"
    },
    "Lainnya": {
        icon: CreditCard,
        color: "bg-slate-100 text-slate-600",
        gradient: "from-slate-500 to-slate-400"
    },
    // Fallback for English names
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
    onClick?: () => void;
}

export function TransactionItem({ transaction, onClick }: TransactionItemProps) {
    const style = CATEGORY_STYLES[transaction.category] || CATEGORY_STYLES.Default;
    const isExpense = transaction.type === "expense";
    const isIncome = transaction.type === "income";
    const Icon = style.icon;

    return (
        <div
            onClick={onClick}
            className={cn(
                "relative flex items-center p-4 card-clean",
                "hover:border-blue-300/50 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer",
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
            <div className="flex-1 min-w-0 overflow-hidden mr-4">
                <h4 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-1 break-all">
                    {transaction.description || "Tanpa Deskripsi"}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-medium text-slate-500 truncate">
                        {transaction.category || "Lainnya"}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                    <span className="text-[11px] font-medium text-slate-400 flex-shrink-0">
                        {(() => {
                            try {
                                const date = new Date(transaction.created_at);
                                return isNaN(date.getTime()) ? "N/A" : format(date, "dd MMM, HH:mm");
                            } catch (e) {
                                return "N/A";
                            }
                        })()}
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
