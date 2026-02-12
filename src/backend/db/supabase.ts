import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = supabaseUrl && (supabaseAnonKey || supabaseServiceKey);

// Client for client-side usage (RLS policies apply)
export const supabaseClient = isSupabaseConfigured 
    ? createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
    })
    : null;

// Admin client for server-side usage (bypasses RLS)
export const supabaseAdmin = isSupabaseConfigured && supabaseServiceKey
    ? createClient(supabaseUrl!, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    : null;

// Helper to check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
    try {
        if (supabaseAdmin) {
            const { error } = await supabaseAdmin.from("categories").select("count").single();
            return !error;
        }
        return false;
    } catch {
        return false;
    }
}

// Note: For Drizzle ORM with Supabase, install postgres driver:
// npm install postgres
// Then use drizzle-orm/postgres-js for type-safe queries