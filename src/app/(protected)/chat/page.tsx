"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bot,
    User,
    Send,
    ArrowLeft,
    Sparkles,
    MoreVertical,
    FileText,
    Camera,
    Mic,
    TrendingUp,
    X
} from "lucide-react";
import Link from "next/link";
import Markdown from "react-markdown";
import { useToast } from "@/frontend/components/UI";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { useSession } from "next-auth/react";
import { UserTier, canUseAI, getTierConfig } from "@/lib/tier-gate";
import { QuickReplies } from "@/frontend/components/QuickReplies";
import { SmartInput } from "@/frontend/components/SmartInput";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    image?: string;
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

function generateMessageId(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for non-secure contexts (HTTP) or older browsers
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default function ChatPage() {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();
    const [smartInputMode, setSmartInputMode] = useState<"screenshot" | "voice" | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!session?.user?.id) return;

        const storageKey = `monev_chat_history_${session.user.id}`;

        const loadFromServer = async () => {
            try {
                const res = await apiFetch("/api/chat/history?limit=50");
                const data = await res.json();
                if (data.success && data.data?.length > 0) {
                    const serverMessages: Message[] = data.data.map(
                        (m: { id: number; role: string; content: string; createdAt: number }) => ({
                            id: String(m.id),
                            role: m.role as "user" | "assistant",
                            content: m.content,
                            timestamp: new Date(m.createdAt * 1000),
                        })
                    );
                    setMessages(serverMessages);
                    localStorage.setItem(storageKey, JSON.stringify(serverMessages));
                    return;
                }
            } catch (e) {
                console.error("Failed to load from server, falling back to localStorage:", e);
            }

            // Fallback to localStorage
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    const revived = parsed.map((m: any) => ({
                        ...m,
                        timestamp: new Date(m.timestamp)
                    }));
                    setMessages(revived);
                } catch (e) {
                    console.error("Failed to load chat history:", e);
                    initializeChat(storageKey);
                }
            } else {
                initializeChat(storageKey);
            }
        };

        loadFromServer().then(() => setIsHistoryLoaded(true));
    }, [session?.user?.id]);

    const initializeChat = (key: string) => {
        const userName = session?.user?.name || "Pengguna";
        const initialMessage: Message = {
            id: generateMessageId(),
            role: "assistant",
            content: `Halo ${userName}! Saya Monev AI Assistant. Saya siap membantumu menganalisis pengeluaran, memantau target tabungan, atau sekadar memberikan tips hemat hari ini. 💰✨\n\nApa yang ingin kamu diskusikan pertama kali?`,
            timestamp: new Date(),
        };
        setMessages([initialMessage]);
        localStorage.setItem(key, JSON.stringify([initialMessage]));
    }

    // Save to localStorage whenever messages change
    useEffect(() => {
        if (messages.length > 0 && session?.user?.id && isHistoryLoaded) {
            const storageKey = `monev_chat_history_${session.user.id}`;
            localStorage.setItem(storageKey, JSON.stringify(messages));
        }
    }, [messages, session?.user?.id, isHistoryLoaded]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // @ts-ignore
    const userTier = (session?.user?.tier as UserTier) || "miskin";
    const tierConfig = getTierConfig(userTier);

    const getDailyUsage = (): number => {
        const today = new Date().toISOString().split('T')[0];
        const key = `monev_ai_usage_${session?.user?.id}_${today}`;
        return parseInt(localStorage.getItem(key) || "0", 10);
    };

    const incrementDailyUsage = () => {
        const today = new Date().toISOString().split('T')[0];
        const key = `monev_ai_usage_${session?.user?.id}_${today}`;
        const current = getDailyUsage();
        localStorage.setItem(key, String(current + 1));
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSend = async (customText?: string) => {
        const textToSend = customText || input;
        if (!textToSend.trim() && !selectedImage) return;

        // Check daily AI limit
        if (!canUseAI(getDailyUsage(), userTier)) {
            toast.error("Batas Harian Tercapai", `Tier ${tierConfig.name} hanya bisa ${tierConfig.aiDailyLimit} pesan/hari. Upgrade untuk akses unlimited!`);
            return;
        }

        const userMessage: Message = {
            id: generateMessageId(),
            role: "user",
            content: textToSend,
            image: selectedImage || undefined,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        const currentImage = selectedImage;
        if (!customText) setInput("");
        setSelectedImage(null);
        setIsTyping(true);
        // Prepare history (last 10 messages)
        const historyContext = messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
        }));

        try {
            const response = await apiFetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: textToSend,
                    history: historyContext,
                    imageBase64: currentImage
                }),
            });

            const data = await response.json();

            if (data.reply) {
                const aiMessage: Message = {
                    id: generateMessageId(),
                    role: "assistant",
                    content: data.reply,
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, aiMessage]);
                incrementDailyUsage();
            } else {
                throw new Error(data.error || "Gagal mendapatkan respons AI");
            }
        } catch (error: any) {
            console.error("Chat Error:", error);
            const errorMessage: Message = {
                id: generateMessageId(),
                role: "assistant",
                content: `Waduh, sepertinya saya sedang ngantuk nih. 😴\n\nError: ${error.message || "Unknown error"}`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Browser Tidak Mendukung", "Fitur diktasi suara tidak tersedia di browser ini.");
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = "id-ID";
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev + (prev ? " " : "") + transcript);
            };

            recognition.onerror = (event: any) => {
                console.error("Speech Recognition Error:", event.error);
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    toast.error("Izin Ditolak", "Mikrofon diblokir oleh browser.");
                }
            };

            recognition.start();
            recognitionRef.current = recognition;
        } catch (e) {
            console.error("Speech recognition initialization failed", e);
            setIsListening(false);
        }
    };

    const handleQuickAction = (actionId: string) => {
        const actionMessages: Record<string, string> = {
            record: "Saya ingin mencatat transaksi baru",
            goals: "Cek progress goal saya dong",
            analysis: "Analisis pengeluaran bulan ini",
            tips: "Kasih tips hemat dong",
        };

        handleSend(actionMessages[actionId]);
    };

    return (
        <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 px-6 pt-safe pt-3 pb-4"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:text-sky-600 dark:hover:text-sky-400 transition-all"
                        >
                            <ArrowLeft size={16} strokeWidth={2.5} />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center">
                                <Bot className="text-white" size={16} />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">Monev AI</h1>
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Online</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (confirm("Hapus semua riwayat chat?")) {
                                if (session?.user?.id) {
                                    const storageKey = `monev_chat_history_${session.user.id}`;
                                    localStorage.removeItem(storageKey);
                                    initializeChat(storageKey); // Reset chat state without page reload
                                }
                            }
                        }}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all"
                    >
                        <MoreVertical size={16} />
                    </button>
                </div>
            </motion.header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Welcome Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-4 border border-blue-100 dark:border-slate-700"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="text-sky-600 dark:text-sky-400" size={18} />
                        <span className="text-sm font-semibold text-sky-900 dark:text-sky-300">Quick Actions</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.id}
                                    onClick={() => handleQuickAction(action.id)}
                                    className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-sky-100 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600 hover:shadow-sm transition-all text-left"
                                >
                                    <Icon className="text-sky-600 dark:text-sky-400" size={16} />
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{action.label}</span>
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
                                    ? "bg-slate-200 dark:bg-slate-700"
                                    : "bg-gradient-to-br from-sky-500 to-cyan-600"
                            )}>
                                {message.role === "user" ? (
                                    <User size={14} className="text-slate-600 dark:text-slate-300" />
                                ) : (
                                    <Bot size={14} className="text-white" />
                                )}
                            </div>

                            {/* Message Bubble */}
                            <div className={cn(
                                "max-w-[80%] space-y-2",
                                message.role === "user" ? "items-end flex flex-col" : "items-start flex flex-col"
                            )}>
                                {message.image && (
                                    <div className="relative group rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 max-w-[200px]">
                                        <img
                                            src={message.image}
                                            alt="Chat Image"
                                            className="w-full h-auto object-cover"
                                        />
                                    </div>
                                )}
                                <div className={cn(
                                    "px-4 py-3 rounded-2xl",
                                    message.role === "user"
                                        ? "bg-sky-500 text-white rounded-br-md"
                                        : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-bl-md shadow-sm"
                                )}>
                                    {message.role === "assistant" ? (
                                        <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-2 prose-pre:bg-slate-100 prose-pre:dark:bg-slate-900 prose-code:text-sky-600 prose-code:dark:text-sky-400 prose-a:text-sky-600 prose-a:dark:text-sky-400 prose-a:underline">
                                            <Markdown
                                                components={{
                                                    a: ({ children, href, ...props }) => (
                                                        <a
                                                            href={href}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            {...props}
                                                        >
                                                            {children}
                                                        </a>
                                                    ),
                                                }}
                                            >
                                                {message.content}
                                            </Markdown>
                                        </div>
                                    ) : (
                                        <p className="text-sm whitespace-pre-line text-white">
                                            {message.content}
                                        </p>
                                    )}
                                    <p className={cn(
                                        "text-[10px] mt-1",
                                        message.role === "user" ? "text-sky-200" : "text-slate-400"
                                    )}>
                                        {message.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
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
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center">
                            <Bot size={14} className="text-white" />
                        </div>
                        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                    <motion.div
                                        animate={{ y: [0, -4, 0] }}
                                        transition={{ repeat: Infinity, duration: 0.5, delay: 0 }}
                                        className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full"
                                    />
                                    <motion.div
                                        animate={{ y: [0, -4, 0] }}
                                        transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }}
                                        className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full"
                                    />
                                    <motion.div
                                        animate={{ y: [0, -4, 0] }}
                                        transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }}
                                        className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full"
                                    />
                                </div>
                                <span className="text-xs text-slate-400">Monev AI sedang mengetik...</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Quick Replies - Show after AI messages */}
                {!isTyping && messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="pl-11"
                    >
                        <QuickReplies
                            onSelect={(query) => handleSend(query)}
                            context="general"
                        />
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-3 flex items-center gap-3"
                    >
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                            <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/50 text-white flex items-center justify-center hover:bg-slate-900 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Gambar terpilih</p>
                            <p className="text-[10px] text-slate-400">Siap dianalisis oleh AI</p>
                        </div>
                    </motion.div>
                )}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 mr-1">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageSelect}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Upload Gambar/Screenshot"
                        >
                            <Camera size={18} />
                        </button>
                        <button
                            onClick={() => setSmartInputMode("voice")}
                            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Catat Suara"
                        >
                            <Mic size={18} />
                        </button>
                    </div>
                    <div className="flex-1 relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={isListening ? "Mendengarkan..." : "Ketik pesan..."}
                            className={cn(
                                "w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-slate-800 rounded-full text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all",
                                isListening && "ring-2 ring-rose-500/30 bg-rose-50/50 dark:bg-rose-900/10"
                            )}
                        />
                        <div className="absolute right-2 flex items-center gap-1">
                            <button
                                onClick={toggleListening}
                                title="Dikte Suara"
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                    isListening
                                        ? "bg-rose-500 text-white animate-pulse"
                                        : "text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                )}
                            >
                                <Mic size={16} />
                            </button>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSend()}
                        disabled={(!input.trim() && !selectedImage) || isListening}
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                            (input.trim() || selectedImage) && !isListening
                                ? "bg-sky-500 text-white hover:bg-sky-600"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                        )}
                    >
                        <Send size={18} />
                    </motion.button>
                </div>
            </div>

            {/* Smart Input Modal */}
            {smartInputMode && (
                <SmartInput
                    mode={smartInputMode}
                    onClose={() => setSmartInputMode(null)}
                    onSuccess={(data) => {
                        toast.success("Transaksi Dicatat", `${data.merchantName} - ${formatCurrency(data.amount)}`);
                        setSmartInputMode(null);
                    }}
                />
            )}
        </div>
    );
}
