"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ArrowLeft, MessageCircle, ChevronDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/frontend/lib/utils";

const faqCategories = [
    {
        id: "general",
        name: "Umum",
        questions: [
            {
                question: "Apa itu Monev?",
                answer: "Monev adalah aplikasi pencatat keuangan pribadi yang dilengkapi dengan AI untuk membantu kamu mengelola keuangan dengan lebih cerdas. Fitur utamanya termasuk tracking transaksi, budget management, goal setting, dan AI-powered insights."
            },
            {
                question: "Apakah Monev gratis?",
                answer: "Monev memiliki tier gratis (Starter) dengan fitur dasar yang cukup lengkap. Untuk fitur advanced seperti AI insights, export data, dan integrasi bot, tersedia dalam paket Pro dan Sultan dengan harga mulai dari Rp 50.000/bulan."
            },
            {
                question: "Bagaimana cara mendaftar?",
                answer: "Klik tombol 'Daftar' di halaman login, masukkan email dan password, lalu verifikasi email kamu. Setelah itu kamu bisa langsung mulai menggunakan Monev!"
            },
            {
                question: "Apakah data saya aman?",
                answer: "Ya! Data kamu dienkripsi end-to-end dan tersimpan di server yang aman. Kami tidak pernah menjual atau membagikan data kamu ke pihak ketiga tanpa izin."
            },
        ]
    },
    {
        id: "transactions",
        name: "Transaksi",
        questions: [
            {
                question: "Bagaimana cara menambah transaksi?",
                answer: "Klik tombol '+' di bottom navigation, pilih tipe transaksi (Pemasukan/Pengeluaran), isi nominal dan deskripsi, pilih kategori, lalu klik Simpan. AI kami juga bisa auto-kategorisasi transaksi kamu!"
            },
            {
                question: "Bisa import transaksi dari bank?",
                answer: "Saat ini Monev mendukung export ke format bank (BCA, Mandiri, BNI). Untuk import otomatis dari bank, fitur ini sedang dalam pengembangan dan akan tersedia soon!"
            },
            {
                question: "Bagaimana cara edit atau hapus transaksi?",
                answer: "Buka halaman Riwayat, klik transaksi yang ingin diedit/dihapus, lalu pilih tombol Edit atau Hapus. Kamu juga bisa bulk delete multiple transactions sekaligus."
            },
            {
                question: "Apa itu transaksi recurring?",
                answer: "Transaksi recurring adalah transaksi yang berulang otomatis setiap bulan (contoh: gaji, cicilan, subscription). Setup sekali, Monev akan catat otomatis setiap bulannya!"
            },
        ]
    },
    {
        id: "features",
        name: "Fitur",
        questions: [
            {
                question: "Apa itu Monev AI?",
                answer: "Monev AI adalah asisten keuangan berbasis AI yang bisa kamu tanya apapun tentang keuanganmu. Contoh: 'Berapa pengeluaran saya untuk makan bulan ini?' atau 'Beri saya tips menabung lebih efektif'."
            },
            {
                question: "Bagaimana cara setting budget?",
                answer: "Buka menu Anggaran → Tambah Budget → Pilih kategori dan set limit bulanan. Monev akan track pengeluaran kamu dan kasih notifikasi kalau sudah mendekati limit!"
            },
            {
                question: "Apa itu Financial Persona?",
                answer: "Financial Persona adalah profil psikologi keuangan kamu yang dianalisis oleh AI berdasarkan kebiasaan spending dan saving. Ini membantu kamu memahami pola keuangan dan area yang perlu diperbaiki."
            },
            {
                question: "Bisa export data ke Excel?",
                answer: "Bisa! Buka Profile → Data & Backup → Export. Tersedia format JSON (full backup), CSV (Excel-readable), PDF (laporan lengkap), dan template bank (BCA, Mandiri, BNI)."
            },
        ]
    },
    {
        id: "account",
        name: "Akun & Billing",
        questions: [
            {
                question: "Bagaimana cara upgrade paket?",
                answer: "Buka Profile → klik banner tier kamu (Starter/Pro) → Pilih paket yang diinginkan → Lakukan pembayaran. Upgrade langsung aktif dan kamu bisa akses semua fitur premium!"
            },
            {
                question: "Bisa downgrade atau cancel subscription?",
                answer: "Ya, kamu bisa downgrade atau cancel subscription kapan saja dari halaman Profile → Ganti Paket. Subscription akan tetap aktif sampai periode billing berakhir."
            },
            {
                question: "Metode pembayaran apa yang diterima?",
                answer: "Kami menerima transfer bank (BCA, Mandiri, BNI), e-wallet (GoPay, OVO, Dana), dan QRIS. Pembayaran diproses otomatis dan instant."
            },
            {
                question: "Bagaimana cara hapus akun?",
                answer: "Buka Profile → Keamanan → scroll ke bawah → Hapus Akun. Kamu perlu konfirmasi dengan mengetik 'HAPUS AKUN SAYA'. Data kamu akan dihapus permanen dalam 30 hari."
            },
        ]
    },
    {
        id: "technical",
        name: "Teknis",
        questions: [
            {
                question: "Monev tersedia di platform apa?",
                answer: "Saat ini Monev tersedia sebagai web app (bisa diakses dari browser apapun). Android app sedang dalam pengembangan dan akan tersedia soon di Play Store!"
            },
            {
                question: "Apakah ada aplikasi mobile?",
                answer: "Aplikasi Android sedang dalam development. Kamu bisa download APK beta dari Profile → Download Aplikasi. iOS app akan menyusul setelah Android launch."
            },
            {
                question: "Bagaimana cara reset password?",
                answer: "Di halaman login, klik 'Lupa password?' → Masukkan email kamu → Check inbox untuk link reset password → Buat password baru. Selesai!"
            },
            {
                question: "Kenapa notifikasi tidak muncul?",
                answer: "Pastikan notifikasi sudah diaktifkan di Profile → Notifikasi. Check juga permission notifikasi di browser/device settings kamu."
            },
        ]
    },
];

