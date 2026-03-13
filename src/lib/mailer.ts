import { Resend } from "resend";
import { createLogger } from "./logger";

const logger = createLogger("Mailer");

// Lazy initialization to avoid build-time errors when API key is missing
const getResendClient = () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        logger.warn("RESEND_API_KEY is not set. Email functionality will be disabled.");
        return null;
    }
    return new Resend(apiKey);
};

const fromEmail = process.env.EMAIL_FROM || "noreply@yourdomain.com";

// Tipe untuk environment variables Next.js
const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const sendVerificationEmail = async (email: string, token: string) => {
    const confirmLink = `${appUrl}/api/auth/verify-email?token=${token}`;

    const resend = getResendClient();
    if (!resend) {
        logger.warn("Email not sent: RESEND_API_KEY is not configured");
        return { error: "Email service not configured" };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: `Monev App <${fromEmail}>`,
            to: email,
            subject: "Monev - Verifikasi Email Anda",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #3b82f6; text-align: center;">Selamat Datang di Monev!</h2>
                    <p style="color: #475569; font-size: 16px;">Terima kasih telah mendaftar. Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda dan mengaktifkan akun Anda.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${confirmLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verifikasi Email Saya</a>
                    </div>
                    <p style="color: #64748b; font-size: 14px; text-align: center;">Jika Anda tidak mendaftar di Monev, mohon abaikan email ini.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">Atau copy paste link berikut ke browser Anda:<br/>${confirmLink}</p>
                </div>
            `,
        });

        if (error) {
            logger.error("Gagal mengirim email verifikasi", error);
            return { error };
        }
        return { data };
    } catch (err) {
        logger.error("Exception saat mengirim email verifikasi", err);
        return { error: err };
    }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    const resend = getResendClient();
    if (!resend) {
        logger.warn("Email not sent: RESEND_API_KEY is not configured");
        return { error: "Email service not configured" };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: `Monev App <${fromEmail}>`,
            to: email,
            subject: "Monev - Reset Password Anda",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #3b82f6; text-align: center;">Reset Password</h2>
                    <p style="color: #475569; font-size: 16px;">Kami menerima permintaan untuk mereset password akun Monev Anda. Klik tombol di bawah ini untuk mengatur password baru.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </div>
                    <p style="color: #64748b; font-size: 14px; text-align: center;">Jika Anda tidak meminta reset password, mohon abaikan email ini.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">Atau copy paste link berikut ke browser Anda:<br/>${resetLink}</p>
                </div>
            `,
        });

        if (error) {
            logger.error("Gagal mengirim email reset password", error);
            return { error };
        }
        return { data };
    } catch (err) {
        logger.error("Exception saat mengirim email reset password", err);
        return { error: err };
    }
};

