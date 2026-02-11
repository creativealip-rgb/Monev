import { ActionFab } from "@/components/ActionFab";
import { TransactionItem } from "@/components/TransactionItem";
import { Transaction } from "@/types";
import { Filter, Search } from "lucide-react";

const transactions: Transaction[] = [
    { id: '1', amount: 25000, description: 'Es Kopi Susu', category: 'Food', type: 'expense', created_at: new Date().toISOString(), is_verified: true },
    { id: '2', amount: 150000, description: 'Netflix Premium', category: 'Utilities', type: 'expense', created_at: new Date().toISOString(), is_verified: true },
    { id: '3', amount: 5000000, description: 'Gaji Freelance', category: 'Income', type: 'income', created_at: new Date(Date.now() - 86400000).toISOString(), is_verified: true },
    { id: '4', amount: 45000, description: 'Grab Ride', category: 'Transport', type: 'expense', created_at: new Date(Date.now() - 172800000).toISOString(), is_verified: true },
    { id: '5', amount: 1200000, description: 'Keyboard Baru', category: 'Shopping', type: 'expense', created_at: new Date(Date.now() - 250000000).toISOString(), is_verified: true },
];

export default function TransactionsPage() {
    return (
        <div className="relative min-h-screen bg-slate-50 pb-24">
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 pt-12 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Riwayat</h1>
                    <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors">
                        <Filter size={20} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari transaksi..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                </div>
            </header>

            <div className="p-6 space-y-2">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bulan Ini</p>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">5 Transaksi</span>
                </div>

                <div className="space-y-3">
                    {transactions.map((t) => (
                        <TransactionItem key={t.id} transaction={t} />
                    ))}
                </div>
            </div>

            <ActionFab />

        </div>
    );
}
