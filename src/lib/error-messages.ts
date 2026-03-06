/**
 * User-friendly error messages
 * Maps technical error codes to human-friendly Indonesian messages
 */

export interface ErrorMessage {
    code: string;
    title: string;
    message: string;
    suggestion?: string;
}

export const ERROR_MESSAGES: Record<string, ErrorMessage> = {
    // Network Errors
    NETWORK_ERROR: {
        code: "NETWORK_ERROR",
        title: "Gagal Terhubung",
        message: "Gagal terhubung ke server. Periksa koneksi internet Anda.",
        suggestion: "Pastikan Anda terhubung ke internet dan coba lagi.",
    },
    TIMEOUT: {
        code: "TIMEOUT",
        title: "Waktu Habis",
        message: "Permintaan memakan waktu terlalu lama.",
        suggestion: "Periksa koneksi Anda atau coba lagi nanti.",
    },

    // Authentication Errors
    UNAUTHORIZED: {
        code: "UNAUTHORIZED",
        title: "Tidak Terotorisasi",
        message: "Sesi Anda telah berakhir. Silakan login kembali.",
        suggestion: "Klik tombol login untuk masuk kembali.",
    },
    FORBIDDEN: {
        code: "FORBIDDEN",
        title: "Akses Ditolak",
        message: "Anda tidak memiliki izin untuk mengakses ini.",
        suggestion: "Upgrade paket Anda untuk mengakses fitur ini.",
    },

    // Not Found Errors
    NOT_FOUND: {
        code: "NOT_FOUND",
        title: "Tidak Ditemukan",
        message: "Data yang Anda cari tidak ditemukan.",
        suggestion: "Periksa kembali URL atau refresh halaman.",
    },

    // Validation Errors
    VALIDATION_ERROR: {
        code: "VALIDATION_ERROR",
        title: "Data Tidak Valid",
        message: "Ada kesalahan dalam data yang Anda masukkan.",
        suggestion: "Periksa kembali form dan coba lagi.",
    },
    INVALID_INPUT: {
        code: "INVALID_INPUT",
        title: "Input Tidak Valid",
        message: "Input yang dimasukkan tidak valid.",
        suggestion: "Pastikan semua field terisi dengan benar.",
    },

    // Server Errors
    SERVER_ERROR: {
        code: "SERVER_ERROR",
        title: "Kesalahan Server",
        message: "Terjadi kesalahan pada sistem kami.",
        suggestion: "Tim kami telah diberitahu. Coba lagi nanti.",
    },
    DATABASE_ERROR: {
        code: "DATABASE_ERROR",
        title: "Gagal Menyimpan",
        message: "Gagal menyimpan data ke database.",
        suggestion: "Coba lagi atau hubungi support jika masalah berlanjut.",
    },

    // Rate Limiting
    RATE_LIMITED: {
        code: "RATE_LIMITED",
        title: "Terlalu Banyak Permintaan",
        message: "Anda telah membuat terlalu banyak permintaan.",
        suggestion: "Tunggu beberapa saat sebelum mencoba lagi.",
    },
    AI_LIMIT_EXCEEDED: {
        code: "AI_LIMIT_EXCEEDED",
        title: "Limit AI Habis",
        message: "Limit penggunaan AI harian Anda telah habis.",
        suggestion: "Upgrade paket untuk mendapatkan limit lebih tinggi.",
    },

    // Resource Errors
    INSUFFICIENT_FUNDS: {
        code: "INSUFFICIENT_FUNDS",
        title: "Saldo Tidak Cukup",
        message: "Saldo tidak mencukupi untuk transaksi ini.",
        suggestion: "Tambahkan saldo atau kurangi jumlah transaksi.",
    },
    RESOURCE_EXISTS: {
        code: "RESOURCE_EXISTS",
        title: "Sudah Ada",
        message: "Data ini sudah ada dalam sistem.",
        suggestion: "Gunakan nama atau identifier yang berbeda.",
    },

    // Default
    UNKNOWN: {
        code: "UNKNOWN",
        title: "Terjadi Kesalahan",
        message: "Terjadi kesalahan yang tidak diketahui.",
        suggestion: "Coba lagi atau hubungi support jika masalah berlanjut.",
    },
};

/**
 * Get user-friendly error message from error code or error object
 */
export function getErrorMessage(errorCode?: string | null, fallbackMessage?: string): ErrorMessage {
    if (!errorCode) {
        return ERROR_MESSAGES.UNKNOWN;
    }

    return ERROR_MESSAGES[errorCode.toUpperCase()] || {
        ...ERROR_MESSAGES.UNKNOWN,
        message: fallbackMessage || ERROR_MESSAGES.UNKNOWN.message,
    };
}

/**
 * Convert API error response to user-friendly message
 */
export function parseApiError(error: any): ErrorMessage {
    // Handle error response from API
    if (error?.response?.data?.code) {
        return getErrorMessage(error.response.data.code, error.response.data.message);
    }

    if (error?.code) {
        return getErrorMessage(error.code, error.message);
    }

    if (error instanceof Error) {
        // Map common error types
        if (error.message.includes("network") || error.message.includes("fetch")) {
            return ERROR_MESSAGES.NETWORK_ERROR;
        }
        if (error.message.includes("timeout")) {
            return ERROR_MESSAGES.TIMEOUT;
        }
    }

    return ERROR_MESSAGES.UNKNOWN;
}

/**
 * Get appropriate HTTP status code for error
 */
export function getErrorStatusCode(errorCode?: string): number {
    const statusMap: Record<string, number> = {
        NETWORK_ERROR: 503,
        TIMEOUT: 408,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        VALIDATION_ERROR: 400,
        INVALID_INPUT: 400,
        SERVER_ERROR: 500,
        DATABASE_ERROR: 500,
        RATE_LIMITED: 429,
        AI_LIMIT_EXCEEDED: 429,
        INSUFFICIENT_FUNDS: 400,
        RESOURCE_EXISTS: 409,
    };

    return statusMap[errorCode?.toUpperCase() || ""] || 500;
}
