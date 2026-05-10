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
    X,
    Zap,
    RotateCcw,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import Markdown from "react-markdown";
import { BottomNav } from "@/frontend/components/BottomNav";
import { useToast } from "@/frontend/components/UI";
import { ConfirmDialog } from "@/frontend/components/ConfirmDialog";
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
    transaction?: ChatTransaction;
    actionResult?: ChatActionResult;
    undoneTransactionId?: number | null;
}

interface ChatActionResult {
    type: "transaction_created" | "transaction_undone" | "general";
    title: string;
    description?: string;
    amount?: number;
    category?: string;
    transactionType?: "expense" | "income" | "transfer";
}

interface ChatTransaction {
    id: number;
    amount: number;
    description: string;
    category: string;
    type: "expense" | "income" | "transfer";
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

function parseMessageTimestamp(value: unknown): Date {
    if (value instanceof Date) return value;
    if (typeof value === "number") {
        return new Date(value < 100000000000 ? value * 1000 : value);
    }
    if (typeof value === "string") {
        const numericValue = Number(value);
        const date = Number.isFinite(numericValue)
            ? new Date(numericValue < 100000000000 ? numericValue * 1000 : numericValue)
            : new Date(value);
        if (!Number.isNaN(date.getTime())) return date;
    }
    return new Date();
}

function formatMessageTime(timestamp: Date): string {
    const date = parseMessageTimestamp(timestamp);
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function buildActionResult(data: { transaction?: ChatTransaction; undoneTransactionId?: number | null }): ChatActionResult | undefined {
    if (data.transaction) {
        return {
            type: "transaction_created",
            title: data.transaction.type === "income" ? "Pemasukan tercatat" : "Pengeluaran tercatat",
            description: data.transaction.description,
            amount: data.transaction.amount,
            category: data.transaction.category,
            transactionType: data.transaction.type,
        };
    }

    if (data.undoneTransactionId) {
        return {
            type: "transaction_undone",
            title: "Transaksi berhasil di-undo",
            description: "Saldo dan statistik akan ikut disesuaikan.",
        };
    }

    return undefined;
}

export default function ChatPage() {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();
    const [smartInputMode, setSmartInputMode] = useState<"screenshot" | "voice" | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [viewportHeight, setViewportHeight] = useState(0);
    const viewportBaselineRef = useRef(0);
    const [dailyUsage, setDailyUsage] = useState(0);

    const handleClearChat = () => {
        if (session?.user?.id) {
            const storageKey = `monev_chat_history_${session.user.id}`;
            localStorage.removeItem(storageKey);
            initializeChat(storageKey);
        }
        setShowClearConfirm(false);
    };

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
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
                        (m: { id: number; role: string; content: string; createdAt: number | string | Date }) => ({
                            id: String(m.id),
                            role: m.role as "user" | "assistant",
                            content: m.content,
                            timestamp: parseMessageTimestamp(m.createdAt),
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
                        timestamp: parseMessageTimestamp(m.timestamp)
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
    }, [messages, isTyping]);

    useEffect(() => {
        if (!isKeyboardOpen) return;
        const timers = [80, 240, 420].map((delay) =>
            window.setTimeout(() => scrollToBottom("auto"), delay)
        );
        return () => timers.forEach(window.clearTimeout);
    }, [isKeyboardOpen, viewportHeight]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = "0px";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 108)}px`;
    }, [input]);

    useEffect(() => {
        const focusableSelector = "input, textarea, select, [contenteditable='true']";
        const blurDelayRef = { current: 0 };
        const updateViewport = () => {
            const height = window.visualViewport?.height ?? window.innerHeight;
            viewportBaselineRef.current = Math.max(viewportBaselineRef.current, height, window.innerHeight);
            const viewportShrunk = height < viewportBaselineRef.current - 120;
            setViewportHeight(height);

            window.clearTimeout(blurDelayRef.current);
            if (viewportShrunk) {
                setIsKeyboardOpen(true);
                window.setTimeout(() => scrollToBottom("auto"), 80);
                return;
            }

            blurDelayRef.current = window.setTimeout(() => {
                const currentHeight = window.visualViewport?.height ?? window.innerHeight;
                viewportBaselineRef.current = Math.max(viewportBaselineRef.current, currentHeight, window.innerHeight);
                setIsKeyboardOpen(currentHeight < viewportBaselineRef.current - 120);
            }, 180);
        };

        window.visualViewport?.addEventListener("resize", updateViewport);
        window.visualViewport?.addEventListener("scroll", updateViewport);
        window.addEventListener("resize", updateViewport);
        document.addEventListener("focusin", updateViewport);
        document.addEventListener("focusout", updateViewport);
        updateViewport();

        return () => {
            window.visualViewport?.removeEventListener("resize", updateViewport);
            window.visualViewport?.removeEventListener("scroll", updateViewport);
            window.removeEventListener("resize", updateViewport);
            document.removeEventListener("focusin", updateViewport);
            document.removeEventListener("focusout", updateViewport);
            window.clearTimeout(blurDelayRef.current);
        };
    }, []);

    const userTier: UserTier = session?.user?.tier || "starter";
    const tierConfig = getTierConfig(userTier);

    const getDailyUsage = (): number => dailyUsage;

    useEffect(() => {
        if (!session?.user?.id) return;
        const today = new Date().toISOString().split('T')[0];
        const key = `monev_ai_usage_${session.user.id}_${today}`;
        const storedUsage = parseInt(localStorage.getItem(key) || "0", 10);
        setDailyUsage(Number.isNaN(storedUsage) ? 0 : storedUsage);
    }, [session?.user?.id]);

    const incrementDailyUsage = () => {
        if (!session?.user?.id) return;
        const today = new Date().toISOString().split('T')[0];
        const key = `monev_ai_usage_${session.user.id}_${today}`;
        const nextUsage = dailyUsage + 1;
        setDailyUsage(nextUsage);
        localStorage.setItem(key, String(nextUsage));
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
                    transaction: data.transaction,
                    actionResult: buildActionResult(data),
                    undoneTransactionId: data.undoneTransactionId,
                };
                setMessages((prev) => [...prev, aiMessage]);
                if (data.goal) {
                    window.dispatchEvent(new Event("goalsChanged"));
                }
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

    const handleUndoTransaction = async (transactionId: number) => {
        setIsTyping(true);
        try {
            const response = await apiFetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ undoTransactionId: transactionId }),
            });
            const data = await response.json();

            if (!data.reply) {
                throw new Error(data.error || "Gagal undo transaksi");
            }

            const undoMessage: Message = {
                id: generateMessageId(),
                role: "assistant",
                content: data.reply,
                timestamp: new Date(),
                actionResult: buildActionResult(data),
                undoneTransactionId: data.undoneTransactionId,
            };

            setMessages((prev) => [
                ...prev.map((message) => (
                    message.transaction?.id === transactionId
                        ? { ...message, undoneTransactionId: transactionId }
                        : message
                )),
                undoMessage,
            ]);
        } catch (error: any) {
            console.error("Undo transaction error:", error);
            toast.error("Undo Gagal", error.message || "Transaksi belum bisa di-undo sekarang.");
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
        <div
            className="relative overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950"
            style={{ height: viewportHeight ? `${viewportHeight}px` : "calc(100dvh - 4.75rem)" }}
        >
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "sticky top-0 z-50 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 px-4 sm:px-6 pt-safe transition-all duration-200",
                    isKeyboardOpen ? "pt-2 pb-2" : "pt-3 pb-4"
                )}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
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
                        onClick={() => setShowClearConfirm(true)}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all"
                    >
                        <MoreVertical size={16} />
                    </button>
                </div>
                
                {/* Quota Indicator */}
                {userTier !== "sultan" && !isKeyboardOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800"
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                                <Zap size={12} className="text-amber-500" />
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                    Sisa Pesan AI Hari Ini
                                </span>
                            </div>
                            <span className="text-[10px] font-black text-slate-900 dark:text-white">
                                {Math.max(0, (tierConfig.aiDailyLimit ?? 100) - dailyUsage)} / {tierConfig.aiDailyLimit ?? 100}
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: "100%" }}
                                animate={{
                                    width: `${Math.min(100, (((tierConfig.aiDailyLimit ?? 100) - dailyUsage) / (tierConfig.aiDailyLimit ?? 100)) * 100)}%`
                                }}
                                className={cn(
                                    "h-full rounded-full transition-colors",
                                    dailyUsage >= (tierConfig.aiDailyLimit ?? 100) - 1 ? "bg-rose-500" :
                                    dailyUsage >= (tierConfig.aiDailyLimit ?? 100) / 2 ? "bg-amber-500" : "bg-emerald-500"
                                )}
                            />
                        </div>
                    </motion.div>
                )}
            </motion.header>

            {/* Messages */}
            <div className={cn(
                "flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth",
                isKeyboardOpen ? "pb-5" : "pb-6"
            )}>
                {/* Chat Messages */}
                <AnimatePresence>
                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            data-testid={`chat-message-${message.role}`}
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
                                                            className="text-sky-600 hover:underline"
                                                            {...props}
                                                        >
                                                            {children}
                                                        </a>
                                                    ),
                                                    ol: ({ children }) => (
                                                        <ol className="list-decimal list-inside space-y-3 my-2">
                                                            {children}
                                                        </ol>
                                                    ),
                                                    ul: ({ children }) => (
                                                        <ul className="list-disc list-inside space-y-3 my-2">
                                                            {children}
                                                        </ul>
                                                    ),
                                                    li: ({ children }) => (
                                                        <li className="text-sm leading-relaxed">
                                                            {children}
                                                        </li>
                                                    ),
                                                    p: ({ children }) => (
                                                        <p className="text-sm mb-2">
                                                            {children}
                                                        </p>
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
                                        {formatMessageTime(message.timestamp)}
                                    </p>
                                </div>
                                {message.role === "assistant" && message.actionResult && (
                                    <div className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/90 p-3 text-emerald-900 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
                                        <div className="flex items-start gap-2">
                                            <div className="mt-0.5 rounded-full bg-emerald-500 p-1 text-white">
                                                <CheckCircle2 size={13} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold">{message.actionResult.title}</p>
                                                {message.actionResult.description && (
                                                    <p className="mt-0.5 truncate text-xs text-emerald-700 dark:text-emerald-300">{message.actionResult.description}</p>
                                                )}
                                                {typeof message.actionResult.amount === "number" && (
                                                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                                        <span className="rounded-full bg-white/80 px-2 py-1 font-semibold text-emerald-700 dark:bg-slate-900/60 dark:text-emerald-300">
                                                            {formatCurrency(message.actionResult.amount)}
                                                        </span>
                                                        {message.actionResult.category && (
                                                            <span className="rounded-full bg-white/80 px-2 py-1 text-emerald-700 dark:bg-slate-900/60 dark:text-emerald-300">
                                                                {message.actionResult.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {message.role === "assistant" && message.transaction && (
                                    <button
                                        type="button"
                                        data-testid="chat-undo-transaction"
                                        onClick={() => handleUndoTransaction(message.transaction!.id)}
                                        disabled={message.undoneTransactionId === message.transaction.id || isTyping}
                                        className={cn(
                                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                                            message.undoneTransactionId === message.transaction.id
                                                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                                                : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                                        )}
                                    >
                                        <RotateCcw size={13} />
                                        {message.undoneTransactionId === message.transaction.id ? "Sudah di-undo" : "Undo transaksi"}
                                    </button>
                                )}
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
                {!isKeyboardOpen && !isTyping && messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
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
            <div className={cn(
                "shrink-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shadow-[0_-12px_30px_rgba(15,23,42,0.08)]",
                !isKeyboardOpen && "pb-24"
            )}>
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
                <div className="flex items-end gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                    />
                    {!isKeyboardOpen && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="mb-1 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Upload Gambar/Screenshot"
                        >
                            <Camera size={18} />
                        </button>
                    )}
                    <div className="flex-1 relative flex items-end">
                        <textarea
                            ref={textareaRef}
                            data-testid="chat-input"
                            rows={1}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            onFocus={() => window.setTimeout(() => scrollToBottom("auto"), 120)}
                            placeholder={isListening ? "Mendengarkan..." : "Ketik pesan..."}
                            className={cn(
                                "max-h-[108px] min-h-11 w-full resize-none rounded-2xl bg-slate-100 py-3 pl-4 pr-12 text-sm leading-5 text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500",
                                input.includes("\n") || input.length > 42 ? "rounded-3xl" : "rounded-full",
                                isListening && "ring-2 ring-rose-500/30 bg-rose-50/50 dark:bg-rose-900/10"
                            )}
                        />
                        <div className="absolute bottom-1.5 right-2 flex items-center gap-1">
                            <button
                                onClick={toggleListening}
                                title="Ketik dengan suara"
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                    isListening
                                        ? "bg-rose-500 text-white animate-pulse"
                                        : "text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 bg-slate-100 dark:bg-slate-800/50"
                                )}
                            >
                                <Mic size={14} />
                            </button>
                        </div>
                    </div>
                    <motion.button
                        data-testid="chat-send"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleSend()}
                        disabled={(!input.trim() && !selectedImage) || isListening}
                        className={cn(
                            "mb-1 w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                            (input.trim() || selectedImage) && !isListening
                                ? "bg-sky-500 text-white hover:bg-sky-600"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                        )}
                    >
                        <Send size={18} />
                    </motion.button>
                </div>
            </div>

            {!isKeyboardOpen && <BottomNav portal hideOnFocus={false} onFabClick={() => setSmartInputMode("voice")} />}

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

            <ConfirmDialog
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={handleClearChat}
                title="Hapus Riwayat Chat"
                description="Yakin ingin menghapus semua riwayat chat? Tindakan ini tidak dapat dibatalkan."
                confirmText="Hapus"
            />
        </div>
    );
}
