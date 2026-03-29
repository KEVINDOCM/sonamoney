"use client";

import { createBrowserClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "./database.types";

// Gunakan '!' untuk ngasih tau TypeScript kalau variable ini PASTI ada di .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cek manual buat jaga-jaga pas development
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase Environment Variables!");
}

export const createSupabaseBrowserClient = () =>
  createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);