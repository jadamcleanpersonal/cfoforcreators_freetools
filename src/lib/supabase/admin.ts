import { createClient } from "@supabase/supabase-js";

// Service-role client — server-only, bypasses RLS.
// NEVER import this in client components or expose to the browser.
// Fallback placeholder values allow builds to succeed without env vars;
// actual DB calls will fail gracefully at runtime if credentials are missing.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
