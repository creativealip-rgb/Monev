"use client";

import React, { Component, ReactNode } from "react";
import { getErrorMessage, ERROR_MESSAGES } from "@/lib/error-messages";

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("[ErrorBoundary] Caught error:", error, errorInfo);
        this.setState({ errorInfo });

        // In production, log to error reporting service
        if (process.env.NODE_ENV === "production") {
            // TODO: Integrate with Sentry/LogRocket
            console.error("[Production Error]", {
                message: error.message,
                stack: error.stack,
                component: errorInfo.componentStack,
            });
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: undefined });
        window.location.reload();
    };

    handleBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            this.handleReset();
        }
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            const errorInfo = getErrorMessage(this.state.error?.message);

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
                    <div className="text-center max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-500">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                            {errorInfo.title}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {errorInfo.message}
                        </p>
                        {errorInfo.suggestion && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mb-6 italic">
                                💡 {errorInfo.suggestion}
                            </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-6 font-mono bg-gray-100 dark:bg-gray-900 p-3 rounded-lg break-all text-left">
                            {this.state.error?.message || "Unknown error"}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-colors"
                            >
                                Muat Ulang
                            </button>
                            <button
                                onClick={this.handleBack}
                                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-xl transition-colors"
                            >
                                Kembali
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
