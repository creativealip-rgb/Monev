/**
 * @fileoverview Accessibility Utilities
 * 
 * Provides utilities and components for improving accessibility (a11y)
 * in the Monev application.
 * 
 * @see https://www.w3.org/WAI/WCAG21/quickref/
 */

import React from "react";

/**
 * Skip Link component for keyboard navigation
 * Allows users to skip directly to main content
 */
interface SkipLinkProps {
    targetId?: string;
    label?: string;
}

export function SkipLink({ targetId = "main-content", label = "Skip to main content" }: SkipLinkProps) {
    return (
        <a
            href={`#${targetId}`}
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-sky-600 focus:text-white focus:rounded-lg focus:shadow-lg"
        >
            {label}
        </a>
    );
}

/**
 * Visually Hidden utility - content visible to screen readers only
 */
interface VisuallyHiddenProps {
    children: React.ReactNode;
}

export function VisuallyHidden({ children }: VisuallyHiddenProps) {
    return (
        <span className="sr-only">
            {children}
        </span>
    );
}

/**
 * Live Region for announcing dynamic content changes to screen readers
 */
interface LiveRegionProps {
    children: React.ReactNode;
    polite?: boolean;
    atomic?: boolean;
}

export function LiveRegion({ children, polite = true, atomic = true }: LiveRegionProps) {
    return (
        <div
            role="status"
            aria-live={polite ? "polite" : "assertive"}
            aria-atomic={atomic}
            className="sr-only"
        >
            {children}
        </div>
    );
}

/**
 * Focus trap utility for modals and dialogs
 * Keeps focus within a container while open
 */
export function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement>) {
    React.useEffect(() => {
        if (!isActive || !containerRef.current) return;

        const container = containerRef.current;
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        function handleTabKey(e: KeyboardEvent) {
            if (e.key !== "Tab") return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }

        container.addEventListener("keydown", handleTabKey);
        firstElement.focus();

        return () => {
            container.removeEventListener("keydown", handleTabKey);
        };
    }, [isActive, containerRef]);
}

/**
 * Announce message to screen readers
 */
export function announce(message: string) {
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

/**
 * Common ARIA label patterns
 */
export const ARIA_LABELS = {
    // Navigation
    CLOSE: "Tutup",
    BACK: "Kembali",
    MENU: "Menu",
    SEARCH: "Cari",
    SETTINGS: "Pengaturan",
    
    // Actions
    ADD: "Tambah",
    EDIT: "Edit",
    DELETE: "Hapus",
    SAVE: "Simpan",
    CANCEL: "Batal",
    CONFIRM: "Konfirmasi",
    
    // Transactions
    ADD_TRANSACTION: "Tambah transaksi baru",
    VIEW_TRANSACTION: "Lihat detail transaksi",
    DELETE_TRANSACTION: "Hapus transaksi",
    
    // Forms
    REQUIRED_FIELD: "Wajib diisi",
    OPTIONAL_FIELD: "Opsional",
    INVALID_INPUT: "Input tidak valid",
    
    // Loading
    LOADING: "Memuat...",
    SUBMITTING: "Menyimpan...",
    SUCCESS: "Berhasil",
    ERROR: "Gagal",
} as const;

/**
 * Generate accessible name for transaction action buttons
 */
export function getTransactionAriaLabel(action: string, amount: number, description: string): string {
    const formattedAmount = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);

    switch (action) {
        case "view":
            return `Lihat transaksi ${description} senilai ${formattedAmount}`;
        case "edit":
            return `Edit transaksi ${description}`;
        case "delete":
            return `Hapus transaksi ${description} senilai ${formattedAmount}`;
        default:
            return `${action} transaksi`;
    }
}

/**
 * Generate accessible name for navigation items
 */
export function getNavigationAriaLabel(current: string, total: number, label: string): string {
    return `${label} (${current} dari ${total})`;
}

/**
 * Form validation error announcements
 */
export function announceFormErrors(errors: Record<string, string>) {
    const errorMessages = Object.entries(errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(". ");

    if (errorMessages) {
        announce(`Formulir memiliki ${Object.keys(errors).length} kesalahan: ${errorMessages}`);
    }
}

/**
 * Announce search/filter results
 */
export function announceResults(count: number, searchTerm?: string): string {
    const message = searchTerm
        ? `Ditemukan ${count} hasil untuk "${searchTerm}"`
        : `Ditemukan ${count} hasil`;

    announce(message);
    return message;
}

/**
 * Announce page/section changes
 */
export function announcePageChange(pageName: string): string {
    const message = `Navigasi ke halaman ${pageName}`;
    announce(message);
    return message;
}
