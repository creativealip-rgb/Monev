import { ActionFab } from "@/components/ActionFab";
import { ChevronLeft, User, Shield, CreditCard, LogOut, Settings } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
    return (
        <div className="relative min-h-full bg-slate-50">
            <header className="px-6 pt-12 pb-20 bg-white rounded-b-[3rem] shadow-sm mb-[-2rem] relative z-20">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/" className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors">
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </Link>
                    <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Profil Saya</h1>
                </div>

                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl flex items-center justify-center text-white text-3xl font-extrabold mb-4 shadow-blue-500/30">
                        AL
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-800">Alip</h2>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Free Tier User</p>
                </div>
            </header>

            <div className="px-6 pt-12 space-y-6 pb-40">
                <div className="space-y-3">
                    <button className="w-full p-5 bg-white rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                                <Settings size={20} strokeWidth={2.5} />
                            </div>
                            <p className="font-bold text-slate-800">Pengaturan Akun</p>
                        </div>
                        <Shield size={18} className="text-slate-200" />
                    </button>

                    <button className="w-full p-5 bg-white rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <CreditCard size={20} strokeWidth={2.5} />
                            </div>
                            <p className="font-bold text-slate-800">Metode Pembayaran</p>
                        </div>
                        <Shield size={18} className="text-slate-200" />
                    </button>

                    <button className="w-full p-5 bg-white rounded-3xl border border-slate-200/50 flex items-center justify-between hover:bg-rose-50 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all">
                                <LogOut size={20} strokeWidth={2.5} />
                            </div>
                            <p className="font-bold text-rose-500">Keluar Sesi</p>
                        </div>
                    </button>
                </div>
            </div>


        </div>
    );
}
