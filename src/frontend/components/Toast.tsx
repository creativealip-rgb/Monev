"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    CheckCircle, 
    XCircle, 
    AlertCircle, 
    Info, 
    X,
    type LucideIcon
} from "lucide-react";
import { cn } from "@/frontend/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    warning: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastConfig: Record<ToastType, {
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
    border: string;
}> = {
    success: {
        icon: CheckCircle,
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-500",
        border: "border-l-emerald-500"
    },
    error: {
        icon: XCircle,
        iconBg: "bg-rose-50",
        iconColor: "text-rose-500",
        border: "border-l-rose-500"
    },
    warning: {
        icon: AlertCircle,
        iconBg: "bg-amber-50",
        iconColor: "text-amber-500",
        border: "border-l-amber-500"
    },
    info: {
        icon: Info,
        iconBg: "bg-sky-50",
        iconColor: "text-sky-500",
        border: "border-l-sky-500"
    }
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((toast: Omit<Toast, "id">) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const newToast = { ...toast, id };
        
        setToasts(prev => [...prev, newToast]);

        const duration = toast.duration ?? 4000;
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    const success = useCallback((title: string, description?: string) => {
        addToast({ type: "success", title, description });
    }, [addToast]);

    const error = useCallback((title: string, description?: string) => {
        addToast({ type: "error", title, description });
    }, [addToast]);

    const warning = useCallback((title: string, description?: string) => {
        addToast({ type: "warning", title, description });
    }, [addToast]);

    const info = useCallback((title: string, description?: string) => {
        addToast({ type: "info", title, description });
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
    return (
        <div className="fixed bottom-20 left-0 right-0 z-[9999] flex flex-col items-center gap-2 pointer-events-none px-4 max-w-[500px] mx-auto">
            <AnimatePresence>
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                ))}
            </AnimatePresence>
        </div>
    );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const config = toastConfig[toast.type];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
                "w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 border-l-4 p-4 pointer-events-auto",
                config.border
            )}
        >
            <div className="flex items-start gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.iconBg)}>
                    <Icon className={cn("w-4 h-4", config.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{toast.title}</p>
                    {toast.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{toast.description}</p>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0"
                >
                    <X size={14} />
                </button>
            </div>
        </motion.div>
    );
}

export function useToast(): ToastContextType {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
