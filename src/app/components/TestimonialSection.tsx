"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
    {
        id: 1,
        name: "Budi Santoso",
        role: "Freelancer Designer",
        avatar: "👨‍💻",
        content: "Monev benar-benar mengubah cara saya mengelola keuangan. Fitur AI-nya luar biasa, cukup bilang 'tadi beli kopi 25rb' dan langsung tercatat. Streak harian juga bikin saya jadi konsisten!",
        rating: 5
    },
    {
        id: 2,
        name: "Sarah Wijaya",
        role: "Startup Founder",
        avatar: "👩‍💼",
        content: "Sebagai founder, saya nggak punya waktu buat mikirin pencatatan manual. Monev dengan Telegram bot-nya sangat membantu. Bisa catat transaksi sambil meeting!",
        rating: 5
    },
    {
        id: 3,
        name: "Ahmad Rizky",
        role: "Content Creator",
        avatar: "🎥",
        content: "Analytics-nya keren banget! Bisa lihat pola pengeluaran dan dapat insight untuk hemat. Dalam 3 bulan, saya berhasil nabung 30% lebih banyak.",
        rating: 5
    },
    {
        id: 4,
        name: "Dewi Kusuma",
        role: "Mahasiswa",
        avatar: "📚",
        content: "Budgeting jadi mudah dengan Monev. Saya bisa atur budget per kategori dan dapat notifikasi kalau sudah mendekati limit. Recommended buat anak kos!",
        rating: 5
    },
    {
        id: 5,
        name: "Rudi Hartono",
        role: "Product Manager",
        avatar: "📊",
        content: "Integrasi AI-nya seamless. Screenshot struk langsung ke-detect semua item-nya. Saves me hours every month untuk expense tracking.",
        rating: 5
    }
];

const stats = [
    { value: "10.000+", label: "Pengguna Aktif" },
    { value: "4.9", label: "Rating App" },
    { value: "500.000+", label: "Transaksi Tercatat" },
    { value: "99.9%", label: "Uptime" }
];

export function TestimonialSection() {
    return (
        <section className="py-24 px-6 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-bold mb-4"
                    >
                        Testimoni Pengguna
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4"
                    >
                        Dipercaya oleh Ribuan
                        <span className="text-emerald-500"> Orang</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto"
                    >
                        Bergabung dengan komunitas yang sudah merasakan manfaat mengelola keuangan dengan cerdas
                    </motion.p>
                </div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
                >
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            className="text-center p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
                        >
                            <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2">
                                {stat.value}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Testimonial Cards */}
                <div className="relative">
                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.slice(0, 3).map((testimonial, index) => (
                            <motion.div
                                key={testimonial.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 relative"
                            >
                                {/* Quote Icon */}
                                <div className="absolute -top-4 -right-4 w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                    <Quote size={20} className="text-white" />
                                </div>

                                {/* Rating */}
                                <div className="flex gap-1 mb-4">
                                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                                        <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                                    ))}
                                </div>

                                {/* Content */}
                                <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                                    &ldquo;{testimonial.content}&rdquo;
                                </p>

                                {/* Author */}
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center text-2xl">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white">
                                            {testimonial.name}
                                        </div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                            {testimonial.role}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* More testimonials indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.8 }}
                        className="text-center mt-8"
                    >
                        <p className="text-slate-400 dark:text-slate-600 text-sm">
                            Dan {testimonials.length - 3}+ testimoni lainnya...
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
