import { format } from "date-fns";
import { Coffee, ShoppingBag, Zap, CreditCard, ArrowRight, TrendingUp } from "lucide-react";
import { Transaction } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";

const CATEGORY_STYLES: Record<string, { icon: any, color: string }> = {
    Food: { icon: Coffee, color: "bg-orange-100 text-orange-500" },
    Shopping: { icon: ShoppingBag, color: "bg-blue-100 text-blue-500" },
    Utilities: { icon: Zap, color: "bg-yellow-100 text-yellow-500" },
    Transport: { icon: ArrowRight, color: "bg-purple-100 text-purple-500" },
    Income: { icon: TrendingUp, color: "bg-emerald-100 text-emerald-500" },
    Default: { icon: CreditCard, color: "bg-slate-100 text-slate-500" },
};

export function TransactionItem({ transaction }: { transaction: Transaction }) {
    const style = CATEGORY_STYLES[transaction.category] || CATEGORY_STYLES.Default;
    const isExpense = transaction.type === "expense";
    const Icon = style.icon;

    return (
        <div className="flex items-center p-4 bg-white rounded-2xl border border-slate-100 hover:border-primary/20 transition-all cursor-pointer group shadow-sm hover:shadow-md">
            <div className={cn("p-3 rounded-2xl mr-4", style.color)}>
                <Icon size={20} weight="bold" />
            </div>

            <div className="flex-1">
                <h4 className="font-bold text-slate-800 text-sm">{transaction.description}</h4>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                    {transaction.category} • {format(new Date(transaction.created_at), "HH:mm")}
                </p>
            </div>

            <div className="text-right">
                <p className={cn(
                    "font-extrabold text-sm tracking-tight",
                    isExpense ? "text-slate-900" : "text-emerald-500"
                )}>
                    {isExpense ? "-" : "+"} {formatCurrency(transaction.amount)}
                </p>
            </div>
        </div>
    );
}
