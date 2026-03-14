"use client";

import { createBrowserClient } from "@supabase/ssr";

// Gunakan '!' untuk ngasih tau TypeScript kalau variable ini PASTI ada di .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cek manual buat jaga-jaga pas development
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase Environment Variables!");
}

export const createSupabaseBrowserClient = () => 
  createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );