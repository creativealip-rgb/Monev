import Link from "next/link";
import { ArrowLeft, Database, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

const sections = [
    {
        icon: Database,
        title: "Data yang Diproses",
        body: "Monev memproses data akun, preferensi, kategori, transaksi, saldo, target, tagihan, hutang, investasi, dan catatan lain yang Anda masukkan untuk menjalankan fitur aplikasi.",
    },
    {
        icon: LockKeyhole,
        title: "Keamanan Data",
        body: "Kami menerapkan kontrol akses, validasi server, dan praktik keamanan aplikasi untuk membantu menjaga data tetap terlindungi dari akses tidak sah.",
    },
    {
        icon: Sparkles,
        title: "Penggunaan Insight AI",
        body: "Data keuangan dapat digunakan untuk menghasilkan ringkasan dan insight personal di dalam akun Anda. Insight ditujukan untuk membantu pemahaman pola keuangan, bukan untuk dijual sebagai data personal.",
    },
    {
        icon: ShieldCheck,
        title: "Kontrol Pengguna",
        body: "Anda dapat memperbarui profil, menghapus data tertentu, mengekspor informasi, atau mengajukan penghapusan akun melalui fitur yang tersedia di aplikasi.",
    },
];

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-sky-50 px-4 py-6 sm:px-6 sm:py-10">
            <div className="mx-auto w-full max-w-3xl">
                <Link
                    href="/register"
                    className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                </Link>

                <section className="overflow-hidden rounded-[2rem] border border-white bg-white/85 shadow-2xl shadow-cyan-900/10 backdrop-blur">
                    <div className="bg-gradient-to-br from-cyan-500 to-sky-500 px-6 py-8 text-white sm:px-8 sm:py-10">
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30">
                            <ShieldCheck className="h-7 w-7" />
                        </div>
                        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-50">
                            Privasi
                        </p>
                        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Kebijakan Privasi Monev</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-cyan-50 sm:text-base">
                            Cara Monev mengelola dan melindungi data pengguna. Terakhir diperbarui: Januari 2026.
                        </p>
                    </div>

                    <div className="space-y-5 px-6 py-7 sm:px-8 sm:py-9">
                        {sections.map(({ icon: Icon, title, body }) => (
                            <article key={title} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                                <h2 className="mb-2 flex items-center gap-2 text-base font-bold text-slate-900">
                                    <Icon className="h-5 w-5 shrink-0 text-cyan-500" />
                                    {title}
                                </h2>
                                <p className="text-sm leading-6 text-slate-600">{body}</p>
                            </article>
                        ))}

                        <div className="rounded-2xl bg-cyan-50 p-4 text-sm leading-6 text-cyan-900">
                            Jika Anda memiliki pertanyaan privasi atau permintaan terkait data, gunakan kanal bantuan resmi Monev di halaman bantuan.
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
