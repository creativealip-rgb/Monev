"use client";

import { ChevronLeft, Settings, CreditCard, LogOut, Bell, Shield, Moon } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const menuItems = [
    { icon: Settings, label: "Pengaturan Akun", color: "blue", hasArrow: true },
    { icon: CreditCard, label: "Metode Pembayaran", color: "emerald", hasArrow: true },
    { icon: Bell, label: "Notifikasi", color: "purple", hasArrow: true },
    { icon: Shield, label: "Keamanan", color: "amber", hasArrow: true },
    { icon: Moon, label: "Mode Gelap", color: "indigo", hasArrow: true },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
};

export default function ProfilePage() {
    return (
        <div className="relative min-h-screen bg-slate-50 pb-28">
            {/* Header */}
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 pt-12 pb-8 bg-gradient-to-b from-white to-slate-50 border-b border-slate-100"
            >
                <div className="flex items-center gap-3 mb-8">
                    <Link 
                        href="/" 
                        className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Profil Saya</h1>
                </div>

                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center"
                >
                    <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl shadow-blue-600/30 flex items-center justify-center text-white text-2xl font-bold">
                            AL
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Alip</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                            Free Tier
                        </span>
                        <span className="text-xs text-slate-400">alip@example.com</span>
                    </div>
                </motion.div>
            </motion.header>

            {/* Menu Items */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="px-6 pt-6 space-y-3"
            >
                {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    const colors: Record<string, { bg: string; text: string }> = {
                        blue: { bg: "bg-blue-50", text: "text-blue-600" },
                        emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
                        purple: { bg: "bg-purple-50", text: "text-purple-600" },
                        amber: { bg: "bg-amber-50", text: "text-amber-600" },
                        indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
                    };
                    const color = colors[item.color];

                    return (
                        <motion.button
                            key={index}
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm group hover:border-blue-200 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", color.bg, color.text)}>
                                    <Icon size={20} strokeWidth={2} />
                                </div>
                                <span className="font-semibold text-slate-800">{item.label}</span>
                            </div>
                            {item.hasArrow && (
                                <ChevronLeft size={18} className="text-slate-300 rotate-180 group-hover:text-blue-400 transition-colors" />
                            )}
                        </motion.button>
                    );
                })}

                {/* Logout Button */}
                <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-4 bg-white rounded-2xl border border-rose-100 flex items-center gap-4 shadow-sm hover:bg-rose-50 hover:border-rose-200 transition-all mt-6"
                >
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                        <LogOut size={20} strokeWidth={2} />
                    </div>
                    <span className="font-semibold text-rose-500">Keluar</span>
                </motion.button>
            </motion.div>

            {/* Version */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center mt-8"
            >
                <p className="text-xs text-slate-400">Monev v1.0.0</p>
            </motion.div>
        </div>
    );
}

import { cn } from "@/frontend/lib/utils";
