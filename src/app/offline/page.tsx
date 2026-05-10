import Link from "next/link";

export default function OfflinePage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
            <section className="max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-8 text-center shadow-2xl backdrop-blur">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-400/20 text-3xl">
                    !
                </div>
                <h1 className="text-2xl font-black tracking-tight">Kamu sedang offline</h1>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                    Monev akan menampilkan data dan halaman yang sudah tersimpan. Coba lagi saat koneksi kembali stabil.
                </p>
                <Link
                    href="/dashboard"
                    className="mt-6 inline-flex rounded-2xl bg-sky-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-sky-300"
                >
                    Kembali ke Dashboard
                </Link>
            </section>
        </main>
    );
}