export default function FAQPage() {
    const [activeCategory, setActiveCategory] = useState("general");
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

    const currentCategory = faqCategories.find(c => c.id === activeCategory);

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
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white">FAQ</h1>
                        <p className="text-xs text-slate-500">Pertanyaan yang sering diajukan</p>
                    </div>
                </div>
            </motion.header>

            <div className="px-6 py-6 space-y-6">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8"
                >
                    <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/30">
                        <HelpCircle size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Ada Pertanyaan?
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                        Kami sudah kumpulkan pertanyaan yang paling sering ditanyakan pengguna Monev
                    </p>
                </motion.div>

                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {faqCategories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => {
                                setActiveCategory(category.id);
                                setExpandedQuestion(null);
                            }}
                            className={cn(
                                "px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all",
                                activeCategory === category.id
                                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
                                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                            )}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* FAQ List */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeCategory}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-3"
                    >
                        {currentCategory?.questions.map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                            >
                                <button
                                    onClick={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
                                    className="w-full p-4 flex items-center gap-4 text-left"
                                >
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm leading-relaxed">
                                            {faq.question}
                                        </h4>
                                    </div>
                                    <div className={cn(
                                        "w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-transform",
                                        expandedQuestion === index && "rotate-180"
                                    )}>
                                        <ChevronDown size={16} className="text-slate-400" />
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {expandedQuestion === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 pb-4">
                                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                                        {faq.answer}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>

                {/* Contact Support */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white text-center shadow-xl shadow-indigo-500/20"
                >
                    <MessageCircle size={32} className="mx-auto mb-3 opacity-80" />
                    <h3 className="font-bold text-lg mb-2">Masih Ada Pertanyaan?</h3>
                    <p className="text-sm text-indigo-100 mb-4">
                        Tim support kami siap membantu kamu 24/7
                    </p>
                    <a
                        href="mailto:alifpm55@gmail.com"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
                    >
                        <MessageCircle size={18} />
                        Kirim Email
                    </a>
                </motion.div>
            </div>
        </div>
    );
}
