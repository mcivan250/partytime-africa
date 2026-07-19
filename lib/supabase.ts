import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/src/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Not yet parameterized with <Database>: the existing app code predates the
// live schema and fails typechecking against it. New code should use the
// generated types (src/types/database.ts) and migrate call sites table by table.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type { Database };

// Helper to generate URL-friendly slugs
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Add random suffix to ensure uniqueness
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}
