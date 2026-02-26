"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Bell,
    Smartphone,
    Zap,
    Copy,
    Check,
    Download,
    Terminal,
    AlertCircle,
    Info,
    ChevronRight,
    ExternalLink,
    Settings,
    Layers,
    Cpu,
    MessageSquare,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/frontend/lib/api-client";

type AutomationApp = "macrodroid" | "tasker" | "automate";

export default function NotificationGuidePage() {
    const [config, setConfig] = useState<any>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [activeStep, setActiveStep] = useState(1);
    const [selectedApp, setSelectedApp] = useState<AutomationApp>("macrodroid");

    useEffect(() => {
        apiFetch("/api/config/notifications").then(res => res.json()).then(res => {
            if (res.success) setConfig(res.data);
        });
    }, []);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const automationApps = [
        { id: "macrodroid", name: "MacroDroid", icon: Zap, color: "rose" },
        { id: "tasker", name: "Tasker", icon: Settings, color: "orange" },
        { id: "automate", name: "Automate", icon: Cpu, color: "blue" },
    ];

    const guides = {
        macrodroid: {
            steps: [
                { id: 1, title: "Install MacroDroid", desc: "Download dari Play Store. Berikan izin 'Notification Access' di pengaturan HP.", icon: Download, color: "blue" },
                { id: 2, title: "Triggers (Merah)", desc: "Klik + -> Device Events -> Notification -> Notification Received -> Select App(s) -> Pilih Bank kamu.", icon: Bell, color: "rose" },
                { id: 3, title: "Actions (Biru)", desc: "Klik + -> Web -> HTTP Request -> Method: POST. Masukkan URL dan JSON body di bawah.", icon: Zap, color: "amber" },
                { id: 4, title: "Simpan", desc: "Beri nama Macro, lalu klik icon centang di pojok kanan bawah.", icon: Terminal, color: "indigo" }
            ],
            helper: [
                { label: "TRIGGER", val: "Device Events > Notification > Notification Received", color: "rose" },
                { label: "ACTION", val: "Web > HTTP Request", color: "blue" },
                { label: "BODY", val: "Pilih 'Content Body' > Masukkan JSON", color: "amber" },
                { label: "METHOD", val: "POST", color: "emerald" }
            ],
            tips: "Pastikan kamu memasukkan variable <b>[not_app_name]</b>, <b>[not_title]</b>, dan <b>[not_body]</b> dengan benar."
        },
        tasker: {
            steps: [
                { id: 1, title: "Install Tasker", desc: "Beli & Install Tasker dari Play Store. Aplikasi ini sangat robust untuk power user.", icon: Download, color: "blue" },
                { id: 2, title: "Create Profile", desc: "Klik + -> Event -> UI -> Notification -> Owner Application -> Pilih Bank kamu.", icon: Bell, color: "rose" },
                { id: 3, title: "Create Task", desc: "Klik + -> Net -> HTTP Request. Method: POST. Masukkan URL, Headers, dan Body.", icon: Zap, color: "amber" },
                { id: 4, title: "Allow External", desc: "Di Settings Tasker, pastikan 'Allow External Access' dicentang jika perlu.", icon: Terminal, color: "indigo" }
            ],
            helper: [
                { label: "PROFILE", val: "Event > UI > Notification", color: "rose" },
                { label: "ACTION", val: "Net > HTTP Request", color: "blue" },
                { label: "HEADERS", val: "Content-Type: application/json", color: "amber" },
                { label: "METHOD", val: "POST", color: "emerald" }
            ],
            tips: "Gunakan variable <b>%evtprm2</b> (App), <b>%evtprm3</b> (Title), dan <b>%evtprm4</b> (Body) di JSON body kamu."
        },
        automate: {
            steps: [
                { id: 1, title: "Install Automate", desc: "Download Automate (LlamaLab) dari Play Store. Menawarkan flow-chart visual.", icon: Download, color: "blue" },
                { id: 2, title: "Notification Posted", desc: "Tambah blok 'Notification posted?'. Pilih Package bank kamu.", icon: Bell, color: "rose" },
                { id: 3, title: "HTTP Request", desc: "Tambah blok 'HTTP request'. Masukkan URL, Payload, dan Content Type.", icon: Zap, color: "amber" },
                { id: 4, title: "Connect Blocks", desc: "Hubungkan 'YES' dari Notification ke HTTP Request. Klik centang untuk simpan.", icon: Terminal, color: "indigo" }
            ],
            helper: [
                { label: "BLOCK 1", val: "Interface > Notification posted?", color: "rose" },
                { label: "BLOCK 2", val: "Network > HTTP request", color: "blue" },
                { label: "CONTENT", val: "Request content: [JSON]", color: "amber" },
                { label: "TYPE", val: "application/json", color: "emerald" }
            ],
            tips: "Map output dari Notification Posted (Title, Text, Package) ke dalam JSON payload blok HTTP Request."
        }
    };

    const currentGuide = guides[selectedApp];

    const jsonSnippet = `{
  "app": "${selectedApp === 'tasker' ? '%evtprm2' : '[not_app_name]'}",
  "title": "${selectedApp === 'tasker' ? '%evtprm3' : '[not_title]'}",
  "body": "${selectedApp === 'tasker' ? '%evtprm4' : '[not_body]'}",
  "timestamp": ${Date.now()},
  "apiKey": "${config?.apiKey || 'LOADING...'}",
  "telegramId": "${config?.telegramId || 'LOG_IN_TELEGRAM'}"
}`;

    if (!config) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Menyiapkan konfigurasi asisten...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-white pb-28">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 pt-safe pb-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/fitur"
                        className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all"
                    >
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Notification Listener</h1>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Setup Guide</p>
                    </div>
                </div>
            </header>

            <main className="p-6 space-y-8">
                {/* Hero Card */}
                <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl shadow-slate-200">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                            <Smartphone className="text-blue-400" size={24} />
                        </div>
                        <h2 className="text-2xl font-black mb-2">Otomatisasi Catatan</h2>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            Ubah notifikasi HP menjadi catatan transaksi otomatis menggunakan AI. Cukup sekali setup, belanjaan kamu langsung tercatat!
                        </p>
                    </div>
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/20 blur-[80px] rounded-full"></div>
                </section>

                {/* App Selector Tabs */}
                <section className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">Pilih Aplikasi Automasi</h3>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                        {automationApps.map((app) => {
                            const Icon = app.icon;
                            const isActive = selectedApp === app.id;
                            return (
                                <button
                                    key={app.id}
                                    onClick={() => {
                                        setSelectedApp(app.id as AutomationApp);
                                        setActiveStep(1);
                                    }}
                                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all ${isActive
                                        ? "bg-white text-slate-900 shadow-sm shadow-slate-200"
                                        : "text-slate-500 hover:bg-white/50"
                                        }`}
                                >
                                    <Icon size={18} className={isActive ? `text-${app.color}-500` : "text-slate-400"} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{app.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Steps Accordion */}
                <section className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">Langkah Setup ({automationApps.find(a => a.id === selectedApp)?.name})</h3>
                    <div className="space-y-3">
                        {currentGuide.steps.map((step) => (
                            <div
                                key={step.id}
                                className={`group p-4 rounded-2xl border transition-all duration-300 ${activeStep === step.id
                                    ? "bg-white border-blue-200 shadow-sm"
                                    : "bg-slate-50 border-transparent"
                                    }`}
                                onClick={() => setActiveStep(step.id)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-${step.color}-100 text-${step.color}-600`}>
                                        <step.icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-slate-900 tracking-tight">{step.title}</h4>
                                            <div className="text-[10px] font-black text-slate-300">0{step.id}</div>
                                        </div>
                                        <AnimatePresence mode="wait">
                                            {activeStep === step.id && (
                                                <motion.p
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="text-xs text-slate-500 mt-2 leading-relaxed overflow-hidden"
                                                >
                                                    {step.desc}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Webhook Configuration */}
                <section className="space-y-4 pt-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Webhook Config</h3>
                        {!config.telegramId && (
                            <Link href="/profile" className="text-[10px] font-bold text-rose-500 flex items-center gap-1 animate-pulse">
                                <AlertCircle size={12} /> TELEGRAM BELUM CONNECT
                            </Link>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 px-1">URL (HTTP POST)</label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs font-mono text-slate-600 truncate">
                                    {config.webhookUrl}
                                </div>
                                <button
                                    onClick={() => copyToClipboard(config.webhookUrl, 'url')}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${copiedField === 'url' ? "bg-emerald-500 text-white" : "bg-white border border-slate-200 text-slate-400"
                                        }`}
                                >
                                    {copiedField === 'url' ? <Check size={20} /> : <Copy size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-xs font-bold text-slate-500">JSON Body (Raw)</label>
                                <button
                                    onClick={() => copyToClipboard(jsonSnippet, 'json')}
                                    className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    {copiedField === 'json' ? "COPIED" : "COPY JSON"}
                                </button>
                            </div>
                            <div className="relative group">
                                <pre className="bg-slate-900 p-4 rounded-3xl text-[10px] leading-6 font-mono text-blue-300 overflow-x-auto shadow-xl">
                                    {jsonSnippet}
                                </pre>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Detailed Menu Path Helper */}
                <section className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 text-center">Detail Menu {automationApps.find(a => a.id === selectedApp)?.name}</h3>
                    <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative">
                        <div className="space-y-4 text-xs font-mono relative z-10">
                            {currentGuide.helper.map((item, idx) => (
                                <div key={idx} className={`flex gap-3 border-l-2 border-${item.color}-500 pl-4 py-1`}>
                                    <span className={`text-${item.color}-400 font-bold uppercase`}>{item.label}:</span>
                                    <span>{item.val}</span>
                                </div>
                            ))}
                        </div>
                        <div className="absolute top-0 right-0 p-4">
                            <Smartphone className="text-slate-800" size={80} />
                        </div>
                    </div>
                </section>

                {/* Tips */}
                <section className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100/50">
                    <div className="flex gap-3">
                        <Info className="text-blue-500 shrink-0" size={20} />
                        <div>
                            <h4 className="text-xs font-bold text-blue-900 mb-1 tracking-tight">Tips: {automationApps.find(a => a.id === selectedApp)?.name}</h4>
                            <p className="text-[10px] leading-relaxed text-blue-700/80 italic" dangerouslySetInnerHTML={{ __html: currentGuide.tips }} />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