export const sendMonthlyReportEmail = async (
    email: string,
    data: {
        userName: string;
        month: string;
        year: number;
        locale?: "id" | "en";
        stats: {
            income: number;
            expense: number;
            balance: number;
        };
        previousMonthStats?: {
            income: number;
            expense: number;
        };
        expenseCategories?: Array<{ name: string; amount: number }>;
        goalsWithProgress?: Array<{ name: string; current: number; target: number }>;
        aiInsight: string;
    },
    pdfBase64: string
) => {
    const resend = getResendClient();
    if (!resend) {
        logger.warn("Email not sent: RESEND_API_KEY is not configured");
        return { error: "Email service not configured" };
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(data.locale === "en" ? "en-US" : "id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const locale = data.locale || "id";
    const t = {
        id: {
            subject: `🌙 Laporan Keuangan ${data.month} ${data.year}`,
            greeting: "Halo",
            title: "Laporan Keuangan Bulanan",
            period: "Periode",
            summary: "Ringkasan",
            income: "Total Pemasukan",
            expense: "Total Pengeluaran",
            balance: "Saldo Bersih",
            topExpenses: "Top Pengeluaran",
            goalsProgress: "Progress Tabungan",
            aiInsight: "Insight AI",
            cta: "Lihat Dashboard",
            footer: "Laporan ini dikirim otomatis oleh Monev. Kelola keuangan dengan lebih cerdas 🚀",
            attachment: "Laporan lengkap terlampir dalam format PDF.",
            change: "Perubahan",
            up: "naik",
            down: "turun",
        },
        en: {
            subject: `🌙 Financial Report ${data.month} ${data.year}`,
            greeting: "Hi",
            title: "Monthly Financial Report",
            period: "Period",
            summary: "Summary",
            income: "Total Income",
            expense: "Total Expense",
            balance: "Net Balance",
            topExpenses: "Top Expenses",
            goalsProgress: "Savings Progress",
            aiInsight: "AI Insight",
            cta: "View Dashboard",
            footer: "This report was automatically generated by Monev. Manage your finances smarter 🚀",
            attachment: "Full report attached in PDF format.",
            change: "change",
            up: "up",
            down: "down",
        },
    };

    const labels = t[locale];
    const expenseChange = data.previousMonthStats 
        ? parseFloat(((data.stats.expense - data.previousMonthStats.expense) / data.previousMonthStats.expense * 100).toFixed(1))
        : 0;

    const topExpenses = data.expenseCategories 
        ? [...data.expenseCategories].sort((a, b) => b.amount - a.amount).slice(0, 3)
        : [];

    try {
        const { data: emailData, error } = await resend.emails.send({
            from: `Monev App <${fromEmail}>`,
            to: email,
            subject: labels.subject,
            attachments: [
                {
                    filename: `Monev_Report_${data.month}_${data.year}.pdf`,
                    content: pdfBase64,
                },
            ],
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">🌙 ${labels.title}</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${data.month} ${data.year}</p>
                    </div>
                    
                    <!-- Greeting -->
                    <div style="padding: 30px 30px 20px;">
                        <p style="color: #475569; font-size: 16px; margin: 0;">${labels.greeting} ${data.userName},</p>
                    </div>
                    
                    <!-- Summary -->
                    <div style="padding: 0 30px 30px;">
                        <p style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 15px;">${labels.summary}</p>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                            <div style="background: #dcfce7; padding: 20px; border-radius: 10px; text-align: center;">
                                <p style="color: #166534; margin: 0; font-size: 12px; font-weight: 600; text-transform: uppercase;">${labels.income}</p>
                                <p style="color: #14532d; margin: 5px 0 0 0; font-size: 20px; font-weight: bold;">${formatCurrency(data.stats.income)}</p>
                            </div>
                            <div style="background: #fee2e2; padding: 20px; border-radius: 10px; text-align: center;">
                                <p style="color: #991b1b; margin: 0; font-size: 12px; font-weight: 600; text-transform: uppercase;">${labels.expense}</p>
                                <p style="color: #7f1d1d; margin: 5px 0 0 0; font-size: 20px; font-weight: bold;">${formatCurrency(data.stats.expense)}</p>
                                ${data.previousMonthStats ? `
                                    <p style="color: ${expenseChange > 0 ? '#dc2626' : '#16a34a'}; margin: 5px 0 0 0; font-size: 11px;">
                                        ${expenseChange > 0 ? '+' : ''}${expenseChange}% ${labels.change}
                                    </p>
                                ` : ''}
                            </div>
                        </div>
                        
                        <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 25px;">
                            <p style="color: #0369a1; margin: 0; font-size: 12px; font-weight: 600; text-transform: uppercase;">${labels.balance}</p>
                            <p style="color: #075985; margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">${formatCurrency(data.stats.balance)}</p>
                        </div>
                        
                        <!-- Top Expenses -->
                        ${topExpenses.length > 0 ? `
                            <div style="margin-bottom: 25px;">
                                <p style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 10px;">${labels.topExpenses}</p>
                                ${topExpenses.map((cat, i) => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8fafc; border-radius: 8px; margin-bottom: 5px;">
                                        <span style="color: #1e293b; font-weight: 500;">${i + 1}. ${cat.name}</span>
                                        <span style="color: #64748b; font-weight: 600;">${formatCurrency(cat.amount)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        <!-- Goals Progress -->
                        ${data.goalsWithProgress && data.goalsWithProgress.length > 0 ? `
                            <div style="margin-bottom: 25px;">
                                <p style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 10px;">${labels.goalsProgress}</p>
                                ${data.goalsWithProgress.slice(0, 3).map(goal => {
                                    const progress = Math.min((goal.current / goal.target) * 100, 100);
                                    return `
                                        <div style="margin-bottom: 10px;">
                                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                                <span style="color: #1e293b; font-size: 13px; font-weight: 500;">${goal.name}</span>
                                                <span style="color: #64748b; font-size: 12px;">${formatCurrency(goal.current)} / ${formatCurrency(goal.target)}</span>
                                            </div>
                                            <div style="background: #e2e8f0; border-radius: 10px; height: 8px; overflow: hidden;">
                                                <div style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); width: ${progress}%; height: 100%;"></div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : ''}
                        
                        <!-- AI Insight -->
                        <div style="background: #fef3c7; padding: 20px; border-radius: 10px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
                            <p style="color: #92400e; margin: 0 0 10px 0; font-size: 12px; font-weight: 600; text-transform: uppercase;">💡 ${labels.aiInsight}</p>
                            <p style="color: #78350f; margin: 0; font-size: 14px; line-height: 1.6;">${data.aiInsight}</p>
                        </div>
                        
                        <!-- Attachment Info -->
                        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
                            <p style="color: #475569; margin: 0; font-size: 13px;">📄 ${labels.attachment}</p>
                        </div>
                        
                        <!-- CTA -->
                        <div style="text-align: center; margin-top: 30px; padding-top: 25px; border-top: 1px solid #e2e8f0;">
                            <a href="${appUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">
                                ${labels.cta}
                            </a>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="color: #64748b; margin: 0; font-size: 13px;">${labels.footer}</p>
                    </div>
                </div>
            `,
        });

        if (error) {
            logger.error("Gagal mengirim monthly report email", error);
            return { error };
        }
        return { data: emailData };
    } catch (err) {
        logger.error("Exception saat mengirim monthly report email", err);
        return { error: err };
    }
};

export const sendDailyRecapEmail = async (
    email: string,
    stats: {
        date: string;
        expense: number;
        income: number;
        saved: number;
        isSafe: boolean;
        dueBills?: Array<{ name: string; amount: number; daysUntilDue: number }>;
    }
) => {
    const resend = getResendClient();
    if (!resend) {
        logger.warn("Email not sent: RESEND_API_KEY is not configured");
        return { error: "Email service not configured" };
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const urgencyText = (days: number) => {
        if (days === 0) return "HARI INI";
        if (days === 1) return "BESOK";
        return `${days} hari lagi`;
    };

    try {
        const { data, error } = await resend.emails.send({
            from: `Monev App <${fromEmail}>`,
            to: email,
            subject: `🌙 Rekap Harian - ${stats.date}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">🌙 Rekap Harian</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${stats.date}</p>
                    </div>
                    
                    <!-- Stats Grid -->
                    <div style="padding: 30px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                            <div style="background: #fef3c7; padding: 20px; border-radius: 10px; text-align: center;">
                                <p style="color: #92400e; margin: 0; font-size: 12px; font-weight: 600; text-transform: uppercase;">Pengeluaran</p>
                                <p style="color: #78350f; margin: 5px 0 0 0; font-size: 20px; font-weight: bold;">${formatCurrency(stats.expense)}</p>
                            </div>
                            <div style="background: #dcfce7; padding: 20px; border-radius: 10px; text-align: center;">
                                <p style="color: #166534; margin: 0; font-size: 12px; font-weight: 600; text-transform: uppercase;">Pemasukan</p>
                                <p style="color: #14532d; margin: 5px 0 0 0; font-size: 20px; font-weight: bold;">${formatCurrency(stats.income)}</p>
                            </div>
                        </div>
                        
                        <!-- Saved Alert -->
                        <div style="${stats.isSafe ? 'background: #f0fdf4; border-left: 4px solid #22c55e;' : 'background: #fef2f2; border-left: 4px solid #ef4444;'} padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                            <h2 style="color: ${stats.isSafe ? '#166534' : '#991b1b'}; margin: 0 0 10px 0; font-size: 18px;">
                                ${stats.isSafe ? '✅ Aman!' : '⚠️ Boros!'}
                            </h2>
                            <p style="color: ${stats.isSafe ? '#166534' : '#991b1b'}; margin: 0; font-size: 14px; line-height: 1.6;">
                                ${stats.isSafe 
                                    ? `Kamu hemat ${formatCurrency(stats.saved)} hari ini. Pertahankan!` 
                                    : `Kamu overbudget ${formatCurrency(Math.abs(stats.saved))}. Lebih hemat lagi besok!`}
                            </p>
                        </div>
                        
                        <!-- Bill Reminders -->
                        ${stats.dueBills && stats.dueBills.length > 0 ? `
                            <div style="background: #fff7ed; padding: 20px; border-radius: 10px; border: 1px solid #fed7aa;">
                                <h3 style="color: #9a3412; margin: 0 0 15px 0; font-size: 16px;">⚠️ Tagihan Mendekat</h3>
                                <div style="space-y: 10px;">
                                    ${stats.dueBills.map(bill => `
                                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border-radius: 8px; margin-bottom: 8px;">
                                            <div>
                                                <p style="margin: 0; font-weight: 600; color: #1e293b;">${bill.name}</p>
                                                <p style="margin: 3px 0 0 0; font-size: 12px; color: #64748b;">${urgencyText(bill.daysUntilDue)}</p>
                                            </div>
                                            <p style="margin: 0; font-weight: bold; color: #dc2626; font-size: 16px;">${formatCurrency(bill.amount)}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- CTA -->
                        <div style="text-align: center; margin-top: 30px; padding-top: 25px; border-top: 1px solid #e2e8f0;">
                            <a href="${appUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">
                                Buka Dashboard
                            </a>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="color: #64748b; margin: 0; font-size: 13px;">Email ini dikirim otomatis oleh Monev</p>
                        <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 12px;">Kelola keuangan dengan lebih cerdas 🚀</p>
                    </div>
                </div>
            `,
        });

        if (error) {
            logger.error("Gagal mengirim daily recap email", error);
            return { error };
        }
        return { data };
    } catch (err) {
        logger.error("Exception saat mengirim daily recap email", err);
        return { error: err };
    }
};
