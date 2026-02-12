"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
    ChevronLeft, 
    Bot, 
    Database, 
    Key, 
    CheckCircle, 
    AlertCircle,
    Copy,
    ExternalLink,
    RefreshCw
} from "lucide-react";

interface ConfigStatus {
    telegram: boolean;
    supabase: boolean;
    openai: boolean;
}

export default function SettingsPage() {
    const [config, setConfig] = useState<ConfigStatus>({
        telegram: false,
        supabase: false,
        openai: false,
    });
    const [webhookStatus, setWebhookStatus] = useState<"checking" | "connected" | "error" | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        checkConfiguration();
    }, []);

    async function checkConfiguration() {
        try {
            // Check Telegram webhook
            const telegramRes = await fetch("/api/telegram-webhook");
            const telegramData = await telegramRes.json();
            
            // Check if we have the required env vars (we'll check via a simple API call)
            setConfig({
                telegram: telegramData.status === "ok",
                supabase: false, // Will be checked when we implement Supabase fully
                openai: false,   // Will be checked when we implement AI features
            });

            if (telegramData.status === "ok") {
                setWebhookStatus("connected");
            }
        } catch (error) {
            console.error("Error checking config:", error);
        }
    }

    function copyWebhookUrl() {
        const url = `${window.location.origin}/api/telegram-webhook`;
        navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    }

    const setupSteps = [
        {
            title: "1. Buat Bot Telegram",
            description: "Chat dengan @BotFather di Telegram untuk membuat bot baru",
            action: {
                label: "Buka @BotFather",
                href: "https://t.me/BotFather",
                external: true,
            },
        },
        {
            title: "2. Dapatkan Token",
            description: "Setelah membuat bot, copy token yang diberikan oleh @BotFather",
            action: null,
        },
        {
            title: "3. Set Environment Variable",
            description: "Tambahkan TELEGRAM_BOT_TOKEN ke file .env.local",
            code: "TELEGRAM_BOT_TOKEN=your_bot_token_here",
        },
        {
            title: "4. Setup Webhook",
            description: "Jalankan script setup untuk menghubungkan bot dengan webhook",
            code: "npx tsx scripts/setup-telegram-bot.ts",
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-b border-slate-200 px-6 pt-12 pb-4 sticky top-0 z-40"
            >
                <div className="flex items-center gap-3">
                    <Link 
                        href="/" 
                        className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-all"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900">Pengaturan</h1>
                </div>
            </motion.header>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md mx-auto px-6 py-6 space-y-6"
            >
                {/* Status Overview */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5"
                >
                    <h2 className="font-bold text-slate-900 mb-4">Status Konfigurasi</h2>
                    
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    config.telegram ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500"
                                }`}>
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">Telegram Bot</p>
                                    <p className="text-sm text-slate-500">
                                        {config.telegram ? "Terhubung" : "Belum dikonfigurasi"}
                                    </p>
                                </div>
                            </div>
                            {config.telegram ? (
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-slate-400" />
                            )}
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center">
                                    <Database className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">Supabase</p>
                                    <p className="text-sm text-slate-500">Coming soon</p>
                                </div>
                            </div>
                            <AlertCircle className="w-5 h-5 text-slate-400" />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center">
                                    <Key className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">OpenAI API</p>
                                    <p className="text-sm text-slate-500">Coming soon</p>
                                </div>
                            </div>
                            <AlertCircle className="w-5 h-5 text-slate-400" />
                        </div>
                    </div>
                </div>

                {/* Telegram Bot Setup */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900">Setup Telegram Bot</h2>
                            <p className="text-sm text-slate-500">Integrasi dengan Telegram untuk input cepat</p>
                        </div>
                    </div>

                    {config.telegram ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                            <div className="flex items-center gap-2 text-emerald-700 mb-2">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">Bot sudah terhubung!</span>
                            </div>
                            <p className="text-sm text-emerald-600">
                                Bot Anda sekarang aktif dan siap menerima perintah.
                            </p>
                        </div>
                    ) : null}

                    <div className="space-y-4">
                        {setupSteps.map((step, index) => (
                            <div key={index} className="border-l-2 border-slate-200 pl-4 pb-4 last:pb-0">
                                <h3 className="font-medium text-slate-900">{step.title}</h3>
                                <p className="text-sm text-slate-500 mt-1">{step.description}</p>
                                
                                {step.code && (
                                    <div className="mt-2 bg-slate-900 rounded-lg p-3 relative group">
                                        <code className="text-sm text-slate-300 font-mono">{step.code}</code>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(step.code || "");
                                                setCopySuccess(true);
                                                setTimeout(() => setCopySuccess(false), 2000);
                                            }}
                                            className="absolute top-2 right-2 p-1 rounded hover:bg-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                
                                {step.action && (
                                    <a
                                        href={step.action.href}
                                        target={step.action.external ? "_blank" : undefined}
                                        rel={step.action.external ? "noopener noreferrer" : undefined}
                                        className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        {step.action.label}
                                        {step.action.external && <ExternalLink className="w-4 h-4" />}
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Webhook Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5"
                >
                    <h2 className="font-bold text-slate-900 mb-4">Webhook URL</h2>
                    
                    <p className="text-sm text-slate-500 mb-3">
                        URL ini digunakan untuk menerima update dari Telegram:
                    </p>
                    
                    <div className="bg-slate-100 rounded-xl p-3 flex items-center justify-between gap-2"
                    >
                        <code className="text-sm text-slate-700 font-mono truncate"
                        >
                            {typeof window !== "undefined" ? `${window.location.origin}/api/telegram-webhook` : "Loading..."}
                        </code>
                        <button
                            onClick={copyWebhookUrl}
                            className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors flex-shrink-0"
                            title="Copy URL"
                        >
                            {copySuccess ? (
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                            ) : (
                                <Copy className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Commands Reference */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5"
                >
                    <h2 className="font-bold text-slate-900 mb-4">Perintah Telegram Bot</h2>
                    
                    <div className="space-y-2">
                        {[
                            { cmd: "/start", desc: "Memulai bot dan melihat menu utama" },
                            { cmd: "/help", desc: "Menampilkan bantuan penggunaan" },
                            { cmd: "/record", desc: "Mencatat transaksi baru (mode interaktif)" },
                            { cmd: "/balance", desc: "Melihat saldo dan ringkasan" },
                            { cmd: "/recent", desc: "Melihat 5 transaksi terbaru" },
                            { cmd: "/summary", desc: "Ringkasan bulan ini" },
                        ].map(({ cmd, desc }) => (
                            <div key={cmd} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg"
                            >
                                <code className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded flex-shrink-0"
                                >
                                    {cmd}
                                </code>
                                <span className="text-sm text-slate-600">{desc}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100"
                    >
                        <p className="text-sm text-slate-500">
                            <strong>Tip:</strong> Anda juga bisa langsung mengetik transaksi tanpa perintah, contoh: 
                            <code className="bg-slate-100 px-1 rounded">50000 makan siang</code>
                        </p>
                    </div>
                </div>

                {/* Refresh Button */}
                <button
                    onClick={checkConfiguration}
                    className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                    <RefreshCw className="w-5 h-5" />
                    Periksa Ulang Konfigurasi
                </button>
            </motion.div>
        </div>
    );
}
