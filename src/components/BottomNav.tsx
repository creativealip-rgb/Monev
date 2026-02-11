"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, NotebookTabs, Wallet, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
    const pathname = usePathname();

    const links = [
        { href: "/", label: "Home", icon: Home },
        { href: "/transactions", label: "Riwayat", icon: NotebookTabs },
        { href: "/budgets", label: "Budget", icon: Wallet },
        { href: "/profile", label: "Profil", icon: User },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] pointer-events-none">
            <div className="w-full max-w-[500px] mx-auto pointer-events-auto">
                <div className="bg-white/80 backdrop-blur-xl border-t border-slate-200/60 pb-safe pt-2 shadow-2xl shadow-blue-900/10 rounded-t-2xl">
                    <div className="flex items-end justify-between h-16 px-2 relative">
                        {/* Left Items */}
                        {links.slice(0, 2).map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 transition-all flex-1 h-full pb-2 select-none",
                                    pathname === href ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Icon size={24} strokeWidth={pathname === href ? 2.5 : 2} />
                                <span className="text-[10px] font-medium tracking-tight">{label}</span>
                            </Link>
                        ))}

                        {/* Center Space for FAB */}
                        <div className="flex-1 flex flex-col items-center justify-end pb-4 relative z-50">
                            <div className="absolute bottom-6 p-1.5 bg-slate-50 rounded-full border border-slate-100/50 shadow-sm">
                                <button className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 active:scale-95 transition-transform hover:bg-blue-700">
                                    <Plus size={32} strokeWidth={3} />
                                </button>
                            </div>
                            {/* Spacer to push layout */}
                            <div className="w-full h-8" />
                        </div>

                        {/* Right Items */}
                        {links.slice(2, 4).map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 transition-all flex-1 h-full pb-2 select-none",
                                    pathname === href ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Icon size={24} strokeWidth={pathname === href ? 2.5 : 2} />
                                <span className="text-[10px] font-medium tracking-tight">{label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
