"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { useHaptics } from "@/frontend/hooks/useHaptics";

interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    haptic?: boolean | "light" | "medium" | "heavy";
    ripple?: boolean;
}

export function Button({
    children,
    className,
    variant = "primary",
    size = "md",
    isLoading = false,
    leftIcon,
    rightIcon,
    haptic = true,
    ripple = true,
    disabled,
    onClick,
    ...props
}: ButtonProps) {
    const haptics = useHaptics();

    const variants = {
        primary: "bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40",
        secondary: "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 hover:border-sky-500",
        ghost: "bg-transparent text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20",
        danger: "bg-rose-500 text-white shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40",
    };

    const sizes = {
        sm: "px-4 py-2 text-xs gap-1.5",
        md: "px-6 py-3 text-sm gap-2",
        lg: "px-8 py-4 text-base gap-2.5",
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (haptic && !disabled && !isLoading) {
            if (typeof haptic === "string") {
                // @ts-expect-error - Dynamic haptic method
                haptics[haptic]?.();
            } else {
                haptics.tap();
            }
        }
        onClick?.(e);
    };

    return (
        <motion.button
            whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
            whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
            onClick={handleClick}
            disabled={disabled || isLoading}
            className={cn(
                "relative overflow-hidden rounded-2xl font-bold transition-all duration-200 flex items-center justify-center",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {/* Ripple effect */}
            {ripple && (
                <motion.span
                    initial={{ scale: 0, opacity: 0.5 }}
                    whileTap={{ scale: 4, opacity: 0 }}
                    className="absolute inset-0 bg-white/30 rounded-full pointer-events-none"
                    style={{ transformOrigin: "center" }}
                />
            )}

            {/* Loading state */}
            {isLoading ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                >
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center"
                >
                    {leftIcon && (
                        <motion.span
                            initial={{ x: -10 }}
                            animate={{ x: 0 }}
                            className="flex items-center"
                        >
                            {leftIcon}
                        </motion.span>
                    )}
                    <span>{children}</span>
                    {rightIcon && (
                        <motion.span
                            initial={{ x: 10 }}
                            animate={{ x: 0 }}
                            className="flex items-center"
                        >
                            {rightIcon}
                        </motion.span>
                    )}
                </motion.div>
            )}
        </motion.button>
    );
}

interface IconButtonProps extends HTMLMotionProps<"button"> {
    variant?: "default" | "ghost" | "filled";
    size?: "sm" | "md" | "lg";
    tooltip?: string;
    haptic?: boolean;
}

export function IconButton({
    children,
    className,
    variant = "default",
    size = "md",
    tooltip,
    haptic = true,
    onClick,
    ...props
}: IconButtonProps) {
    const haptics = useHaptics();

    const variants = {
        default: "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700",
        ghost: "bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
        filled: "bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-500/30",
    };

    const sizes = {
        sm: "w-8 h-8 p-1.5",
        md: "w-10 h-10 p-2",
        lg: "w-12 h-12 p-3",
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (haptic) {
            haptics.tap();
        }
        onClick?.(e);
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05, rotate: 0 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className={cn(
                "rounded-xl flex items-center justify-center transition-all duration-200",
                variants[variant],
                sizes[size],
                className
            )}
            title={tooltip}
            {...props}
        >
            {children}
        </motion.button>
    );
}

interface ToggleButtonProps extends HTMLMotionProps<"button"> {
    isActive?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    label?: string;
}

export function ToggleButton({
    isActive = false,
    leftIcon,
    rightIcon,
    label,
    onClick,
    className,
    ...props
}: ToggleButtonProps) {
    const haptics = useHaptics();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        haptics.tap();
        onClick?.(e);
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            className={cn(
                "px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all duration-200",
                isActive
                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                    : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-sky-500",
                className
            )}
            {...props}
        >
            {leftIcon && <span className="flex items-center">{leftIcon}</span>}
            {label && <span>{label}</span>}
            {rightIcon && <span className="flex items-center">{rightIcon}</span>}
        </motion.button>
    );
}
