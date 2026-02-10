import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Important: Next.js only inlines NEXT_PUBLIC_* env vars when they are accessed
// via direct property access. Dynamic indexing like `process.env[name]` will not
// be replaced and will be undefined in the browser bundle.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserClient: SupabaseClient | null = null;

export function getBrowserSupabase() {
  if (browserClient) return browserClient;

  if (!SUPABASE_URL) throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) throw new Error("Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY");

  browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // We implement a dedicated callback route that exchanges the auth code.
      // Use PKCE so the callback receives `?code=...` (not an implicit hash fragment).
      flowType: "pkce",
      detectSessionInUrl: false
    }
  });

  return browserClient;
}
