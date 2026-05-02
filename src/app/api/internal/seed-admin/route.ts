import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getRawDb } from "@/backend/db";

export const dynamic = "force-dynamic";

const SEED_TOKEN = "Hwhi6ncfw8oZhlXlmDtHH1xIu0eKdE9jXteWNO9D2Ao";
const ADMIN_EMAIL = "admin@monevapp.com";
const ADMIN_NAME = "Admin Monev";

export async function POST(request: Request) {
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!SEED_TOKEN || token !== SEED_TOKEN) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const password = typeof body.password === "string" ? body.password : "";

        if (password.length < 12) {
            return NextResponse.json({ ok: false, error: "Password is too short" }, { status: 400 });
        }

        const db = getRawDb();
        const hashedPassword = await bcrypt.hash(password, 10);
        const existing = db.prepare("select id from users where email = ?").get(ADMIN_EMAIL) as { id: number } | undefined;

        if (existing) {
            db.prepare(`
                update users
                set name = ?, password = ?, is_admin = 1, is_active = 1, tier = 'sultan', email_verified = unixepoch() * 1000
                where id = ?
            `).run(ADMIN_NAME, hashedPassword, existing.id);
        } else {
            db.prepare(`
                insert into users (email, email_verified, password, name, tier, is_admin, is_active, created_at)
                values (?, unixepoch() * 1000, ?, ?, 'sultan', 1, 1, unixepoch() * 1000)
            `).run(ADMIN_EMAIL, hashedPassword, ADMIN_NAME);
        }

        const admin = db.prepare(`
            select id, email, name, is_admin as isAdmin, is_active as isActive, tier
            from users
            where email = ?
        `).get(ADMIN_EMAIL);
        const adminCount = db.prepare("select count(*) as count from users where is_admin = 1").get() as { count: number };

        return NextResponse.json({ ok: true, admin, adminCount: adminCount.count });
    } catch (error) {
        console.error("Seed admin failed", error);
        return NextResponse.json({ ok: false, error: "Seed admin failed" }, { status: 500 });
    }
}
