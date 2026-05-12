import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { users } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { LucideIcon, LayoutDashboard, Users, BarChart3, Bell, Ticket, Settings, LogOut, Crown, AlarmClock } from "lucide-react";

async function checkAdmin() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login?callbackUrl=/admin");
    }

    const db = getDb();
    const userId = parseInt(session.user.id);
    const user = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, userId)).get();

    if (!user?.isAdmin) {
        redirect("/dashboard");
    }

    return { session, user: session.user };
}

const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/notifications", label: "Notifications", icon: Bell },
    { href: "/admin/notification-schedules", label: "Schedules", icon: AlarmClock },
    { href: "/admin/coupons", label: "Coupons", icon: Ticket },
    { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await checkAdmin();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
            <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed h-full z-50">
                <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center">
                            <Crown size={18} className="text-white" />
                        </div>
                        <span className="font-bold text-lg text-slate-900 dark:text-white">Monev Admin</span>
                    </div>
                </div>

                <nav className="p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
                    ))}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-800">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        Back to App
                    </Link>
                </div>
            </aside>

            <main className="flex-1 ml-64">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
            <Icon size={18} />
            {label}
        </Link>
    );
}
