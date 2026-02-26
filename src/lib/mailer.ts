import { Resend } from "resend";

// Lazy initialization to avoid build-time errors when API key is missing
const getResendClient = () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn("RESEND_API_KEY is not set. Email functionality will be disabled.");
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
        console.warn("Email not sent: RESEND_API_KEY is not configured");
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
            console.error("Gagal mengirim email verifikasi:", error);
            return { error };
        }
        return { data };
    } catch (err) {
        console.error("Exception saat mengirim email verifikasi:", err);
        return { error: err };
    }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    const resend = getResendClient();
    if (!resend) {
        console.warn("Email not sent: RESEND_API_KEY is not configured");
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
            console.error("Gagal mengirim email reset password:", error);
            return { error };
        }
        return { data };
    } catch (err) {
        console.error("Exception saat mengirim email reset password:", err);
        return { error: err };
    }
};
