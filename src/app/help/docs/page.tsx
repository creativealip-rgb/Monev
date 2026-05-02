"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Book, ArrowLeft, Search, ExternalLink, FileText, Video, MessageCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/frontend/lib/utils";

const documentationSections = [
    {
        title: "Memulai",
        icon: Book,
        color: "blue",
        items: [
            { title: "Apa itu Monev?", description: "Pengenal aplikasi Monev dan fitur utamanya", href: "#pengertian" },
            { title: "Cara Daftar", description: "Panduan registrasi akun baru", href: "#daftar" },
            { title: "Setup Profil", description: "Mengatur profil dan preferensi", href: "#profil" },
        ]
    },
    {
        title: "Transaksi",
        icon: FileText,
        color: "emerald",
        items: [
            { title: "Catat Transaksi", description: "Cara menambah pemasukan & pengeluaran", href: "#catat" },
            { title: "Kategori", description: "Mengelola kategori transaksi", href: "#kategori" },
            { title: "Edit & Hapus", description: "Mengedit atau menghapus transaksi", href: "#edit" },
        ]
    },
    {
        title: "Fitur AI",
        icon: MessageCircle,
        color: "purple",
        items: [
            { title: "Monev AI Chat", description: "Tanya jawab keuangan dengan AI", href: "#ai-chat" },
            { title: "Insights Otomatis", description: "Analisis pengeluaran otomatis", href: "#insights" },
            { title: "Financial Persona", description: "Profil psikologi keuangan", href: "#persona" },
        ]
    },
    {
        title: "Laporan",
        icon: Video,
        color: "amber",
        items: [
            { title: "Export Data", description: "Download data dalam berbagai format", href: "#export" },
            { title: "Laporan Bulanan", description: "Ringkasan keuangan bulanan", href: "#laporan" },
            { title: "Budget Tracking", description: "Monitor anggaran per kategori", href: "#budget" },
        ]
    },
];

const quickStartGuide = `
## 🚀 Quick Start Guide

### 1. Catat Transaksi Pertama
- Klik tombol **"+"** di bottom navigation
- Pilih **Pemasukan** atau **Pengeluaran**
- Isi jumlah dan deskripsi
- Pilih kategori (atau biarkan AI auto-kategorisasi)
- Klik **Simpan**

### 2. Setup Budget
- Buka menu **Anggaran**
- Klik **Tambah Budget**
- Pilih kategori dan set limit bulanan
- Monev akan notifikasi jika hampir habis

### 3. Buat Goal/Target
- Buka menu **Tabungan**
- Klik **Goal Baru**
- Set target nominal dan deadline
- Monev akan track progress otomatis

### 4. Aktifkan Notifikasi
- Buka **Profile** → **Notifikasi**
- Aktifkan:
  - ✅ Laporan Harian
  - ✅ Peringatan Budget
  - ✅ Update Transaksi

### 5. Explore AI Features
- Klik **Monev AI** di Fitur Andalan
- Tanya apapun tentang keuanganmu
- Dapatkan insights personalized
`;

export default function DocumentationPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedSection, setExpandedSection] = useState<number | null>(null);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 pt-safe py-4"
            >
                <div className="flex items-center gap-3">
                    <Link
                        href="/profile"
                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Dokumentasi</h1>
                        <p className="text-xs text-slate-500">Panduan lengkap menggunakan Monev</p>
                    </div>
                </div>
            </motion.header>

            <div className="px-6 py-6 space-y-6">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari panduan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-modern pl-11 pr-4 py-3.5 w-full"
                    />
                </div>

                {/* Quick Start */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-sky-500 to-cyan-600 rounded-2xl p-6 text-white shadow-xl shadow-sky-500/20"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                            <Book size={20} />
                        </div>
                        <h2 className="font-bold text-lg">Quick Start Guide</h2>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none">
                        {quickStartGuide.split('\n').map((line, i) => (
                            <p key={i} className={cn(
                                line.startsWith('###') ? "font-bold text-base mt-4 mb-2" :
                                line.startsWith('-') ? "ml-4 text-sky-100" :
                                line.startsWith('✅') ? "ml-8 text-sky-100" :
                                "text-sky-50"
                            )}>
                                {line.replace(/^#+\s*/, '')}
                            </p>
                        ))}
                    </div>
                </motion.div>

                {/* Documentation Sections */}
                <div className="space-y-3">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-widest">Daftar Panduan</h3>
                    
                    {documentationSections.map((section, sectionIndex) => {
                        const Icon = section.icon;
                        const colors: Record<string, string> = {
                            blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
                            emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
                            purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
                            amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
                        };

                        return (
                            <motion.div
                                key={sectionIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: sectionIndex * 0.1 }}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                            >
                                <button
                                    type="button"
                                    onClick={() => setExpandedSection(expandedSection === sectionIndex ? null : sectionIndex)}
                                    aria-expanded={expandedSection === sectionIndex}
                                    className="w-full p-4 flex items-center gap-4 text-left"
                                >
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colors[section.color])}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900 dark:text-white">{section.title}</h4>
                                        <p className="text-xs text-slate-500">{section.items.length} panduan</p>
                                    </div>
                                    <div className={cn(
                                        "w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-transform",
                                        expandedSection === sectionIndex && "rotate-180"
                                    )}>
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </button>

                                {expandedSection === sectionIndex && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        className="px-4 pb-4 space-y-2"
                                    >
                                        {section.items.map((item, itemIndex) => (
                                            <a
                                                key={itemIndex}
                                                href={item.href}
                                                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                                            >
                                                <div>
                                                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{item.title}</p>
                                                    <p className="text-xs text-slate-500">{item.description}</p>
                                                </div>
                                                <ExternalLink size={16} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                                            </a>
                                        ))}
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Contact Support */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-6 text-center"
                >
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Tidak menemukan yang kamu cari?
                    </p>
                    <a
                        href="mailto:alifpm55@gmail.com"
                        className="inline-flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold hover:underline"
                    >
                        <MessageCircle size={16} />
                        Hubungi Support
                    </a>
                </motion.div>
            </div>
        </div>
    );
}
