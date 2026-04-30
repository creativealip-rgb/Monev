import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileText, ShieldCheck } from "lucide-react";

const sections = [
    {
        title: "Penggunaan Layanan",
        body: "Monev membantu mencatat, menganalisis, dan merapikan data keuangan pribadi. Anda bertanggung jawab memastikan data yang dimasukkan benar dan tidak digunakan untuk aktivitas yang melanggar hukum.",
    },
    {
        title: "Akun dan Keamanan",
        body: "Jaga kerahasiaan email, password, PIN, dan perangkat yang digunakan untuk mengakses Monev. Segera ubah kredensial jika Anda mencurigai adanya akses tidak sah.",
    },
    {
        title: "Data Keuangan",
        body: "Data yang Anda simpan tetap menjadi milik Anda. Monev menyediakan fitur pencatatan dan insight, tetapi keputusan finansial akhir tetap berada pada pengguna.",
    },
    {
        title: "Fitur AI dan Rekomendasi",
        body: "Insight AI bersifat bantuan analisis, bukan nasihat keuangan profesional. Gunakan rekomendasi sebagai referensi dan sesuaikan dengan kondisi keuangan Anda.",
    },
    {
        title: "Perubahan Layanan",
        body: "Kami dapat menambah, mengubah, atau menghentikan fitur tertentu untuk menjaga kualitas, keamanan, dan keberlanjutan layanan.",
    },
];

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-4 py-6 sm:px-6 sm:py-10">
            <div className="mx-auto w-full max-w-3xl">
                <Link
                    href="/register"
                    className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                </Link>

                <section className="overflow-hidden rounded-[2rem] border border-white bg-white/85 shadow-2xl shadow-sky-900/10 backdrop-blur">
                    <div className="bg-gradient-to-br from-sky-500 to-cyan-500 px-6 py-8 text-white sm:px-8 sm:py-10">
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30">
                            <FileText className="h-7 w-7" />
                        </div>
                        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-50">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Legal
                        </p>
                        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Syarat & Ketentuan Monev</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-50 sm:text-base">
                            Ringkasan ketentuan penggunaan layanan Monev. Terakhir diperbarui: Januari 2026.
                        </p>
                    </div>

                    <div className="space-y-5 px-6 py-7 sm:px-8 sm:py-9">
                        {sections.map((section) => (
                            <article key={section.title} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                                <h2 className="mb-2 flex items-center gap-2 text-base font-bold text-slate-900">
                                    <CheckCircle2 className="h-5 w-5 shrink-0 text-sky-500" />
                                    {section.title}
                                </h2>
                                <p className="text-sm leading-6 text-slate-600">{section.body}</p>
                            </article>
                        ))}

                        <div className="rounded-2xl bg-sky-50 p-4 text-sm leading-6 text-sky-900">
                            Dengan membuat akun atau menggunakan Monev, Anda menyatakan telah membaca dan menyetujui ketentuan ini.
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
