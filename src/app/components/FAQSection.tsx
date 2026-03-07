"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/frontend/lib/utils";

const faqs = [
    {
        id: 1,
        question: "Apakah data keuangan saya aman di Monev?",
        answer: "Sangat aman! Kami menggunakan enkripsi end-to-end untuk semua data sensitif. Data disimpan di server yang dilindungi dengan protokol keamanan enterprise-grade. Kami juga tidak pernah menjual atau membagikan data pengguna kepada pihak ketiga."
    },
    {
        id: 2,
        question: "Bagaimana cara kerja fitur AI di Monev?",
        answer: "AI kami menggunakan teknologi natural language processing untuk memahami input kamu. Cukup ketik 'tadi beli kopi 20rb' atau screenshot struk, AI akan otomatis mendeteksi nominal, kategori, dan merchant. Semua proses real-time dan instan!"
    },
    {
        id: 3,
        question: "Apakah Monev gratis digunakan?",
        answer: "Ya! Monev memiliki plan gratis (Miskin) yang sudah cukup lengkap dengan fitur dasar. Untuk fitur premium seperti unlimited AI, Telegram bot, dan advanced analytics, kamu bisa upgrade ke plan Kaya atau Sultan dengan harga terjangkau."
    },
    {
        id: 4,
        question: "Bisakah saya export data ke Excel atau CSV?",
        answer: "Tentu! Semua data transaksi bisa di-export dalam format CSV atau Excel kapan saja. Fitur ini tersedia di semua tier, jadi kamu punya kontrol penuh atas data keuanganmu. Kami juga support import dari aplikasi lain seperti MoneyLover."
    },
    {
        id: 5,
        question: "Apakah ada aplikasi mobile untuk iOS/Android?",
        answer: "Monev adalah Progressive Web App (PWA) yang bisa di-install langsung ke homescreen iOS atau Android tanpa perlu download dari app store. Pengalaman pengguna sama seperti native app, lengkap dengan notifikasi push dan offline support."
    },
    {
        id: 6,
        question: "Bagaimana kalau saya butuh bantuan?",
        answer: "Tim support kami siap membantu! Kamu bisa kontak via email di support@monev.id atau langsung chat dengan AI Assistant di aplikasi. Response time kami rata-rata di bawah 2 jam untuk pertanyaan teknis."
    }
];

function FAQItem({ item, isOpen, onToggle }: { 
    item: typeof faqs[0]; 
    isOpen: boolean; 
    onToggle: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn(
                "border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all",
                isOpen && "border-sky-200 dark:border-sky-800 shadow-lg shadow-sky-500/10"
            )}
        >
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <span className="font-bold text-slate-900 dark:text-white pr-4">
                    {item.question}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                >
                    <ChevronDown size={20} className={cn(
                        "text-slate-400 transition-colors",
                        isOpen && "text-sky-500"
                    )} />
                </motion.div>
            </button>
            
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="px-6 pb-6 pt-0">
                            <div className="h-px bg-slate-100 dark:bg-slate-800 mb-4" />
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                {item.answer}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export function FAQSection() {
    const [openId, setOpenId] = useState<number | null>(1);

    return (
        <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full text-sm font-bold mb-4"
                    >
                        <HelpCircle size={16} className="inline-block mr-1" />
                        FAQ
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4"
                    >
                        Pertanyaan yang Sering
                        <span className="text-violet-500"> Ditanyakan</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto"
                    >
                        Temukan jawaban untuk pertanyaan umum tentang Monev
                    </motion.p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq) => (
                        <FAQItem
                            key={faq.id}
                            item={faq}
                            isOpen={openId === faq.id}
                            onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
                        />
                    ))}
                </div>

                {/* Contact CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className="mt-12 text-center p-8 bg-gradient-to-r from-violet-500 to-purple-600 rounded-3xl text-white"
                >
                    <h3 className="text-2xl font-bold mb-2">
                        Masih punya pertanyaan?
                    </h3>
                    <p className="text-violet-100 mb-6">
                        Tim kami siap membantu kamu 24/7
                    </p>
                    <a
                        href="mailto:support@monev.id"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-violet-600 font-bold rounded-xl hover:bg-violet-50 transition-colors"
                    >
                        Hubungi Support
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
