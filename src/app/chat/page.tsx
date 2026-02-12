"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ArrowLeft, 
    Send, 
    Bot, 
    User, 
    Sparkles,
    MoreVertical,
    FileText,
    Camera,
    Mic,
    TrendingUp
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/frontend/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    actions?: Action[];
}

interface Action {
    id: string;
    label: string;
    icon: typeof FileText;
    onClick: () => void;
}

const quickActions = [
    { id: "record", label: "Catat transaksi", icon: FileText },
    { id: "goals", label: "Cek progress goal", icon: TrendingUp },
    { id: "analysis", label: "Analisis pengeluaran", icon: TrendingUp },
    { id: "tips", label: "Tips hemat", icon: Sparkles },
];

let messageIdCounter = 0;

function generateMessageId(): string {
    messageIdCounter += 1;
    return `msg-${messageIdCounter}`;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: generateMessageId(),
            role: "assistant",
            content: "Halo Alip! Saya Monev AI Assistant. Ada yang bisa saya bantu hari ini? 💰",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: generateMessageId(),
            role: "user",
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            const aiMessage: Message = {
                id: generateMessageId(),
                role: "assistant",
                content: "Terima kasih! Saya sedang memproses permintaanmu. Fitur chat AI ini akan segera terhubung dengan GPT-4o untuk memberikan respons yang lebih cerdas. 🚀",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMessage]);
            setIsTyping(false);
        }, 1500);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleQuickAction = (actionId: string) => {
        const actionMessages: Record<string, string> = {
            record: "Saya ingin mencatat transaksi baru",
            goals: "Cek progress goal saya dong",
            analysis: "Analisis pengeluaran bulan ini",
            tips: "Kasih tips hemat dong",
        };

        const userMessage: Message = {
            id: generateMessageId(),
            role: "user",
            content: actionMessages[actionId],
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsTyping(true);

        setTimeout(() => {
            const responses: Record<string, string> = {
                record: "Baik! Kamu bisa pilih metode input: 📝 Manual, 📸 Screenshot, 🎙️ Voice, atau 📱 Import notifikasi. Mau yang mana?",
                goals: "📊 Progress goalmu:\n\n🎯 MacBook Air M3: 42% (Rp 8.5jt / 20jt)\n✈️ Liburan Jepang: 14% (Rp 5jt / 35jt)\n\nKeep going! 💪",
                analysis: "📈 Analisis pengeluaran November:\n\n• Total: Rp 4.2jt\n• Tertinggi: Hiburan (Rp 1.2jt)\n• Hemat: Rp 800rb dari budget\n\nGood job! 🎉",
                tips: "💡 Tips hemat hari ini:\n\n1. Pakai fitur 'Time-Cost' untuk konversi harga ke jam kerja\n2. Aktifkan 'Goal Defender' untuk cegah impulse buying\n3. Cek 'Subscription Hunter' untuk langganan yang jarang dipakai",
            };

            const aiMessage: Message = {
                id: generateMessageId(),
                role: "assistant",
                content: responses[actionId],
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMessage]);
            setIsTyping(false);
        }, 1000);
    };

    return (
        <div className="relative min-h-screen flex flex-col bg-slate-50">
            {/* Header */}
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-40 glass border-b border-slate-200/50 px-4 pt-12 pb-4"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link 
                            href="/" 
                            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                                <Bot className="text-white" size={22} />
                            </div>
                            <div>
                                <h1 className="font-bold text-slate-900">Monev AI</h1>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-xs text-slate-500">Online</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </motion.header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Welcome Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="text-blue-600" size={18} />
                        <span className="text-sm font-semibold text-blue-900">Quick Actions</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.id}
                                    onClick={() => handleQuickAction(action.id)}
                                    className="flex items-center gap-2 p-3 bg-white rounded-xl border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all text-left"
                                >
                                    <Icon className="text-blue-600" size={16} />
                                    <span className="text-xs font-medium text-slate-700">{action.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Chat Messages */}
                <AnimatePresence>
                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={cn(
                                "flex gap-3",
                                message.role === "user" ? "flex-row-reverse" : "flex-row"
                            )}
                        >
                            {/* Avatar */}
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                message.role === "user" 
                                    ? "bg-slate-200" 
                                    : "bg-gradient-to-br from-blue-600 to-purple-600"
                            )}>
                                {message.role === "user" ? (
                                    <User size={14} className="text-slate-600" />
                                ) : (
                                    <Bot size={14} className="text-white" />
                                )}
                            </div>

                            {/* Message Bubble */}
                            <div className={cn(
                                "max-w-[80%] px-4 py-3 rounded-2xl",
                                message.role === "user"
                                    ? "bg-blue-600 text-white rounded-br-md"
                                    : "bg-white border border-slate-100 rounded-bl-md shadow-sm"
                            )}>
                                <p className={cn(
                                    "text-sm whitespace-pre-line",
                                    message.role === "user" ? "text-white" : "text-slate-800"
                                )}>
                                    {message.content}
                                </p>
                                <p className={cn(
                                    "text-[10px] mt-1",
                                    message.role === "user" ? "text-blue-200" : "text-slate-400"
                                )}>
                                    {message.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                            <Bot size={14} className="text-white" />
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                            <div className="flex gap-1">
                                <motion.div
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.5, delay: 0 }}
                                    className="w-2 h-2 bg-slate-300 rounded-full"
                                />
                                <motion.div
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }}
                                    className="w-2 h-2 bg-slate-300 rounded-full"
                                />
                                <motion.div
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }}
                                    className="w-2 h-2 bg-slate-300 rounded-full"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                        <Camera size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                        <Mic size={18} />
                    </button>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ketik pesan..."
                            className="w-full pl-4 pr-10 py-3 bg-slate-100 rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                            input.trim() 
                                ? "bg-blue-600 text-white hover:bg-blue-700" 
                                : "bg-slate-200 text-slate-400"
                        )}
                    >
                        <Send size={18} />
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
