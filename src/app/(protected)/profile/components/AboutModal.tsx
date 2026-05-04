"use client";

import { Info, Github, Instagram, Globe, Heart } from "lucide-react";
import Image from "next/image";

export function AboutModal() {
    return (
        <div className="space-y-8 py-2">
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-sky-500 to-cyan-600 shadow-xl shadow-sky-500/20 flex items-center justify-center p-5">
                    <div className="w-full h-full border-4 border-white/30 rounded-2xl flex items-center justify-center">
                        <span className="text-white text-3xl font-black italic">M</span>
                    </div>
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Monev</h3>
                    <p className="text-xs font-bold text-sky-500 uppercase tracking-widest">Version 1.0.0 (Agentic Finance)</p>
                </div>
            </div>

            <div className="card-clean p-6 space-y-4 bg-slate-50/50 dark:bg-slate-800/30 border-dashed">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed text-center italic">
                    "Aplikasi pencatat keuangan pintar yang dirancang untuk membantu Anda mencapai kebebasan finansial dengan bantuan teknologi AI."
                </p>
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
                    <span>Made with</span>
                    <Heart size={14} className="text-rose-500 fill-rose-500 animate-pulse" />
                    <span>by Creative Alip</span>
                </div>
            </div>

            <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Hubungkan & Ikuti</h4>
                <div className="grid grid-cols-2 gap-3">
                    <a href="https://github.com" target="_blank" rel="noopener" className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-sky-500/50 transition-all">
                        <Github size={18} className="text-slate-900 dark:text-white" />
                        <span className="text-xs font-bold">GitHub</span>
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noopener" className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-sky-500/50 transition-all">
                        <Instagram size={18} className="text-pink-500" />
                        <span className="text-xs font-bold">Instagram</span>
                    </a>
                    <a href="#" target="_blank" rel="noopener" className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-sky-500/50 transition-all">
                        <Globe size={18} className="text-sky-500" />
                        <span className="text-xs font-bold">Website</span>
                    </a>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 opacity-60">
                        <Info size={18} className="text-slate-400" />
                        <span className="text-xs font-bold">Docs</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    <a href="#" className="hover:text-sky-500 transition-colors">Syarat & Ketentuan</a>
                    <a href="#" className="hover:text-sky-500 transition-colors">Kebijakan Privasi</a>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">© 2026 Monev Project. All Rights Reserved.</p>
            </div>
        </div>
    );
}
